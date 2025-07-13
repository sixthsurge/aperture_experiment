// script/lightColorsNull.ts
function hexToRgb(hex) {
  const bigint = parseInt(hex.substring(1), 16);
  const r = bigint >> 16 & 255;
  const g = bigint >> 8 & 255;
  const b = bigint & 255;
  return { r, g, b };
}
function setLightColorEx(hex, ...blocks) {
  const color = hexToRgb(hex);
  blocks.forEach((block) => setLightColor(new NamespacedId(block), color.r, color.g, color.b, 255));
}
function configureLightColors() {
  setLightColorEx("#362b21", "brown_mushroom");
  setLightColorEx("#f39849", "campfire");
  setLightColorEx("#935b2c", "cave_vines", "cave_vines_plant");
  setLightColorEx("#d39f6d", "copper_bulb", "waxed_copper_bulb");
  setLightColorEx("#d39255", "exposed_copper_bulb", "waxed_exposed_copper_bulb");
  setLightColorEx("#cf833a", "weathered_copper_bulb", "waxed_weathered_copper_bulb");
  setLightColorEx("#87480b", "oxidized_copper_bulb", "waxed_oxidized_copper_bulb");
  setLightColorEx("#7f17a8", "crying_obsidian", "respawn_anchor");
  setLightColorEx("#371559", "enchanting_table");
  setLightColorEx("#bea935", "firefly_bush");
  setLightColorEx("#5f9889", "glow_lichen");
  setLightColorEx("#d3b178", "glowstone");
  setLightColorEx("#c2985a", "jack_o_lantern");
  setLightColorEx("#f39e49", "lantern");
  setLightColorEx("#b8491c", "lava", "magma_block");
  setLightColorEx("#650a5e", "nether_portal");
  setLightColorEx("#dfac47", "ochre_froglight");
  setLightColorEx("#e075e8", "pearlescent_froglight");
  setLightColorEx("#f9321c", "redstone_torch", "redstone_wall_torch");
  setLightColorEx("#e0ba42", "redstone_lamp");
  setLightColorEx("#f9321c", "redstone_ore", "deepslate_redstone_ore");
  setLightColorEx("#8bdff8", "sea_lantern");
  setLightColorEx("#918f34", "shroomlight");
  setLightColorEx("#28aaeb", "soul_torch", "soul_wall_torch", "soul_campfire");
  setLightColorEx("#f3b549", "torch", "wall_torch");
  setLightColorEx("#6e0000", "vault");
  setLightColorEx("#63e53c", "verdant_froglight");
  setLightColorEx("#322638", "tinted_glass");
  setLightColorEx("#ffffff", "white_stained_glass", "white_stained_glass_pane");
  setLightColorEx("#999999", "light_gray_stained_glass", "light_gray_stained_glass_pane");
  setLightColorEx("#4c4c4c", "gray_stained_glass", "gray_stained_glass_pane");
  setLightColorEx("#191919", "black_stained_glass", "black_stained_glass_pane");
  setLightColorEx("#664c33", "brown_stained_glass", "brown_stained_glass_pane");
  setLightColorEx("#993333", "red_stained_glass", "red_stained_glass_pane");
  setLightColorEx("#d87f33", "orange_stained_glass", "orange_stained_glass_pane");
  setLightColorEx("#e5e533", "yellow_stained_glass", "yellow_stained_glass_pane");
  setLightColorEx("#7fcc19", "lime_stained_glass", "lime_stained_glass_pane");
  setLightColorEx("#667f33", "green_stained_glass", "green_stained_glass_pane");
  setLightColorEx("#4c7f99", "cyan_stained_glass", "cyan_stained_glass_pane");
  setLightColorEx("#6699d8", "light_blue_stained_glass", "light_blue_stained_glass_pane");
  setLightColorEx("#334cb2", "blue_stained_glass", "blue_stained_glass_pane");
  setLightColorEx("#7f3fb2", "purple_stained_glass", "purple_stained_glass_pane");
  setLightColorEx("#b24cd8", "magenta_stained_glass", "magenta_stained_glass_pane");
  setLightColorEx("#f27fa5", "pink_stained_glass", "pink_stained_glass_pane");
  setLightColorEx(
    "#c07047",
    "candle",
    "white_candle",
    "light_gray_candle",
    "gray_candle",
    "black_candle",
    "brown_candle",
    "red_candle",
    "orange_candle",
    "yellow_candle",
    "lime_candle",
    "green_candle",
    "cyan_candle",
    "light_blue_candle",
    "blue_candle",
    "purple_candle",
    "magenta_candle",
    "pink_candle"
  );
}

