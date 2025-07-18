import type {} from "./iris";
import { Flipper, defineGloballyIf } from "./scripts/helpers.ts";
import { configureLightColors } from "./scripts/lightColorsNull.ts";

class Textures {
    radiance: BuiltTexture;
    gbufferData: BuiltTexture;
    skyView: BuiltTexture;
    exposureHistogram: BuiltTexture;
    bloomTilesA: BuiltTexture;
    bloomTilesB: BuiltTexture;
}

class Buffers {
    globalData: BuiltBuffer;
    skySh: BuiltBuffer;
    exposure: BuiltBuffer;
}

class StreamingBuffers {
    settings: BuiltStreamingBuffer;
}

class StateReferences {
    bloom: StateReference;
    autoExposure: StateReference;
}

let streamingBuffers = new StreamingBuffers();
let stateReferences = new StateReferences();

const streamedSettingsBufferSize = 64;
const globalDataBufferSize = 64;

const skyViewRes = [192, 108];
const exposureHistogramBins = 256;

export function configureRenderer(renderer: RendererConfig) {
    renderer.sunPathRotation = 30.0;
    renderer.ambientOcclusionLevel = 0.0;
    renderer.mergedHandDepth = false;
    renderer.disableShade = true;

    renderer.render.sun = false;
    renderer.render.moon = false;
    renderer.render.stars = false;
    renderer.render.horizon = false;
    renderer.render.clouds = false;
    renderer.render.vignette = false;
    renderer.render.waterOverlay = false;
    renderer.render.entityShadow = false;

    renderer.shadow.resolution = 1024;
    renderer.shadow.cascades = 4;
    renderer.shadow.enabled = true;

    if (getBoolSetting("pointShadowEnabled")) {
        renderer.pointLight.maxCount = getIntSetting("pointShadowMaxCount");
        renderer.pointLight.resolution = getIntSetting("pointShadowResolution");
        renderer.pointLight.nearPlane = 0.1;
        renderer.pointLight.farPlane = 16.0;
        renderer.pointLight.cacheRealTimeTerrain = true;
        renderer.pointLight.realTimeCount = 2;
        renderer.pointLight.maxUpdates = 1;
        renderer.pointLight.updateThreshold = 0.01;
    }
}

export function configurePipeline(pipeline: PipelineConfig) {
    configureLightColors();

    let textures = createTextures(pipeline);

    let buffers = createBuffers(pipeline);

    createStateReferences();

    createGlobalMacros();

    createObjectShaders(pipeline, textures, buffers);

    createPreRenderCommands(pipeline.forStage(Stage.PRE_RENDER), textures, buffers);

    createPreTranslucentCommands(pipeline.forStage(Stage.PRE_TRANSLUCENT), textures, buffers);

    createPostRenderCommands(pipeline.forStage(Stage.POST_RENDER), textures, buffers);

    createCombinationPass(pipeline, textures, buffers);

    applyDynamicSettings();
}

export function beginFrame() {
    streamingBuffers.settings.uploadData();
}

export function onSettingsChanged() {
    applyDynamicSettings();
}

function createTextures(pipeline: PipelineConfig): Textures {
    pipeline
        .importRawTexture("atmosphere_scattering_lut", "data/atmosphere_scattering.dat")
        .width(32)
        .height(64)
        .depth(32)
        .format(Format.RGB16F)
        .type(PixelType.HALF_FLOAT)
        .blur(true)
        .clamp(true)
        .load();

    pipeline
        .importRawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat")
        .width(48)
        .height(48)
        .depth(48)
        .format(Format.RGB16F)
        .type(PixelType.HALF_FLOAT)
        .blur(true)
        .clamp(true)
        .load();

    let textures = new Textures();

    textures.radiance = pipeline
        .createTexture("radiance_tex")
        .format(Format.R11F_G11F_B10F)
        .width(screenWidth)
        .height(screenHeight)
        .clear(false)
        .build();

    textures.gbufferData = pipeline
        .createTexture("gbuffer_data_tex")
        .format(Format.RGBA32UI)
        .width(screenWidth)
        .height(screenHeight)
        .clear(false)
        .build();

    textures.skyView = pipeline
        .createTexture("sky_view_tex")
        .format(Format.R11F_G11F_B10F)
        .width(skyViewRes[0])
        .height(skyViewRes[1])
        .clear(false)
        .build();

    textures.bloomTilesA = pipeline
        .createImageTexture("bloom_tiles_tex_a", "bloom_tiles_img_a")
        .format(Format.R11F_G11F_B10F)
        .width(screenWidth)
        .height(screenHeight)
        .mipmap(true)
        .clear(false)
        .build();

    textures.bloomTilesB = pipeline
        .createImageTexture("bloom_tiles_tex_b", "bloom_tiles_img_b")
        .format(Format.R11F_G11F_B10F)
        .width(screenWidth)
        .height(screenHeight)
        .mipmap(true)
        .clear(false)
        .build();

    textures.exposureHistogram = pipeline
        .createImageTexture("exposure_histogram_tex", "exposure_histogram_img")
        .format(Format.R32UI)
        .width(exposureHistogramBins)
        .height(1)
        .clear(false)
        .build();

    return textures;
}

