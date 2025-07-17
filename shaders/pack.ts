import type {} from './iris'
import {configureLightColors} from './script/lightColorsNull.ts'

class Textures {
    radiance: BuiltTexture;
    gbufferData: BuiltTexture;
    skyView: BuiltTexture;
    exposureHistogram: BuiltTexture;
}

class Buffers {
    globalData: BuiltBuffer;
    skySh: BuiltBuffer;
    exposure: BuiltBuffer;
}

class StreamingBuffers {
    settings: BuiltStreamingBuffer;
}

class Settings {
    pointShadowEnabled: boolean;
    manualExposureValue: number;
}

let streamingBuffers = new StreamingBuffers();
let settings = new Settings();

const streamedSettingsBufferSize = 4;
const globalDataBufferSize = 64; 

const skyViewRes = [192, 108];
const exposureHistogramBins = 256;

export function configureRenderer(renderer: RendererConfig) {
    loadSettings();

    renderer.sunPathRotation       = 30.0;
    renderer.ambientOcclusionLevel = 0.0;
    renderer.mergedHandDepth       = false;
    renderer.disableShade          = true;

    renderer.render.sun            = false;
    renderer.render.moon           = false;
    renderer.render.stars          = false;
    renderer.render.horizon        = false;
    renderer.render.clouds         = false;
    renderer.render.vignette       = false;
    renderer.render.waterOverlay   = false;
    renderer.render.entityShadow   = false;

    renderer.shadow.resolution     = 1024;
    renderer.shadow.cascades       = 4;
    renderer.shadow.enabled        = true;

    if (settings.pointShadowEnabled) {
        renderer.pointLight.maxCount             = getIntSetting("POINT_SHADOW_MAX_COUNT");
        renderer.pointLight.resolution           = getIntSetting("POINT_SHADOW_RESOLUTION");
        renderer.pointLight.nearPlane            = 0.1;
        renderer.pointLight.farPlane             = 16.0;
        renderer.pointLight.cacheRealTimeTerrain = true;
    }
}

export function configurePipeline(pipeline: PipelineConfig) {
    configureLightColors();

    let textures = createTextures(pipeline);

    let buffers = createBuffers(pipeline);

    createGlobalMacros();

    createObjectShaders(pipeline, textures, buffers);

    createPreRenderCommands(pipeline.forStage(Stage.PRE_RENDER), textures, buffers);

    createPreTranslucentCommands(pipeline.forStage(Stage.PRE_TRANSLUCENT), textures, buffers);

    createPostRenderCommands(pipeline.forStage(Stage.POST_RENDER), textures, buffers);

    createCombinationPass(pipeline, textures, buffers);

    uploadStreamedSettings();
}

export function beginFrame() {
    streamingBuffers.settings.uploadData();
}

export function onSettingsChanged() {
    loadSettings();
    uploadStreamedSettings();
}

function createTextures(pipeline: PipelineConfig): Textures {
    pipeline.importRawTexture("atmosphere_scattering_lut", "data/atmosphere_scattering.dat")
        .width(32)
        .height(64)
        .depth(32)
        .format(Format.RGB16F)
        .type(PixelType.HALF_FLOAT)
        .blur(true)
        .clamp(true)
        .load();

    pipeline.importRawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat")
        .width(48)
        .height(48)
        .depth(48)
        .format(Format.RGB16F)
        .type(PixelType.HALF_FLOAT)
        .blur(true)
        .clamp(true)
        .load();

    let textures = new Textures();

    textures.radiance = pipeline.createTexture("radiance_tex")
        .format(Format.RGBA16F)
        .width(screenWidth)
        .height(screenHeight)
        .build();

    textures.gbufferData = pipeline.createTexture("gbuffer_data_tex")
        .format(Format.RGBA32UI)
        .width(screenWidth)
        .height(screenHeight)
        .build();

    textures.skyView = pipeline.createTexture("sky_view_tex")
        .format(Format.RGB16F)
        .width(skyViewRes[0])
        .height(skyViewRes[1])
        .build();

    textures.exposureHistogram 
        = pipeline.createImageTexture("exposure_histogram_tex", "exposure_histogram_img")
            .format(Format.R32UI)
            .width(exposureHistogramBins)
            .height(1)
            .clear(true)
            .build();

    return textures;
}

