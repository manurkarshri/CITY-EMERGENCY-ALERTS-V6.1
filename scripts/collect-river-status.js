import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";
import { fetchRtdasPage, parseRtdasRiverPage, parseRtdasReservoirPage } from "./collectors/maharashtra-rtdas.js";
import { fetchPravahDailyReport, extractPravahPdfText, parsePravahDailyReport } from "./collectors/maharashtra-pravah.js";

const config = await readJson("config/river-sources.config.json", {});
const previous = await readJson("data/river-status.json", { items: [] });
const health = await readJson("data/source-health.json", { schemaVersion: "6.1.0", sources: [] });
const checkedAt = new Date().toISOString();
let rtdasItems = [];
let pravahItems = [];
let rtdasSucceeded = false;
let pravahSucceeded = false;
const errors = [];

try {
  const [riverHtml, reservoirHtml] = await Promise.all([
    fetchRtdasPage(config.sources.rtdas_bhima_rivers),
    fetchRtdasPage(config.sources.rtdas_bhima_reservoirs)
  ]);
  rtdasItems = [
    ...parseRtdasRiverPage(riverHtml, config.riverStations, checkedAt, previous.items),
    ...parseRtdasReservoirPage(reservoirHtml, config.reservoirs, checkedAt)
  ];
  if (!rtdasItems.length) throw new Error("RTDAS returned no configured Pune river or reservoir records");
  rtdasSucceeded = true;
  const current = rtdasItems.filter(item => item.freshness === "current").length;
  setHealth("maharashtra_rtdas", "Maharashtra WRD River & Dam RTDAS", current ? "healthy" : "stale", checkedAt, current ? null : "RTDAS responded, but all configured readings are older than the freshness limit.");
  log("Maharashtra RTDAS river collection completed.", { items: rtdasItems.length, current });
} catch (error) {
  rtdasItems = (previous.items || []).filter(item => item.source === "Maharashtra WRD RTDAS");
  errors.push(`RTDAS: ${error.message}`);
  setHealth("maharashtra_rtdas", "Maharashtra WRD River & Dam RTDAS", rtdasItems.length ? "stale" : "unavailable", previous.lastSuccessfulAt || null, error.message);
  log("Maharashtra RTDAS collection failed; preserving last successful data.", { error: error.message });
}

try {
  const bytes = await fetchPravahDailyReport(config.sources.pravah_daily_report);
  const text = await extractPravahPdfText(bytes);
  const parsed = parsePravahDailyReport(text, checkedAt);
  pravahItems = parsed.items;
  pravahSucceeded = true;
  const current = pravahItems.filter(item => item.freshness === "current").length;
  setHealth("maharashtra_pravah", "Maharashtra WRD Pravah Daily Storage", current ? "healthy" : "stale", checkedAt, current ? null : `Latest official daily report is dated ${parsed.reportDay}.`);
  log("Maharashtra Pravah daily storage collection completed.", { items: pravahItems.length, current, reportDay: parsed.reportDay });
} catch (error) {
  pravahItems = (previous.items || []).filter(item => item.source === "Maharashtra WRD Pravah Daily Report");
  errors.push(`Pravah: ${error.message}`);
  setHealth("maharashtra_pravah", "Maharashtra WRD Pravah Daily Storage", pravahItems.length ? "stale" : "unavailable", previous.lastSuccessfulAt || null, error.message);
  log("Maharashtra Pravah collection failed; preserving last successful data.", { error: error.message });
}

const items = mergeOfficialItems(rtdasItems, pravahItems);
const currentItems = items.filter(item => item.freshness === "current");
const status = currentItems.length ? "current" : items.length ? "stale" : "unavailable";
const output = {
  schemaVersion: "6.1.0",
  generatedAt: checkedAt,
  sourceCheckedAt: checkedAt,
  lastSuccessfulAt: rtdasSucceeded || pravahSucceeded ? checkedAt : previous.lastSuccessfulAt || null,
  status,
  staleAfterMinutes: config.staleAfterMinutes || 180,
  attribution: {
    name: "Maharashtra WRD RTDAS and Pravah",
    url: config.sources.pravah_daily_report
  },
  error: errors.length ? errors.join(" | ") : null,
  items
};

health.schemaVersion = "6.1.0";
health.generatedAt = checkedAt;
await writeJson("data/river-status.json", output);
await writeJson("data/source-health.json", health);

function mergeOfficialItems(rtdas = [], pravah = []) {
  const currentPravah = new Map(pravah.filter(item => item.freshness === "current").map(item => [item.dam, item]));
  const merged = rtdas.filter(item => item.kind !== "reservoir" || item.freshness === "current" || !currentPravah.has(item.dam));
  const currentRtdasDams = new Set(rtdas.filter(item => item.kind === "reservoir" && item.freshness === "current").map(item => item.dam));
  return [...merged, ...pravah.filter(item => !currentRtdasDams.has(item.dam))];
}

function setHealth(id, name, status, lastSuccessfulAt, error) {
  const item = { id, name, type: "river", status, sourceCheckedAt: checkedAt, lastSuccessfulAt, error: error || null };
  health.sources = [...(health.sources || []).filter(source => source.id !== id), item];
}
