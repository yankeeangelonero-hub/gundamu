export function createRng(seed) {
  let value = (seed >>> 0) || 1;
  return function nextRandom() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function sanitizeSeed(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1979;
  }
  return Math.max(1, Math.floor(numeric));
}