function createBuffers(pipeline: PipelineConfig): Buffers {
    streamingBuffers.settings = pipeline.createStreamingBuffer(streamedSettingsBufferSize);

    let buffers = new Buffers();

    buffers.globalData = pipeline.createBuffer(globalDataBufferSize, false);

    buffers.skySh = pipeline.createBuffer(4 * 4 * 9, false);

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
        [Usage.PARTICLES, "particles", "OBJECT_PARTICLES"],
        [Usage.HAND, "hand", "OBJECT_HAND"],
        [Usage.EMISSIVE, "emissive", "OBJECT_EMISSIVE"],
        [Usage.BASIC, "basic", "OBJECT_BASIC"],
        [Usage.LINES, "lines", "OBJECT_LINES"],
    ];

    for (const [usage, name, macro] of solidPrograms) {
        pipeline.createObjectShader(name, usage)
            .vertex("program/object/all_solid.vsh")
            .fragment("program/object/all_solid.fsh")
            .target(0, textures.gbufferData)
            .define(macro, "1")
            .compile();
    }

    // Translucent 

    const translucentPrograms: [ProgramUsage, string, string][] = [
        [Usage.TERRAIN_TRANSLUCENT, "terrain_translucent", "OBJECT_TERRAIN_TRANSLUCENT"],
        [Usage.ENTITY_TRANSLUCENT, "entity_translucent", "OBJECT_ENTITY_TRANSLUCENT"],
        [Usage.BLOCK_ENTITY_TRANSLUCENT, "block_entity_translucent", "OBJECT_BLOCK_ENTITY_TRANSLUCENT"],
        [Usage.PARTICLES_TRANSLUCENT, "particles_translucent", "OBJECT_PARTICLES_TRANSLUCENT"],
        [Usage.TRANSLUCENT_HAND, "translucent_hand", "OBJECT_TRANSLUCENT_HAND"],
        [Usage.TEXTURED, "textured", "OBJECT_TEXTURED"],
        [Usage.TEXT, "text", "OBJECT_TEXT"],
    ];

    for (const [usage, name, macro] of translucentPrograms) {
        pipeline.createObjectShader(name, usage)
            .vertex("program/object/all_translucent.vsh")
            .fragment("program/object/all_translucent.fsh")
            .target(0, textures.radiance)
            .define(macro, "1")
            .compile();
    }

    // Shadow

    pipeline.createObjectShader("shadow", Usage.SHADOW)
        .vertex("program/object/shadow.vsh")
        .fragment("program/object/shadow.fsh")
        .compile();

    if (settings.pointShadowEnabled) {
        pipeline.createObjectShader("shadow_point", Usage.POINT)
            .vertex("program/object/shadow_point.vsh")
            .fragment("program/object/shadow_point.fsh")
            .compile();
    }
}

function createPreRenderCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    commands.createCompute("fill_global_data_buffer")
        .location("program/pre_render/fill_global_data_buffer.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, buffers.globalData)
        .compile();

    commands.barrier(SSBO_BIT | UBO_BIT);

    commands.createComposite("render_sky_view")
        .vertex("program/composite.vsh")
        .fragment("program/pre_render/render_sky_view.fsh")
        .target(0, textures.skyView)
        .ubo(0, buffers.globalData)
        .compile();

    commands.createCompute("gen_sky_sh")
        .location("program/pre_render/gen_sky_sh.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, buffers.skySh)
        .compile();

    commands.barrier(SSBO_BIT | UBO_BIT);

    commands.end();
}

function createPreTranslucentCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    commands.createComposite("deferred_shading")
        .vertex("program/composite.vsh")
        .fragment("program/pre_translucent/deferred_shading.fsh")
        .target(0, textures.radiance)
        .ubo(0, buffers.globalData)
        .ubo(1, buffers.skySh)
        .compile();

    commands.end();
}

function createPostRenderCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    createExposureCommands(commands.subList("Exposure"), textures, buffers);

    commands.end();
}

function createExposureCommands(commands: CommandList, textures: Textures, buffers: Buffers) {
    commands.createCompute("clear_histogram")
        .location("program/post_render/exposure/clear_histogram.csh")
        .workGroups(1, 1, 1)
        .compile();

    commands.barrier(IMAGE_BIT | FETCH_BIT);

    commands.createCompute("build_histogram")
        .location("program/post_render/exposure/build_histogram.csh")
        .workGroups(
            Math.ceil(screenWidth / 32), 
            Math.ceil(screenHeight / 32), 
            1
        )
        .compile();

    commands.barrier(IMAGE_BIT | FETCH_BIT);

    commands.createCompute("calculate_exposure")
        .location("program/post_render/exposure/calculate_exposure.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, buffers.exposure)
        .compile();

    commands.barrier(SSBO_BIT | UBO_BIT);
    
    commands.end();
}

function createCombinationPass(pipeline: PipelineConfig, textures: Textures, buffers: Buffers) {
    pipeline.createCombinationPass("program/combination.fsh")
        .ubo(0, streamingBuffers.settings)
        .ubo(1, buffers.exposure)
        .compile()
}

function loadSettings() {
    settings.pointShadowEnabled = getBoolSetting("POINT_SHADOW");
    settings.manualExposureValue = getFloatSetting("EXPOSURE");
}

function uploadStreamedSettings() {
    streamingBuffers.settings.setFloat(0, settings.manualExposureValue);
}

function createGlobalMacros() {
    if (settings.pointShadowEnabled) {
        defineGlobally("POINT_SHADOW", "1");
    }

    defineGlobally("HISTOGRAM_BINS", exposureHistogramBins);
}
