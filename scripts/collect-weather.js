import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";
import { fetchOpenMeteo, normalizeOpenMeteoResponse } from "./collectors/open-meteo.js";

const config = await readJson("config/weather-locations.config.json", { locations: {} });
const previous = await readJson("data/weather.json", { regions: {} });
const health = await readJson("data/source-health.json", { schemaVersion: "6.1.0", sources: [] });
const checkedAt = new Date().toISOString();

let weather;
let sourceHealth;
try {
  const payload = await fetchOpenMeteo(config.locations, { timezone: config.timezone });
  const regions = normalizeOpenMeteoResponse(payload, config.locations, checkedAt);
  weather = {
    schemaVersion: "6.1.0",
    generatedAt: checkedAt,
    sourceCheckedAt: checkedAt,
    lastSuccessfulAt: checkedAt,
    status: "current",
    staleAfterMinutes: config.staleAfterMinutes || 90,
    attribution: { name: "Open-Meteo", url: "https://open-meteo.com/" },
    regions
  };
  sourceHealth = weatherHealth("healthy", checkedAt, checkedAt, null);
  log("Open-Meteo weather collection completed.", { regions: Object.keys(regions).length });
} catch (error) {
  const hasPrevious = Object.keys(previous.regions || {}).length > 0 && previous.lastSuccessfulAt;
  weather = {
    ...previous,
    schemaVersion: "6.1.0",
    generatedAt: checkedAt,
    sourceCheckedAt: checkedAt,
    status: hasPrevious ? "stale" : "unavailable",
    staleAfterMinutes: config.staleAfterMinutes || 90,
    error: "Weather provider could not be reached during the latest check."
  };
  sourceHealth = weatherHealth(hasPrevious ? "stale" : "unavailable", checkedAt, previous.lastSuccessfulAt || null, error.message);
  log("Open-Meteo weather collection failed; preserving last successful data.", { error: error.message });
}

health.schemaVersion = "6.1.0";
health.generatedAt = checkedAt;
health.sources = [...(health.sources || []).filter(item => item.id !== "open_meteo"), sourceHealth];
await writeJson("data/weather.json", weather);
await writeJson("data/source-health.json", health);

function weatherHealth(status, sourceCheckedAt, lastSuccessfulAt, error) {
  return {
    id: "open_meteo",
    name: "Open-Meteo",
    type: "weather",
    status,
    sourceCheckedAt,
    lastSuccessfulAt,
    error: error || null
  };
}
