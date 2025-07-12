// pack.ts
var globalDataBufferSize = 64;
var exposureHistogramBins = 256;
var streamedSettingsBuffer;
function setupShader(dimension) {
  print(`AYUP ${dimension.getPath()}`);
  worldSettings.disableShade = true;
  worldSettings.ambientOcclusionLevel = 0;
  worldSettings.sunPathRotation = 30;
  worldSettings.render.sun = false;
  worldSettings.render.moon = false;
  worldSettings.render.waterOverlay = false;
  worldSettings.shadow.resolution = 1024;
  worldSettings.shadow.cascades = 4;
  worldSettings.shadow.enable();
  setLightColors();
  new RawTexture("atmosphere_scattering_lut", "data/atmosphere_scattering.dat").width(32).height(64).depth(32).format(Format.RGB16F).type(PixelType.HALF_FLOAT).blur(true).clamp(true).build();
  new RawTexture("tony_mcmapface_lut", "data/tony_mcmapface_lut_f16.dat").width(48).height(48).depth(48).format(Format.RGB16F).type(PixelType.HALF_FLOAT).blur(true).clamp(true).build();
  let radianceTex = new Texture("radiance_tex").format(Format.RGB16F).width(screenWidth).height(screenHeight).build();
  let gbufferDataTex = new Texture("gbuffer_data_tex").format(Format.RGBA16).width(screenWidth).height(screenHeight).build();
  let skyViewTex = new Texture("sky_view_tex").format(Format.RGB16F).width(192).height(108).build();
  streamedSettingsBuffer = new StreamingBuffer(4).build();
  let globalDataBuffer = new GPUBuffer(globalDataBufferSize).build();
  let skyShBuffer = new GPUBuffer(4 * 4 * 9).build();
  let exposureHistogramBuffer = new GPUBuffer(4 * 4 * exposureHistogramBins).build();
  let exposureBuffer = new GPUBuffer(4 * 2).build();
  defineGlobally("HISTOGRAM_BINS", exposureHistogramBins);
  registerShader(
    new ObjectShader("shadow", Usage.SHADOW).vertex("passes/object/shadow.vsh").fragment("passes/object/shadow.fsh").build()
  );
  registerShader(
    new ObjectShader("textured", Usage.TEXTURED).vertex("passes/object/all_solid.vsh").fragment("passes/object/all_solid.fsh").target(0, gbufferDataTex).build()
  );
  registerShader(
    Stage.PRE_RENDER,
    new Compute("fill_global_data_buffer").location("passes/compute/fill_global_data_buffer.csh").workGroups(1, 1, 1).ssbo(0, globalDataBuffer).ssbo(1, exposureHistogramBuffer).build()
  );
  registerBarrier(Stage.POST_RENDER, new MemoryBarrier(SSBO_BIT | UBO_BIT));
  registerShader(
    Stage.PRE_RENDER,
    new Composite("render_sky_view").vertex("passes/composite.vsh").fragment("passes/composite/render_sky_view.fsh").target(0, skyViewTex).ubo(0, globalDataBuffer).build()
  );
  registerShader(
    Stage.PRE_RENDER,
    new Compute("gen_sky_sh").location("passes/compute/gen_sky_sh.csh").workGroups(1, 1, 1).ssbo(0, skyShBuffer).build()
  );
  registerBarrier(Stage.POST_RENDER, new MemoryBarrier(SSBO_BIT | UBO_BIT));
  registerShader(
    Stage.PRE_TRANSLUCENT,
    new Composite("deferred_shading").vertex("passes/composite.vsh").fragment("passes/composite/deferred_shading.fsh").target(0, radianceTex).ubo(0, globalDataBuffer).ubo(1, skyShBuffer).build()
  );
  registerShader(
    Stage.POST_RENDER,
    new Compute("exposure_build_histogram").location("passes/compute/exposure_build_histogram.csh").workGroups(Math.ceil(screenWidth / 8), Math.ceil(screenHeight / 8), 1).ssbo(0, exposureHistogramBuffer).build()
  );
  registerBarrier(Stage.POST_RENDER, new MemoryBarrier(SSBO_BIT | UBO_BIT));
  registerShader(
    Stage.POST_RENDER,
    new Compute("exposure_final").location("passes/compute/exposure_final.csh").workGroups(1, 1, 1).ssbo(0, exposureBuffer).ubo(0, exposureHistogramBuffer).build()
  );
  registerBarrier(Stage.POST_RENDER, new MemoryBarrier(SSBO_BIT | UBO_BIT));
  setCombinationPass(
    new CombinationPass("passes/combination.fsh").ubo(0, streamedSettingsBuffer).ubo(1, exposureBuffer).build()
  );
  onSettingsChanged();
}
function setupFrame() {
  streamedSettingsBuffer.uploadData();
}
function onSettingsChanged() {
  streamedSettingsBuffer.setFloat(0, getFloatSetting("EXPOSURE"));
}
function setLightColors() {
  setLightColor(new NamespacedId("torch"), 255, 255, 255, 255);
}
export {
  onSettingsChanged,
  setupFrame,
  setupShader
};
//# sourceMappingURL=pack.js.map
