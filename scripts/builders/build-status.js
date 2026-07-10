import { writeJson, readJson } from "../lib/io.js";
import { nowIso } from "../lib/time.js";

const intelligence = await readJson("data/intelligence.json", { alerts: [], incidents: [] });
const environmental = await readJson("data/environmental-context.json", { riverIntelligence: [], weatherIntelligence: { regions: {} } });
const journey = await readJson("data/journey-intelligence.json", { journeys: [] });
const live = await readJson("data/live-intelligence.json", { liveReadiness: {} });
const sourceHealth = await readJson("data/source-health.json", { sources: [] });
const sources = sourceHealth.sources || [];
const unavailableSources = sources.filter(source => source.status === "unavailable").length;
const staleSources = sources.filter(source => source.status === "stale").length;
const overallStatus = unavailableSources ? "partial" : staleSources ? "degraded" : sources.length ? "healthy" : "unavailable";

await writeJson("data/build-status.json", {
  schemaVersion: "6.1.0",
  build: {
    version: "6.1.0-production-user-testing",
    milestone: "Production User Testing Release",
    status: overallStatus,
    buildTime: nowIso(),
    note: overallStatus === "healthy" ? "All connected data sources are healthy." : "The application built successfully, but one or more live data sources are stale, unavailable, or not connected.",
    alerts: (intelligence.alerts || []).length,
    incidents: (intelligence.incidents || []).length,
    weatherRegions: Object.keys(environmental.weatherIntelligence?.regions || {}).length,
    riverEvents: (environmental.riverIntelligence || []).length,
    journeys: (journey.journeys || []).length,
    officialSourcesConfigured: live.liveReadiness?.officialSourcesConfigured || 0,
    trustedMediaSourcesConfigured: live.liveReadiness?.trustedMediaSourcesConfigured || 0,
    sourceSummary: {
      total: sources.length,
      healthy: sources.filter(source => ["healthy", "current"].includes(source.status)).length,
      stale: staleSources,
      unavailable: unavailableSources,
      unverified: sources.filter(source => source.status === "unverified").length
    }
  }
});
