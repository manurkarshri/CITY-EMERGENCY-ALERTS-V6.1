import fs from "fs/promises";

function assert(condition, message) { if (!condition) throw new Error(message); }
const worker = await fs.readFile(new URL("../sw.js", import.meta.url), "utf8");
const connectivity = await fs.readFile(new URL("../js/core/connectivity.js", import.meta.url), "utf8");

assert(worker.includes("./js/core/connectivity.js"), "Offline app shell must include the connectivity module");
assert(worker.includes("./data/source-health.json"), "Offline app shell must include source-health data");
assert(worker.includes("cache.put(cacheRequest, response.clone())"), "Service worker must retain successful same-origin responses");
assert(worker.includes("request.mode === \"navigate\""), "Offline navigation must fall back to the cached app shell");
assert(connectivity.includes("You are offline. Showing the last safely cached intelligence."), "Offline status must explain cached intelligence");
assert(connectivity.includes("window.addEventListener(\"online\""), "Connectivity module must refresh when online");