function createBuffers(pipeline: PipelineConfig): Buffers {
    streamingBuffers.settings = pipeline.createStreamingBuffer(streamedSettingsBufferSize);

    let buffers = new Buffers();

    buffers.globalData = pipeline.createBuffer(globalDataBufferSize, false);

    buffers.skySh = pipeline.createBuffer(4 * 4 * 10, false);

    buffers.exposure = pipeline.createBuffer(4 * 2, false);

    return buffers;
}

function createObjectShaders(pipeline: PipelineConfig, textures: Textures, buffers: Buffers) {
    // Solid

    const solidPrograms: [ProgramUsage, string, string][] = [
        [Usage.TERRAIN_SOLID, "terrain_solid", "OBJECT_TERRAIN_SOLID"],
        [Usage.TERRAIN_CUTOUT, "terrain_cutout", "OBJECT_TERRAIN_CUTOUT"],
        [Usage.ENTITY_SOLID, "entity_solid", "OBJECT_ENTITY_SOLID"],
        [Usage.ENTITY_CUTOUT, "entity_cutout", "OBJECT_ENTITY_CUTOUT"],
        [Usage.BLOCK_ENTITY, "block_entity", "OBJECT_BLOCK_ENTITY"],
        [Usage.ENTITY_TRANSLUCENT, "entity_translucent", "OBJECT_ENTITY_TRANSLUCENT"],
        [
            Usage.BLOCK_ENTITY_TRANSLUCENT,
            "block_entity_translucent",
            "OBJECT_BLOCK_ENTITY_TRANSLUCENT",
        ],
        [Usage.PARTICLES, "particles", "OBJECT_PARTICLES"],
        [Usage.HAND, "hand", "OBJECT_HAND"],
        [Usage.EMISSIVE, "emissive", "OBJECT_EMISSIVE"],
        [Usage.BASIC, "basic", "OBJECT_BASIC"],
        [Usage.LINES, "lines", "OBJECT_LINES"],
    ];

    for (const [usage, name, macro] of solidPrograms) {
        pipeline
            .createObjectShader(name, usage)
            .vertex("programs/object/all_solid.vsh")
            .fragment("programs/object/all_solid.fsh")
            .target(0, textures.gbufferData)
            .define(macro, "1")
            .compile();
    }

    // Translucent

    const translucentPrograms: [ProgramUsage, string, string][] = [
        [Usage.TERRAIN_TRANSLUCENT, "terrain_translucent", "OBJECT_TERRAIN_TRANSLUCENT"],
        [Usage.PARTICLES_TRANSLUCENT, "particles_translucent", "OBJECT_PARTICLES_TRANSLUCENT"],
        [Usage.TRANSLUCENT_HAND, "translucent_hand", "OBJECT_TRANSLUCENT_HAND"],
        [Usage.TEXTURED, "textured", "OBJECT_TEXTURED"],
        [Usage.TEXT, "text", "OBJECT_TEXT"],
    ];

    for (const [usage, name, macro] of translucentPrograms) {
        pipeline
            .createObjectShader(name, usage)
            .vertex("programs/object/all_translucent.vsh")
            .fragment("programs/object/all_translucent.fsh")
            .target(0, textures.radiance)
            .ubo(0, buffers.globalData)
            .define(macro, "1")
            .compile();
    }

    // Shadow

    pipeline
        .createObjectShader("shadow", Usage.SHADOW)
        .vertex("programs/object/shadow.vsh")
        .fragment("programs/object/shadow.fsh")
        .compile();

    if (getBoolSetting("pointShadowEnabled")) {
        pipeline
            .createObjectShader("shadow_point", Usage.POINT)
            .vertex("programs/object/shadow_point.vsh")
            .fragment("programs/object/shadow_point.fsh")
            .compile();
    }
}

function createPreRenderCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    commands
        .createCompute("fill_global_data_buffer")
        .location("programs/pre_render/fill_global_data_buffer.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, buffers.globalData)
        .compile();

    commands.barrier(SSBO_BIT | UBO_BIT);

    commands
        .createComposite("render_sky_view")
        .vertex("programs/composite.vsh")
        .fragment("programs/pre_render/render_sky_view.fsh")
        .target(0, textures.skyView)
        .ubo(0, buffers.globalData)
        .compile();

    commands
        .createCompute("gen_sky_sh")
        .location("programs/pre_render/gen_sky_sh.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, buffers.skySh)
        .compile();

    commands.barrier(SSBO_BIT | UBO_BIT);

    commands.end();
}

function createPreTranslucentCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    commands
        .createComposite("deferred_shading")
        .vertex("programs/composite.vsh")
        .fragment("programs/pre_translucent/deferred_shading.fsh")
        .target(0, textures.radiance)
        .ubo(0, buffers.globalData)
        .ubo(1, buffers.skySh)
        .compile();

    commands.end();
}

function createPostRenderCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    createBloomCommands(commands.subList("Bloom"), textures, textures.radiance);
    createExposureCommands(commands.subList("Auto Exposure"), textures, buffers);

    commands.end();
}

function createExposureCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    commands
        .createCompute("clear_histogram")
        .location("programs/post_render/exposure/clear_histogram.csh")
        .workGroups(1, 1, 1)
        .state(stateReferences.autoExposure)
        .compile();

    commands.barrier(IMAGE_BIT | FETCH_BIT);

    commands
        .createCompute("build_histogram")
        .location("programs/post_render/exposure/build_histogram.csh")
        .workGroups(Math.ceil(screenWidth / 32), Math.ceil(screenHeight / 32), 1)
        .state(stateReferences.autoExposure)
        .compile();

    commands.barrier(IMAGE_BIT | FETCH_BIT);

    commands
        .createCompute("calculate_exposure")
        .location("programs/post_render/exposure/calculate_exposure.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, buffers.exposure)
        .state(stateReferences.autoExposure)
        .compile();

    commands.barrier(SSBO_BIT | UBO_BIT);

    commands.end();
}

