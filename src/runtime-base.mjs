// Kept as a shared external module in production bundles so URL resolution is
// identical for readable modules, hashed chunks, workers and gateway subpaths.
export const runtimeBase=new URL('./',import.meta.url).href;
