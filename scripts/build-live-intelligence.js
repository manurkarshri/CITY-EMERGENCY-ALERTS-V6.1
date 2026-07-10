import { readJson, writeJson } from "./lib/io.js";
import { nowIso } from "./lib/time.js";

const sources = await readJson("config/live-sources.config.json", { officialSources: [], trustedMediaSources: [], policy: {} });
const intelligence = await readJson("data/intelligence.json", { alerts: [], incidents: [] });
const environmental = await readJson("data/environmental-context.json", {});
const journey = await readJson("data/journey-intelligence.json", { journeys: [] });
const collectedHealth = await readJson("data/source-health.json", { sources: [] });

function sourceSummary(list) {
  return (list || []).map(source => ({
    id: source.id,
    name: source.name,
    type: source.type,
    trust: source.trust,
    url: source.url,
    status: "configured",
    lastChecked: null,
    note: "Configured for production user testing. Full live fetching depends on source APIs/RSS/CORS/server-side support."
  }));
}

const events = [
  ...(intelligence.alerts || []).map(event => ({ ...event, eventType: "alert" })),
  ...(intelligence.incidents || []).map(event => ({ ...event, eventType: "incident" }))
];

const developing = events.filter(event => ["B", "C"].includes(event.sourceTrust)).map(event => ({
  id: event.id,
  title: event.title,
  status: event.sourceTrust === "B" ? "developing" : "supporting-signal",
  confirmation: event.sourceTrust === "B" ? "Awaiting official confirmation" : "Supporting signal only",
  source: event.source,
  trust: event.sourceTrust,
  updatedAt: event.lastUpdated || event.publishedAt || null
}));

await writeJson("data/live-intelligence.json", {
  schemaVersion: "6.1.0",
  generatedAt: nowIso(),
  status: (collectedHealth.sources || []).some(source => source.status === "unavailable") ? "partial" : "current",
  releaseMode: "production-user-testing",
  policy: sources.policy,
  sourceHealth: {
    collected: collectedHealth.sources || [],
    official: sourceSummary(sources.officialSources),
    trustedMedia: sourceSummary(sources.trustedMediaSources)
  },
  liveReadiness: {
    officialSourcesConfigured: (sources.officialSources || []).length,
    trustedMediaSourcesConfigured: (sources.trustedMediaSources || []).length,
    alertsAvailable: (intelligence.alerts || []).length,
    incidentsAvailable: (intelligence.incidents || []).length,
    weatherRegionsAvailable: Object.keys(environmental.weatherIntelligence?.regions || {}).length,
    journeyAssessmentsAvailable: (journey.journeys || []).length
  },
  developingSituations: developing,
  citizenNote: "Production user testing release uses configured official/trusted source registry and generated intelligence. Some external feeds may require server-side collectors or API access."
});
