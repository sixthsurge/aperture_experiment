var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
var Textures = class {
  constructor() {
    __publicField(this, "radiance");
    __publicField(this, "gbufferData");
    __publicField(this, "skyView");
    __publicField(this, "exposureHistogram");
  }
};
var Buffers = class {
  constructor() {
    __publicField(this, "globalData");
    __publicField(this, "skySh");
    __publicField(this, "exposure");
  }
};
var StreamingBuffers = class {
  constructor() {
    __publicField(this, "settings");
  }
};
var Settings = class {
  constructor() {
    __publicField(this, "pointShadowEnabled");
    __publicField(this, "manualExposureValue");
  }
};
var streamingBuffers = new StreamingBuffers();
var settings = new Settings();
var streamedSettingsBufferSize = 4;
var globalDataBufferSize = 64;
var skyViewRes = [192, 108];
var exposureHistogramBins = 256;
function configureRenderer(renderer) {
  loadSettings();
  renderer.sunPathRotation = 30;
  renderer.ambientOcclusionLevel = 0;
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
  if (settings.pointShadowEnabled) {
    renderer.pointLight.maxCount = getIntSetting("POINT_SHADOW_MAX_COUNT");
    renderer.pointLight.resolution = getIntSetting("POINT_SHADOW_RESOLUTION");
    renderer.pointLight.nearPlane = 0.1;
    renderer.pointLight.farPlane = 16;
    renderer.pointLight.cacheRealTimeTerrain = true;
  }
}
function configurePipeline(pipeline) {
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
function beginFrame() {
  streamingBuffers.settings.uploadData();
}
function onSettingsChanged() {
  loadSettings();
  uploadStreamedSettings();
}
function createTextures(pipeline) {
  pipeline.importRawTexture("atmosphere_scattering_lut", "data/atmosphere_scattering.dat").width(32).height(64).depth(32).format(Format.RGB16F).type(PixelType.HALF_FLOAT).blur(true).clamp(true).load();
  pipeline.importRawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat").width(48).height(48).depth(48).format(Format.RGB16F).type(PixelType.HALF_FLOAT).blur(true).clamp(true).load();
  let textures = new Textures();
  textures.radiance = pipeline.createTexture("radiance_tex").format(Format.RGBA16F).width(screenWidth).height(screenHeight).build();
  textures.gbufferData = pipeline.createTexture("gbuffer_data_tex").format(Format.RGBA32UI).width(screenWidth).height(screenHeight).build();
  textures.skyView = pipeline.createTexture("sky_view_tex").format(Format.RGB16F).width(skyViewRes[0]).height(skyViewRes[1]).build();
  textures.exposureHistogram = pipeline.createImageTexture("exposure_histogram_tex", "exposure_histogram_img").format(Format.R32UI).width(exposureHistogramBins).height(1).clear(true).build();
  return textures;
}
function createBuffers(pipeline) {
  streamingBuffers.settings = pipeline.createStreamingBuffer(streamedSettingsBufferSize);
  let buffers = new Buffers();
  buffers.globalData = pipeline.createBuffer(globalDataBufferSize, false);
  buffers.skySh = pipeline.createBuffer(4 * 4 * 9, false);
  buffers.exposure = pipeline.createBuffer(4 * 2, false);
  return buffers;
}
function createObjectShaders(pipeline, textures, buffers) {
  const solidPrograms = [
    [Usage.TERRAIN_SOLID, "terrain_solid", "OBJECT_TERRAIN_SOLID"],
    [Usage.TERRAIN_CUTOUT, "terrain_cutout", "OBJECT_TERRAIN_CUTOUT"],
    [Usage.ENTITY_SOLID, "entity_solid", "OBJECT_ENTITY_SOLID"],
    [Usage.ENTITY_CUTOUT, "entity_cutout", "OBJECT_ENTITY_CUTOUT"],
    [Usage.BLOCK_ENTITY, "block_entity", "OBJECT_BLOCK_ENTITY"],
    [Usage.PARTICLES, "particles", "OBJECT_PARTICLES"],
    [Usage.HAND, "hand", "OBJECT_HAND"],
    [Usage.EMISSIVE, "emissive", "OBJECT_EMISSIVE"],
    [Usage.BASIC, "basic", "OBJECT_BASIC"],
    [Usage.LINES, "lines", "OBJECT_LINES"]
  ];
  for (const [usage, name, macro] of solidPrograms) {
    pipeline.createObjectShader(name, usage).vertex("program/object/all_solid.vsh").fragment("program/object/all_solid.fsh").target(0, textures.gbufferData).define(macro, "1").compile();
  }
  const translucentPrograms = [
    [Usage.TERRAIN_TRANSLUCENT, "terrain_translucent", "OBJECT_TERRAIN_TRANSLUCENT"],
    [Usage.ENTITY_TRANSLUCENT, "entity_translucent", "OBJECT_ENTITY_TRANSLUCENT"],
    [Usage.BLOCK_ENTITY_TRANSLUCENT, "block_entity_translucent", "OBJECT_BLOCK_ENTITY_TRANSLUCENT"],
    [Usage.PARTICLES_TRANSLUCENT, "particles_translucent", "OBJECT_PARTICLES_TRANSLUCENT"],
    [Usage.TRANSLUCENT_HAND, "translucent_hand", "OBJECT_TRANSLUCENT_HAND"],
    [Usage.TEXTURED, "textured", "OBJECT_TEXTURED"],
    [Usage.TEXT, "text", "OBJECT_TEXT"]
  ];
  for (const [usage, name, macro] of translucentPrograms) {
    pipeline.createObjectShader(name, usage).vertex("program/object/all_translucent.vsh").fragment("program/object/all_translucent.fsh").target(0, textures.radiance).define(macro, "1").compile();
  }
  pipeline.createObjectShader("shadow", Usage.SHADOW).vertex("program/object/shadow.vsh").fragment("program/object/shadow.fsh").compile();
  if (settings.pointShadowEnabled) {
    pipeline.createObjectShader("shadow_point", Usage.POINT).vertex("program/object/shadow_point.vsh").fragment("program/object/shadow_point.fsh").compile();
  }
}
function createPreRenderCommands(commands, textures, buffers) {
  commands.createCompute("fill_global_data_buffer").location("program/pre_render/fill_global_data_buffer.csh").workGroups(1, 1, 1).ssbo(0, buffers.globalData).compile();
  commands.barrier(SSBO_BIT | UBO_BIT);
  commands.createComposite("render_sky_view").vertex("program/composite.vsh").fragment("program/pre_render/render_sky_view.fsh").target(0, textures.skyView).ubo(0, buffers.globalData).compile();
  commands.createCompute("gen_sky_sh").location("program/pre_render/gen_sky_sh.csh").workGroups(1, 1, 1).ssbo(0, buffers.skySh).compile();
  commands.barrier(SSBO_BIT | UBO_BIT);
  commands.end();
}
function createPreTranslucentCommands(commands, textures, buffers) {
  commands.createComposite("deferred_shading").vertex("program/composite.vsh").fragment("program/pre_translucent/deferred_shading.fsh").target(0, textures.radiance).ubo(0, buffers.globalData).ubo(1, buffers.skySh).compile();
  commands.end();
}
function createPostRenderCommands(commands, textures, buffers) {
  createExposureCommands(commands.subList("Exposure"), textures, buffers);
  commands.end();
}
function createExposureCommands(commands, textures, buffers) {
  commands.createCompute("clear_histogram").location("program/post_render/exposure/clear_histogram.csh").workGroups(1, 1, 1).compile();
  commands.barrier(IMAGE_BIT | FETCH_BIT);
  commands.createCompute("build_histogram").location("program/post_render/exposure/build_histogram.csh").workGroups(
    Math.ceil(screenWidth / 32),
    Math.ceil(screenHeight / 32),
    1
  ).compile();
  commands.barrier(IMAGE_BIT | FETCH_BIT);
  commands.createCompute("calculate_exposure").location("program/post_render/exposure/calculate_exposure.csh").workGroups(1, 1, 1).ssbo(0, buffers.exposure).compile();
  commands.barrier(SSBO_BIT | UBO_BIT);
  commands.end();
}
function createCombinationPass(pipeline, textures, buffers) {
  pipeline.createCombinationPass("program/combination.fsh").ubo(0, streamingBuffers.settings).ubo(1, buffers.exposure).compile();
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
export {
  beginFrame,
  configurePipeline,
  configureRenderer,
  onSettingsChanged
};
//# sourceMappingURL=pack.js.map
