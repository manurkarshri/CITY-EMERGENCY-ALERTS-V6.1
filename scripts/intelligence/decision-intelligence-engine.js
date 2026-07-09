import { readJson, writeJson } from "../lib/io.js";
import { log } from "../lib/logger.js";
import { normalizeRawEvent } from "./normalization.js";
import { deduplicateEvents } from "./deduplication.js";
import { correlateEvents } from "./correlation.js";
import { assessConfidence } from "./confidence.js";
import { applyLifecycle } from "./lifecycle.js";
import { assessImpact } from "./impact.js";

export async function runDecisionIntelligencePipeline() {
  log("Decision Intelligence Engine started.");
  const raw = await readJson("data/raw-events.json", { items: [] });
  const normalized = [];
  for (const item of raw.items || []) normalized.push(await normalizeRawEvent(item));

  const deduped = deduplicateEvents(normalized);
  const correlated = correlateEvents(deduped);
  const enriched = [];
  for (const event of correlated) {
    const confidence = assessConfidence(event);
    enriched.push(await assessImpact(applyLifecycle({ ...event, ...confidence })));
  }

  const active = enriched.filter(e => e.lifecycle !== "archived");
  const alerts = active.filter(e => ["emergency", "warning"].includes(e.severity));
  const incidents = active.filter(e => !["emergency", "warning"].includes(e.severity));
  const generatedAt = new Date().toISOString();

  await writeJson("data/intelligence.json", {
    schemaVersion: "6.0.0",
    generatedAt,
    status: "healthy",
    situation: { snapshot: buildSnapshot(active), weather: null, changes: [] },
    alerts,
    incidents,
    journeyContext: { activeRiskEvents: active.map(toRisk) },
    sourceHealth: {}
  });
  await writeJson("data/alerts.json", { schemaVersion: "6.0.0", generatedAt, items: alerts });
  await writeJson("data/incidents.json", { schemaVersion: "6.0.0", generatedAt, items: incidents });
  await writeJson("data/journey-context.json", { schemaVersion: "6.0.0", generatedAt, routes: [], risks: active.map(toRisk) });

  log("Decision Intelligence Engine completed.", { raw: raw.items?.length || 0, active: active.length, alerts: alerts.length, incidents: incidents.length });
}

function toRisk(e) { return { id: e.id, category: e.category, severity: e.severity, localities: e.localities, talukas: e.talukas, operationalZones: e.operationalZones, impact: e.impact }; }
function buildSnapshot(events) {
  if (!events.length) return "No active emergency intelligence detected from current data.";
  const warnings = events.filter(e => ["emergency", "warning"].includes(e.severity)).length;
  const incidents = events.length - warnings;
  return `${warnings} important alert${warnings === 1 ? "" : "s"} and ${incidents} incident${incidents === 1 ? "" : "s"} are currently active in the intelligence feed.`;
}
