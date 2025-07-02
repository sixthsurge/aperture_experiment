import type {} from './iris'

const globalDataBufferSize = 64; 

export function setupShader(dimension : NamespacedId) {
    //enableShadows(1592, 4);

    // ------------------
    //   World Settings
    // ------------------

    worldSettings.disableShade          = true;
    worldSettings.ambientOcclusionLevel = 0.0;
    worldSettings.sunPathRotation       = 30.0;
    worldSettings.shadowFarPlane        = 120;
    worldSettings.shadowMapDistance     = 120;
    worldSettings.renderSun             = false;
    worldSettings.renderMoon            = false;
    worldSettings.renderWaterOverlay    = false;

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
      .build();

    new RawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat")
      .width(48)
      .height(48)
      .depth(48)
      .format(Format.RGB16F)
      .type(PixelType.HALF_FLOAT)
      .blur(true)
      .build();

    let radianceTex = new Texture("radiance_tex")
        .format(Format.RGB16F)
        .width(screenWidth)
        .height(screenHeight)
        .build();

    let gbufferDataTex = new Texture("gbuffer_data_tex")
        .format(Format.RGBA16)
        .width(screenWidth)
        .height(screenHeight)
        .build();

    // -----------
    //   Buffers
    // -----------

    let globalDataBuffer = new GPUBuffer(globalDataBufferSize).build();

    // ----------
    //   Passes
    // ----------

    registerShader(
        new ObjectShader("textured", Usage.TEXTURED)
          .vertex("passes/object/all_solid.vsh")
          .fragment("passes/object/all_solid.fsh")
          .target(0, gbufferDataTex)
          .build()
    );

    registerShader(
      Stage.PRE_TRANSLUCENT,
      new Compute("fill_global_data_buffer")
        .location("passes/compute/fill_global_data_buffer.csh")
        .workGroups(1, 1, 1)
        .ssbo(0, globalDataBuffer)
        .build()
    );

    registerShader(
        Stage.PRE_TRANSLUCENT,
        new Composite("deferred_shading")
          .vertex("passes/composite.vsh")
          .fragment("passes/composite/deferred_shading.fsh")
          .target(0, radianceTex)
          .ubo(0, globalDataBuffer)
          .build()
    );

    setCombinationPass(new CombinationPass("passes/combination.fsh").build());
}
