import { fetchImdNowcasts } from "./collectors/imd-nowcast-rss.js";
import { fetchIndianExpressIncidents } from "./collectors/indian-express-pune-rss.js";
import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";

const previous = await readJson("data/raw-events.json", { items: [] });
const checkedAt = new Date().toISOString();
const collectors = [
  ["imd_nowcast", fetchImdNowcasts],
  ["indian_express_pune", fetchIndianExpressIncidents]
];
const results = await Promise.allSettled(collectors.map(([, collect]) => collect({ checkedAt })));
const items = [];
const errors = [];
results.forEach((result, index) => {
  const sourceId = collectors[index][0];
  if (result.status === "fulfilled") items.push(...result.value);
  else {
    errors.push(`${sourceId}: ${result.reason?.message || "collection failed"}`);
    items.push(...(previous.items || []).filter(item => item.sourceId === sourceId && item.expiresAt && new Date(item.expiresAt) > new Date()));
  }
});
const successful = results.filter(result => result.status === "fulfilled").length;
await writeJson("data/raw-events.json", { schemaVersion: "6.1.0", mode: "live", status: successful === collectors.length ? "healthy" : successful ? "stale" : "unavailable",
  sourceCheckedAt: checkedAt, lastSuccessfulAt: successful ? checkedAt : previous.lastSuccessfulAt || null, error: errors.join("; ") || null, items });
log("Live alert and incident collection completed.", { activeItems: items.length, successfulSources: successful, errors: errors.length });
