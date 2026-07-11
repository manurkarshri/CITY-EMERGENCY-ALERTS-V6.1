import { fetchImdNowcasts } from "./collectors/imd-nowcast-rss.js";
import { fetchIndianExpressIncidents } from "./collectors/indian-express-pune-rss.js";
import { fetchHindustanTimesIncidents } from "./collectors/hindustan-times-pune-rss.js";
import { fetchNdmaSachetAlerts } from "./collectors/ndma-sachet-cap.js";
import { fetchPuneMetroIncidents } from "./collectors/pune-metro-press-releases.js";
import { fetchGoogleNewsDiscoveries, corroborateGoogleDiscoveries } from "./collectors/google-news-discovery-rss.js";
import { fetchFreeNewsIncidents } from "./collectors/free-news-api.js";
import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";

const previous = await readJson("data/raw-events.json", { items: [] });
const checkedAt = new Date().toISOString();
const collectors = [
  ["imd_nowcast", "IMD Pune Nowcast", fetchImdNowcasts],
  ["ndma_sachet", "NDMA SACHET Maharashtra CAP", fetchNdmaSachetAlerts],
  ["indian_express_pune", "Indian Express Pune", fetchIndianExpressIncidents],
  ["hindustan_times_pune", "Hindustan Times Pune", fetchHindustanTimesIncidents],
  ["pune_metro", "Pune Metro Official Updates", fetchPuneMetroIncidents]
];
if (process.env.FREE_NEWS_API_KEY) collectors.push(["free_news_api", "FreeNewsAPI trusted-media discovery", fetchFreeNewsIncidents]);
const results = await Promise.allSettled(collectors.map(([id, , collect]) => collect({ checkedAt, etag: (previous.sources || []).find(source => source.id === id)?.etag })));
const items = [];
const errors = [];
const sourceStates = [];
results.forEach((result, index) => {
  const [sourceId, name] = collectors[index];
  if (result.status === "fulfilled") {
    const priorItems = (previous.items || []).filter(item => item.sourceId === sourceId && item.expiresAt && new Date(item.expiresAt) > new Date());
    items.push(...(result.value.notModified ? priorItems : result.value));
    sourceStates.push({ id: sourceId, name, status: "healthy", sourceCheckedAt: checkedAt, lastSuccessfulAt: checkedAt, error: null, etag: result.value.etag || null });
  }
  else {
    errors.push(`${sourceId}: ${result.reason?.message || "collection failed"}`);
    const preserved = (previous.items || []).filter(item => item.sourceId === sourceId && item.expiresAt && new Date(item.expiresAt) > new Date());
    items.push(...preserved);
    const prior = (previous.sources || []).find(source => source.id === sourceId);
    sourceStates.push({ id: sourceId, name, status: preserved.length ? "stale" : "unavailable", sourceCheckedAt: checkedAt, lastSuccessfulAt: prior?.lastSuccessfulAt || null, error: result.reason?.message || "Collection failed" });
  }
});
const successful = results.filter(result => result.status === "fulfilled").length;
let discoveryData = { schemaVersion: "6.1.0", provider: "Google News RSS", sourceCheckedAt: checkedAt, status: "unavailable", error: null, items: [] };
try {
  const discoveries = await fetchGoogleNewsDiscoveries({ checkedAt });
  discoveryData = { ...discoveryData, status: "healthy", items: corroborateGoogleDiscoveries(discoveries, items) };
} catch (error) {
  discoveryData.error = error?.message || "Google News discovery failed";
}
await writeJson("data/google-news-discovery.json", discoveryData);
await writeJson("data/raw-events.json", { schemaVersion: "6.1.0", mode: "live", status: successful === collectors.length ? "healthy" : successful ? "stale" : "unavailable",
  sourceCheckedAt: checkedAt, lastSuccessfulAt: successful ? checkedAt : previous.lastSuccessfulAt || null, error: errors.join("; ") || null, sources: sourceStates, items });
log("Live alert and incident collection completed.", { activeItems: items.length, successfulSources: successful, errors: errors.length });
