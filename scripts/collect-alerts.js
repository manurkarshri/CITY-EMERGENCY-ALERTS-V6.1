import { fetchImdNowcasts } from "./collectors/imd-nowcast-rss.js";
import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";

const previous = await readJson("data/raw-events.json", { items: [] });
const checkedAt = new Date().toISOString();
try {
  const items = await fetchImdNowcasts({ checkedAt });
  await writeJson("data/raw-events.json", { schemaVersion: "6.1.0", mode: "live", status: "healthy", sourceCheckedAt: checkedAt, lastSuccessfulAt: checkedAt, error: null, items });
  log("IMD Pune nowcast collection completed.", { activeItems: items.length });
} catch (error) {
  const preserved = (previous.items || []).filter(item => item.expiresAt && new Date(item.expiresAt) > new Date());
  await writeJson("data/raw-events.json", { schemaVersion: "6.1.0", mode: "live", status: preserved.length ? "stale" : "unavailable", sourceCheckedAt: checkedAt, lastSuccessfulAt: previous.lastSuccessfulAt || null, error: error.message, items: preserved });
  log("IMD Pune nowcast collection failed.", { error: error.message, preserved: preserved.length });
}
