// options.ts
function setupOptions() {
  return new Page("main").add(
    new Page("point_shadow").add(
      asBool("POINT_SHADOW", false, true)
    ).add(
      asInt("POINT_SHADOW_MAX_COUNT", ...range(0, 256, 1)).needsReload(true).build(64)
    ).add(
      asInt("POINT_SHADOW_RESOLUTION", ...range(256, 2048, 256)).needsReload(true).build(256)
    ).build()
  ).add(
    asFloat("EXPOSURE", ...range(0, 1024, 1)).needsReload(false).build(8)
  ).build();
}
function range(min, max, step) {
  let values = [];
  for (let x = min; x <= max; x += step) values.push(x);
  return values;
}
export {
  setupOptions
};
//# sourceMappingURL=options.js.map
