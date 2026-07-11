import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";
import { fetchRtdasPage, parseRtdasRiverPage, parseRtdasReservoirPage } from "./collectors/maharashtra-rtdas.js";

const config = await readJson("config/river-sources.config.json", {});
const previous = await readJson("data/river-status.json", { items: [] });
const health = await readJson("data/source-health.json", { schemaVersion: "6.1.0", sources: [] });
const checkedAt = new Date().toISOString();
let output;

try {
  const [riverHtml, reservoirHtml] = await Promise.all([
    fetchRtdasPage(config.sources.rtdas_bhima_rivers),
    fetchRtdasPage(config.sources.rtdas_bhima_reservoirs)
  ]);
  const items = [
    ...parseRtdasRiverPage(riverHtml, config.riverStations, checkedAt, previous.items),
    ...parseRtdasReservoirPage(reservoirHtml, config.reservoirs, checkedAt)
  ];
  if (!items.length) throw new Error("RTDAS returned no configured Pune river or reservoir records");
  output = { schemaVersion: "6.1.0", generatedAt: checkedAt, sourceCheckedAt: checkedAt, lastSuccessfulAt: checkedAt, status: "current", staleAfterMinutes: config.staleAfterMinutes || 180, attribution: { name: "Maharashtra WRD RTDAS", url: "https://wrd.maharashtra.gov.in/" }, items };
  setHealth("healthy", checkedAt, null);
  log("Maharashtra RTDAS river collection completed.", { items: items.length, current: items.filter(item => item.freshness === "current").length });
} catch (error) {
  const hasPrevious = previous.items?.length && previous.lastSuccessfulAt;
  output = { ...previous, schemaVersion: "6.1.0", generatedAt: checkedAt, sourceCheckedAt: checkedAt, status: hasPrevious ? "stale" : "unavailable", error: "Maharashtra WRD RTDAS could not be reached during the latest check." };
  setHealth(hasPrevious ? "stale" : "unavailable", previous.lastSuccessfulAt || null, error.message);
  log("Maharashtra RTDAS collection failed; preserving last successful data.", { error: error.message });
}

health.schemaVersion = "6.1.0";
health.generatedAt = checkedAt;
await writeJson("data/river-status.json", output);
await writeJson("data/source-health.json", health);

function setHealth(status, lastSuccessfulAt, error) {
  const item = { id: "maharashtra_rtdas", name: "Maharashtra WRD River & Dam RTDAS", type: "river", status, sourceCheckedAt: checkedAt, lastSuccessfulAt, error: error || null };
  health.sources = [...(health.sources || []).filter(source => !["maharashtra_rtdas", "river_dam_feeds"].includes(source.id)), item];
}
