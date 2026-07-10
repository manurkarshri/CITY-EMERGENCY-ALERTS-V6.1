import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";
import { buildWeatherIntelligence } from "./environment/weather-intelligence.js";
import { buildRiverIntelligence } from "./environment/river-intelligence.js";
import { buildGeographicIntelligence } from "./environment/geographic-intelligence.js";
import { buildSeasonalIntelligence } from "./environment/seasonal-intelligence.js";
import { buildCriticalInfrastructureIntelligence } from "./environment/critical-infrastructure.js";
import { buildEnvironmentalImpact } from "./environment/environmental-impact.js";
import { buildEmergencyStory } from "./environment/emergency-story-engine.js";

log("Environmental Intelligence build started.");
const intelligence = await readJson("data/intelligence.json", { alerts: [], incidents: [] });
const weather = await readJson("data/weather.json", { status: "unavailable", regions: {} });
const river = await readJson("data/river-status.json", { status: "unavailable", items: [] });
const activeEvents = [...(intelligence.alerts || []), ...(intelligence.incidents || [])];

const weatherIntelligence = buildWeatherIntelligence(weather);
const riverIntelligence = await buildRiverIntelligence(river);
const geographicIntelligence = await buildGeographicIntelligence();
const seasonalIntelligence = await buildSeasonalIntelligence();
const criticalInfrastructure = await buildCriticalInfrastructureIntelligence(activeEvents);
const environmentalImpact = buildEnvironmentalImpact({ weatherIntelligence, riverIntelligence, activeEvents, seasonalIntelligence });
const story = buildEmergencyStory({ weatherIntelligence, riverIntelligence, environmentalImpact, activeEvents });
const generatedAt = new Date().toISOString();
const riverSource = {
  status: river.status || (river.items?.length ? "current" : "unavailable"),
  sourceCheckedAt: river.sourceCheckedAt || null,
  lastSuccessfulAt: river.lastSuccessfulAt || null,
  error: river.error || (!river.items?.length ? "No live river or dam collector is connected." : null)
};

await writeJson("data/environmental-context.json", { schemaVersion: "6.1.0", generatedAt, weatherSource: { status: weather.status || "unavailable", sourceCheckedAt: weather.sourceCheckedAt || null, lastSuccessfulAt: weather.lastSuccessfulAt || null, staleAfterMinutes: weather.staleAfterMinutes || 90, attribution: weather.attribution || null, error: weather.error || null }, riverSource, weatherIntelligence, riverIntelligence, seasonalIntelligence, geographicIntelligence, criticalInfrastructure, environmentalImpact, story });

intelligence.situation = { ...(intelligence.situation || {}), snapshot: story, weather: weatherIntelligence, environmentalImpact, changes: intelligence.situation?.changes || [] };
intelligence.environmentalContext = { riverIntelligence, seasonalIntelligence, geographicIntelligence, criticalInfrastructure };
await writeJson("data/intelligence.json", intelligence);
const health = await readJson("data/source-health.json", { schemaVersion: "6.1.0", sources: [] });
const riverHealth = { id: "river_dam_feeds", name: "River and dam sources", type: "river", ...riverSource };
health.schemaVersion = "6.1.0";
health.generatedAt = generatedAt;
health.sources = [...(health.sources || []).filter(item => item.id !== riverHealth.id), riverHealth];
await writeJson("data/source-health.json", health);
log("Environmental Intelligence build completed.", { weatherRegions: Object.keys(weatherIntelligence.regions || {}).length, riverEvents: riverIntelligence.length });
