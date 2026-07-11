import { readJson, writeJson } from "../lib/io.js";
import { log } from "../lib/logger.js";
import { normalizeRawEvent } from "./normalization.js";
import { deduplicateEvents } from "./deduplication.js";
import { correlateEvents } from "./correlation.js";
import { assessConfidence } from "./confidence.js";
import { applyLifecycle } from "./lifecycle.js";
import { assessImpact } from "./impact.js";
import { isActiveEvent } from "./freshness.js";
import { loadConfig } from "../lib/config.js";

export async function runDecisionIntelligencePipeline() {
  log("Decision Intelligence Engine started.");
  const raw = await readJson("data/raw-events.json", { items: [] });
  const config = await loadConfig("intelligence.config.json");
  const productionItems = raw.mode === "sample" ? [] : (raw.items || []);
  const normalized = [];
  for (const item of productionItems) normalized.push(await normalizeRawEvent(item));

  const deduped = deduplicateEvents(normalized);
  const correlated = correlateEvents(deduped);
  const enriched = [];
  for (const event of correlated) {
    const confidence = assessConfidence(event);
    enriched.push(await assessImpact(applyLifecycle({ ...event, ...confidence }, { freshnessHours: config.freshnessHours })));
  }

  const generatedAt = new Date().toISOString();
  const withGenerationTime = enriched.map(event => ({ ...event, intelligenceGeneratedAt: generatedAt }));
  const active = withGenerationTime.filter(event => isActiveEvent(event));
  const expired = withGenerationTime.filter(event => !isActiveEvent(event));
  const alerts = active.filter(e => ["emergency", "warning"].includes(e.severity));
  const incidents = active.filter(e => !["emergency", "warning"].includes(e.severity));
  const sourceStatus = raw.mode === "sample" ? "unavailable" : raw.status || (productionItems.some(item => item.sourceCheckedAt) ? "healthy" : "unverified");
  const sourceHealth = {
    id: "event_feeds",
    name: "Alert and incident sources",
    type: "events",
    status: sourceStatus,
    sourceCheckedAt: raw.sourceCheckedAt || latestTimestamp(productionItems.map(item => item.sourceCheckedAt)),
    lastSuccessfulAt: raw.lastSuccessfulAt || latestTimestamp(productionItems.map(item => item.lastVerifiedAt || item.sourceCheckedAt)),
    error: raw.error || (sourceStatus === "unavailable" ? "Live alert source is temporarily unavailable." : null)
  };

  await writeJson("data/intelligence.json", {
    schemaVersion: "6.1.0",
    generatedAt,
    status: sourceStatus === "healthy" ? "current" : sourceStatus,
    situation: { snapshot: buildSnapshot(active), weather: null, changes: [] },
    alerts,
    incidents,
    journeyContext: { activeRiskEvents: active.map(toRisk) },
    expiredEvents: expired,
    sourceHealth: { events: sourceHealth }
  });
  await writeJson("data/alerts.json", { schemaVersion: "6.1.0", generatedAt, sourceStatus, items: alerts });
  await writeJson("data/incidents.json", { schemaVersion: "6.1.0", generatedAt, sourceStatus, items: incidents });
  await writeJson("data/journey-context.json", { schemaVersion: "6.0.0", generatedAt, routes: [], risks: active.map(toRisk) });
  const health = await readJson("data/source-health.json", { schemaVersion: "6.1.0", sources: [] });
  health.schemaVersion = "6.1.0";
  health.generatedAt = generatedAt;
  const eventSourceIds = new Set([sourceHealth.id, ...(raw.sources || []).map(source => source.id)]);
  const individualSources = (raw.sources || []).map(source => ({ ...source, type: ["imd_nowcast", "ndma_sachet"].includes(source.id) ? "alerts" : "incidents" }));
  health.sources = [...(health.sources || []).filter(item => !eventSourceIds.has(item.id)), sourceHealth, ...individualSources];
  await writeJson("data/source-health.json", health);

  log("Decision Intelligence Engine completed.", { raw: raw.items?.length || 0, active: active.length, alerts: alerts.length, incidents: incidents.length });
}

function latestTimestamp(values) {
  return values.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
}

function toRisk(e) { return { id: e.id, category: e.category, severity: e.severity, localities: e.localities, talukas: e.talukas, operationalZones: e.operationalZones, impact: e.impact }; }
function buildSnapshot(events) {
  if (!events.length) return "No active emergency intelligence detected from current data.";
  const warnings = events.filter(e => ["emergency", "warning"].includes(e.severity)).length;
  const incidents = events.length - warnings;
  return `${warnings} important alert${warnings === 1 ? "" : "s"} and ${incidents} incident${incidents === 1 ? "" : "s"} are currently active in the intelligence feed.`;
}
