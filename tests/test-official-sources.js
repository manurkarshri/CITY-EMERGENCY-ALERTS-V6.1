function assert(condition, message) { if (!condition) throw new Error(message); }
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { OFFICIAL_SOURCE_GROUPS, TRUSTED_MEDIA_SOURCES } = await import("../js/ui/official.js");
const officialNames = OFFICIAL_SOURCE_GROUPS.flatMap(([, sources]) => sources.map(([name]) => name));

assert(officialNames.includes("Maharashtra SDMA"), "Official directory must include Maharashtra SDMA");
assert(officialNames.includes("Pune Division Disaster Management"), "Official directory must include Pune disaster management");
assert(officialNames.includes("Maharashtra Highway Traffic Police"), "Official directory must include highway traffic police");
assert(officialNames.includes("Maharashtra WRD RTDAS"), "Official directory must identify the live river source");
assert(TRUSTED_MEDIA_SOURCES.every(([, , sourceId]) => !sourceId || !["imd_nowcast", "ndma_sachet", "maharashtra_rtdas", "pune_metro"].includes(sourceId)), "Trusted media must remain separate from official sources");