function createBloomCommands(
    commands: CommandList, 
    textures: Textures, 
    sourceTexture: BuiltTexture
) {
    const maxLod = Math.log(Math.max(screenWidth, screenHeight)) / Math.log(2);
    const tileCount = Math.min(getIntSetting("bloomTileCount"), maxLod);
    let textureFlipper = new Flipper(textures.bloomTilesA, textures.bloomTilesB); 

    // Downsampling

    let downsampling = commands.subList("Downsampling");

    for (let dstLod = 1; dstLod < tileCount; dstLod++) {
        // Read from sourceTexture for lod 0 (avoid initial copy)
        let srcLod = dstLod - 1;
        let srcTex = srcLod == 0 ? sourceTexture : textureFlipper.front();

        downsampling
            .createComposite(`downsample ${dstLod}`)
            .vertex("programs/composite.vsh")
            .fragment("programs/post_render/bloom/downsample.fsh")
            .target(0, textureFlipper.front(), dstLod)
            .define("SRC_TEX", srcTex.name())
            .define("SRC_LOD", srcLod.toString())
            .define("DST_LOD", dstLod.toString())
            .state(stateReferences.bloom)
            .compile();
    }

    downsampling.end();

    // Blur

    let blur = commands.subList("Blur");

    const useComputeBlur = true;
    const workGroupSize = 64;

    for (let lod = 0; lod < tileCount; lod++) {
        // Read from sourceTexture for lod 0 (avoid initial copy)
        let tex = lod == 0 ? sourceTexture : textureFlipper.front();
        let mipSuffix = lod == 0 ? "" : `_mip${lod}`;
        let mipScale = Math.pow(2, lod);

        if (useComputeBlur) {
            blur.createCompute(`blur ${lod} horizontal (compute)`)
                .location("programs/post_render/bloom/blur_h.csh")
                .workGroups(
                    Math.ceil(screenWidth / (workGroupSize * mipScale)),
                    Math.ceil(screenHeight / mipScale),
                    1
                )
                .define("WORK_GROUP_SIZE", workGroupSize.toString())
                .define("DST_IMG", textureFlipper.back().imageName() + mipSuffix)
                .define("SRC_TEX", tex.name())
                .define("SRC_LOD", lod.toString())
                .compile();

            blur.barrier(IMAGE_BIT | FETCH_BIT);

            textureFlipper.flip();

            blur.createCompute(`blur ${lod} vertical (compute)`)
                .location("programs/post_render/bloom/blur_v.csh")
                .workGroups(
                    Math.ceil(screenWidth / mipScale),
                    Math.ceil(screenHeight / (workGroupSize * mipScale)),
                    1
                )
                .define("WORK_GROUP_SIZE", workGroupSize.toString())
                .define("DST_IMG", textureFlipper.back().imageName() + mipSuffix)
                .define("SRC_TEX", textureFlipper.front().name())
                .define("SRC_LOD", lod.toString())
                .compile();

            blur.barrier(IMAGE_BIT | FETCH_BIT);

            textureFlipper.flip();
        } else {
            // Horizontal
            blur.createComposite(`blur ${lod} horizontal (fragment)`)
                .vertex("programs/composite.vsh")
                .fragment("programs/post_render/bloom/blur.fsh")
                .target(0, textureFlipper.back(), lod)
                .define("SRC_TEX", tex.name())
                .define("SRC_LOD", lod.toString())
                .state(stateReferences.bloom)
                .compile();

            textureFlipper.flip();

            // Vertical
            blur.createComposite(`blur ${lod} vertical (fragment)`)
                .vertex("programs/composite.vsh")
                .fragment("programs/post_render/bloom/blur.fsh")
                .target(0, textureFlipper.back(), lod)
                .define("BLUR_VERTICAL", "")
                .define("SRC_TEX", textureFlipper.front().name())
                .define("SRC_LOD", lod.toString())
                .state(stateReferences.bloom)
                .compile();

            textureFlipper.flip();
        }
    }

    blur.end();

    // Upsampling 
    // Final upsample from 1 to 0 is performed in the program where bloom is applied (save unneeded write)

    let upsampling = commands.subList("Upsampling");

    for (let dstLod = tileCount - 2; dstLod >= 1; dstLod--) {
        let srcLod = dstLod + 1;

        upsampling
            .createComposite(`upsample ${dstLod}`)
            .vertex("programs/composite.vsh")
            .fragment("programs/post_render/bloom/upsample.fsh")
            .target(0, textureFlipper.back(), dstLod)
            .define("SRC_TEX", textureFlipper.front().name())
            .define("SRC_LOD", srcLod.toString())
            .define("DST_LOD", dstLod.toString())
            .state(stateReferences.bloom)
            .compile();

        textureFlipper.flip();
    }

    upsampling.end();

    commands.end();
}

function createCombinationPass(pipeline: PipelineConfig, textures: Textures, buffers: Buffers) {
    pipeline
        .createCombinationPass("programs/combination.fsh")
        .ubo(0, streamingBuffers.settings)
        .ubo(1, buffers.exposure)
        .compile();
}

function applyDynamicSettings() {
    // State references

    stateReferences.bloom.setEnabled(getBoolSetting("bloomEnabled"));
    stateReferences.autoExposure.setEnabled(getBoolSetting("autoExposureEnabled"));

    // Streamed settings

    streamingBuffers.settings.setBool(0, getBoolSetting("bloomEnabled"));
    streamingBuffers.settings.setFloat(4, getFloatSetting("bloomIntensity"));
    streamingBuffers.settings.setBool(8, getBoolSetting("autoExposureEnabled"));
    streamingBuffers.settings.setFloat(12, getFloatSetting("manualExposureValue"));
}

function createGlobalMacros() {
    defineGlobally("TEXTURE_FORMAT", "TEXTURE_FORMAT_LAB");
    defineGlobally("HISTOGRAM_BINS", exposureHistogramBins);

    defineGloballyIf("USE_NORMAL_MAP", 1, getBoolSetting("normalMapEnabled"));
    defineGloballyIf("USE_SPECULAR_MAP", 1, getBoolSetting("specularMapEnabled"));
    defineGloballyIf("POINT_SHADOW", 1, getBoolSetting("pointShadowEnabled"));
    defineGlobally("BLOOM_TILES", getIntSetting("bloomTileCount"));
}

function createStateReferences() {
    stateReferences.bloom = new StateReference();
    stateReferences.autoExposure = new StateReference();
}
