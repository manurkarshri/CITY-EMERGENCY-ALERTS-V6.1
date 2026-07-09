import { writeJson, readJson } from "../lib/io.js";
import { nowIso } from "../lib/time.js";

const intelligence = await readJson("data/intelligence.json", { alerts: [], incidents: [] });
const environmental = await readJson("data/environmental-context.json", { riverIntelligence: [], weatherIntelligence: { regions: {} } });
const journey = await readJson("data/journey-intelligence.json", { journeys: [] });
const live = await readJson("data/live-intelligence.json", { liveReadiness: {} });

await writeJson("data/build-status.json", {
  schemaVersion: "6.1.0",
  build: {
    version: "6.1.0-production-user-testing",
    milestone: "Production User Testing Release",
    status: "healthy",
    buildTime: nowIso(),
    note: "Production user testing release with stable frontend, intelligence pipeline and live-source registry",
    alerts: (intelligence.alerts || []).length,
    incidents: (intelligence.incidents || []).length,
    weatherRegions: Object.keys(environmental.weatherIntelligence?.regions || {}).length,
    riverEvents: (environmental.riverIntelligence || []).length,
    journeys: (journey.journeys || []).length,
    officialSourcesConfigured: live.liveReadiness?.officialSourcesConfigured || 0,
    trustedMediaSourcesConfigured: live.liveReadiness?.trustedMediaSourcesConfigured || 0
  }
});
