// options.ts
function setupOptions() {
  return new Page("main").add(
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
