import type {} from './iris'
import {configureLightColors} from './script/lightColorsNull.ts'

const globalDataBufferSize = 64; 

const exposureHistogramBins = 256;
const exposureHistogramPixelsPerThreadX = 2;
const exposureHistogramPixelsPerThreadY = 2;

let streamedSettingsBuffer: BuiltStreamingBuffer;

export function configureRenderer(renderer: RendererConfig) {
    renderer.disableShade          = true;
    renderer.ambientOcclusionLevel = 0.0;
    renderer.sunPathRotation       = 30.0;

    renderer.render.sun            = false;
    renderer.render.moon           = false;
    renderer.render.waterOverlay   = false;

    renderer.shadow.enabled        = true;
    renderer.shadow.resolution     = 1024;
    renderer.shadow.cascades       = 4;

    let pointLightsEnabled = getBoolSetting("POINT_SHADOW");
    if (pointLightsEnabled) {
        renderer.pointLight.maxCount             = getIntSetting("POINT_SHADOW_MAX_COUNT");
        renderer.pointLight.resolution           = getIntSetting("POINT_SHADOW_RESOLUTION");
        renderer.pointLight.nearPlane            = 0.1;
        renderer.pointLight.farPlane             = 16.0;
        renderer.pointLight.cacheRealTimeTerrain = true;
    }
}

export function configurePipeline(pipeline: PipelineConfig) {
    configureLightColors();

    // ------------
    //   Settings
    // ------------

    let pointLightsEnabled = getBoolSetting("POINT_SHADOW");

    // ------------
    //   Textures
    // ------------

    new RawTexture("atmosphere_scattering_lut", "data/atmosphere_scattering.dat")
        .width(32)
        .height(64)
        .depth(32)
        .format(Format.RGB16F)
        .type(PixelType.HALF_FLOAT)
        .blur(true)
        .clamp(true)
        .build();

    new RawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat")
        .width(48)
        .height(48)
        .depth(48)
        .format(Format.RGB16F)
        .type(PixelType.HALF_FLOAT)
        .blur(true)
        .clamp(true)
        .build();

    let radianceTex = new Texture("radiance_tex")
        .format(Format.RGBA16F)
        .width(screenWidth)
        .height(screenHeight)
        .build();

    let gbufferDataTex = new Texture("gbuffer_data_tex")
        .format(Format.RGBA16)
        .width(screenWidth)
        .height(screenHeight)
        .build();

    let skyViewTex = new Texture("sky_view_tex")
        .format(Format.RGB16F)
        .width(192)
        .height(108)
        .build();

    // -----------
    //   Buffers
    // -----------

    streamedSettingsBuffer = new StreamingBuffer(4)
        .build();

    let globalDataBuffer = new GPUBuffer(globalDataBufferSize).build();

    let skyShBuffer = new GPUBuffer(4 * 4 * 9).build();

    let exposureHistogramBuffer = new GPUBuffer(4 * 4 * exposureHistogramBins).build();

    let exposureBuffer = new GPUBuffer(4 * 2).build();

    // ----------
    //   Macros
    // ----------

    if (pointLightsEnabled) {
        defineGlobally("POINT_SHADOW", "1");
    }

    defineGlobally("HISTOGRAM_BINS", exposureHistogramBins);

    // ------------
    //   Programs
    // ------------

    pipeline.registerObjectShader(
        new ObjectShader("shadow", Usage.SHADOW)
            .vertex("program/object/shadow.vsh")
            .fragment("program/object/shadow.fsh")
            .build()
    );

    if (pointLightsEnabled) {
        pipeline.registerObjectShader(
            new ObjectShader("shadow_point", Usage.POINT)
                .vertex("program/object/shadow_point.vsh")
                .fragment("program/object/shadow_point.fsh")
                .build()
        );
    }

    const solidPrograms: [ProgramUsage, string, string][] = [
        [Usage.TERRAIN_SOLID, "terrain_solid", "OBJECT_TERRAIN_SOLID"],
        [Usage.TERRAIN_CUTOUT, "terrain_cutout", "OBJECT_TERRAIN_CUTOUT"],
    ];

    for (const [usage, name, macro] of solidPrograms) {
        pipeline.registerObjectShader(
            new ObjectShader(name, usage)
                .vertex("program/object/all_solid.vsh")
                .fragment("program/object/all_solid.fsh")
                .target(0, gbufferDataTex)
                .define(macro, "1")
                .build()
        );
    }

    pipeline.registerPostPass(
        Stage.PRE_RENDER,
        new Compute("fill_global_data_buffer")
            .location("program/pre_render/fill_global_data_buffer.csh")
            .workGroups(1, 1, 1)
            .ssbo(0, globalDataBuffer)
            .ssbo(1, exposureHistogramBuffer)
            .build()
    );
    pipeline.addBarrier(Stage.PRE_RENDER, SSBO_BIT | UBO_BIT)

    pipeline.registerPostPass(
        Stage.PRE_RENDER,
        new Composite("render_sky_view")
            .vertex("program/composite.vsh")
            .fragment("program/pre_render/render_sky_view.fsh")
            .target(0, skyViewTex)
            .ubo(0, globalDataBuffer)
            .build()
    );

    pipeline.registerPostPass(
        Stage.PRE_RENDER,
        new Compute("gen_sky_sh")
            .location("program/pre_render/gen_sky_sh.csh")
            .workGroups(1, 1, 1)
            .ssbo(0, skyShBuffer)
            .build()
    );
    pipeline.addBarrier(Stage.PRE_RENDER, SSBO_BIT | UBO_BIT)

    pipeline.registerPostPass(
        Stage.PRE_TRANSLUCENT,
        new Composite("deferred_shading")
            .vertex("program/composite.vsh")
            .fragment("program/pre_translucent/deferred_shading.fsh")
            .target(0, radianceTex)
            .ubo(0, globalDataBuffer)
            .ubo(1, skyShBuffer)
            .build()
    );

    pipeline.registerPostPass(
        Stage.POST_RENDER,
        new Compute("exposure_build_histogram")
            .location("program/post_render/exposure_build_histogram.csh")
            .workGroups(
                Math.ceil(screenWidth / (16 * exposureHistogramPixelsPerThreadX)), 
                Math.ceil(screenHeight / (16 * exposureHistogramPixelsPerThreadY)), 
                1
            )
            .ssbo(0, exposureHistogramBuffer)
            .define("PIXELS_PER_THREAD_X", exposureHistogramPixelsPerThreadX.toString())
            .define("PIXELS_PER_THREAD_Y", exposureHistogramPixelsPerThreadY.toString())
            .build()
    );
    pipeline.addBarrier(Stage.POST_RENDER, SSBO_BIT | UBO_BIT)

    pipeline.registerPostPass(
        Stage.POST_RENDER,
        new Compute("exposure_final")
            .location("program/post_render/exposure_final.csh")
            .workGroups(1, 1, 1)
            .ssbo(0, exposureBuffer)
            .ubo(0, exposureHistogramBuffer)
            .build()
    );
    pipeline.addBarrier(Stage.POST_RENDER, SSBO_BIT | UBO_BIT)

    pipeline.setCombinationPass(
        new CombinationPass("program/combination.fsh")
            .ubo(0, streamedSettingsBuffer)
            .ubo(1, exposureBuffer)
            .build()
    );

    onSettingsChanged();
}

export function beginFrame() {
    streamedSettingsBuffer.uploadData();
}

export function onSettingsChanged() {
    streamedSettingsBuffer.setFloat(0, getFloatSetting("EXPOSURE"));
}