// pack.ts
var globalDataBufferSize = 64;
var exposureHistogramBins = 256;
var exposureHistogramPixelsPerThreadX = 2;
var exposureHistogramPixelsPerThreadY = 2;
var streamedSettingsBuffer;
function configureRenderer(renderer) {
  renderer.disableShade = true;
  renderer.ambientOcclusionLevel = 0;
  renderer.sunPathRotation = 30;
  renderer.render.sun = false;
  renderer.render.moon = false;
  renderer.render.waterOverlay = false;
  renderer.shadow.enabled = true;
  renderer.shadow.resolution = 1024;
  renderer.shadow.cascades = 4;
  let pointLightsEnabled = getBoolSetting("POINT_SHADOW");
  if (pointLightsEnabled) {
    renderer.pointLight.maxCount = getIntSetting("POINT_SHADOW_MAX_COUNT");
    renderer.pointLight.resolution = getIntSetting("POINT_SHADOW_RESOLUTION");
    renderer.pointLight.nearPlane = 0.1;
    renderer.pointLight.farPlane = 16;
    renderer.pointLight.cacheRealTimeTerrain = true;
  }
}
function configurePipeline(pipeline) {
  configureLightColors();
  let pointLightsEnabled = getBoolSetting("POINT_SHADOW");
  new RawTexture("atmosphere_scattering_lut", "data/atmosphere_scattering.dat").width(32).height(64).depth(32).format(Format.RGB16F).type(PixelType.HALF_FLOAT).blur(true).clamp(true).build();
  new RawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat").width(48).height(48).depth(48).format(Format.RGB16F).type(PixelType.HALF_FLOAT).blur(true).clamp(true).build();
  let radianceTex = new Texture("radiance_tex").format(Format.RGBA16F).width(screenWidth).height(screenHeight).build();
  let gbufferDataTex = new Texture("gbuffer_data_tex").format(Format.RGBA16).width(screenWidth).height(screenHeight).build();
  let skyViewTex = new Texture("sky_view_tex").format(Format.RGB16F).width(192).height(108).build();
  streamedSettingsBuffer = new StreamingBuffer(4).build();
  let globalDataBuffer = new GPUBuffer(globalDataBufferSize).build();
  let skyShBuffer = new GPUBuffer(4 * 4 * 9).build();
  let exposureHistogramBuffer = new GPUBuffer(4 * 4 * exposureHistogramBins).build();
  let exposureBuffer = new GPUBuffer(4 * 2).build();
  if (pointLightsEnabled) {
    defineGlobally("POINT_SHADOW", "1");
  }
  defineGlobally("HISTOGRAM_BINS", exposureHistogramBins);
  pipeline.registerObjectShader(
    new ObjectShader("shadow", Usage.SHADOW).vertex("program/object/shadow.vsh").fragment("program/object/shadow.fsh").build()
  );
  if (pointLightsEnabled) {
    pipeline.registerObjectShader(
      new ObjectShader("shadow_point", Usage.POINT).vertex("program/object/shadow_point.vsh").fragment("program/object/shadow_point.fsh").build()
    );
  }
  const solidPrograms = [
    [Usage.TERRAIN_SOLID, "terrain_solid", "OBJECT_TERRAIN_SOLID"],
    [Usage.TERRAIN_CUTOUT, "terrain_cutout", "OBJECT_TERRAIN_CUTOUT"]
  ];
  for (const [usage, name, macro] of solidPrograms) {
    pipeline.registerObjectShader(
      new ObjectShader(name, usage).vertex("program/object/all_solid.vsh").fragment("program/object/all_solid.fsh").target(0, gbufferDataTex).define(macro, "1").build()
    );
  }
  pipeline.registerPostPass(
    Stage.PRE_RENDER,
    new Compute("fill_global_data_buffer").location("program/pre_render/fill_global_data_buffer.csh").workGroups(1, 1, 1).ssbo(0, globalDataBuffer).ssbo(1, exposureHistogramBuffer).build()
  );
  pipeline.addBarrier(Stage.PRE_RENDER, SSBO_BIT | UBO_BIT);
  pipeline.registerPostPass(
    Stage.PRE_RENDER,
    new Composite("render_sky_view").vertex("program/composite.vsh").fragment("program/pre_render/render_sky_view.fsh").target(0, skyViewTex).ubo(0, globalDataBuffer).build()
  );
  pipeline.registerPostPass(
    Stage.PRE_RENDER,
    new Compute("gen_sky_sh").location("program/pre_render/gen_sky_sh.csh").workGroups(1, 1, 1).ssbo(0, skyShBuffer).build()
  );
  pipeline.addBarrier(Stage.PRE_RENDER, SSBO_BIT | UBO_BIT);
  pipeline.registerPostPass(
    Stage.PRE_TRANSLUCENT,
    new Composite("deferred_shading").vertex("program/composite.vsh").fragment("program/pre_translucent/deferred_shading.fsh").target(0, radianceTex).ubo(0, globalDataBuffer).ubo(1, skyShBuffer).build()
  );
  pipeline.registerPostPass(
    Stage.POST_RENDER,
    new Compute("exposure_build_histogram").location("program/post_render/exposure_build_histogram.csh").workGroups(
      Math.ceil(screenWidth / (16 * exposureHistogramPixelsPerThreadX)),
      Math.ceil(screenHeight / (16 * exposureHistogramPixelsPerThreadY)),
      1
    ).ssbo(0, exposureHistogramBuffer).define("PIXELS_PER_THREAD_X", exposureHistogramPixelsPerThreadX.toString()).define("PIXELS_PER_THREAD_Y", exposureHistogramPixelsPerThreadY.toString()).build()
  );
  pipeline.addBarrier(Stage.POST_RENDER, SSBO_BIT | UBO_BIT);
  pipeline.registerPostPass(
    Stage.POST_RENDER,
    new Compute("exposure_final").location("program/post_render/exposure_final.csh").workGroups(1, 1, 1).ssbo(0, exposureBuffer).ubo(0, exposureHistogramBuffer).build()
  );
  pipeline.addBarrier(Stage.POST_RENDER, SSBO_BIT | UBO_BIT);
  pipeline.setCombinationPass(
    new CombinationPass("program/combination.fsh").ubo(0, streamedSettingsBuffer).ubo(1, exposureBuffer).build()
  );
  onSettingsChanged();
}
function beginFrame() {
  streamedSettingsBuffer.uploadData();
}
function onSettingsChanged() {
  streamedSettingsBuffer.setFloat(0, getFloatSetting("EXPOSURE"));
}
export {
  beginFrame,
  configurePipeline,
  configureRenderer,
  onSettingsChanged
};
//# sourceMappingURL=pack.js.map
