import { loadConfig } from "../lib/config.js";
import { createTimeline } from "../models/environmental-timeline-model.js";
import { createEvidence } from "../models/evidence-model.js";

export async function buildRiverIntelligence(riverData = {}) {
  const systems = await loadConfig("river-systems.config.json");
  const results = [];
  for (const item of riverData.items || []) {
    if (item.freshness !== "current") continue;
    if (item.kind === "river_gauge") {
      const rsi = riverSeverityIndex(item.status, item.trend);
      const severity = rsi >= 80 ? "emergency" : rsi >= 60 ? "warning" : rsi >= 35 ? "watch" : "advisory";
      results.push({ id: item.id, kind: item.kind, station: item.station, river: item.river, position: item.position, influenceRadiusKm: 3, status: item.status, trend: item.trend, level: item.level, alertLevel: item.alertLevel, dangerLevel: item.dangerLevel, dischargeCumecs: item.dischargeCumecs, rsi, severity, downstreamLocalities: item.localities || [], talukas: item.talukas || [], bridges: [], travelSensitivity: severity === "emergency" ? "high" : "medium", timeline: createTimeline(item.trend === "increasing" ? "developing" : "monitoring", `${item.station} river level is ${item.status}.`), evidence: [createEvidence({ source: item.source, sourceTrust: item.sourceTrust, type: "official", observedAt: item.lastUpdated })], impact: `${item.station} on the ${item.river} is ${formatStatus(item.status)}.`, recommendedAction: severity === "advisory" ? "Continue monitoring official river information." : "Avoid riverbanks and low-lying crossings; follow official instructions." });
      continue;
    }
    const dam = systems.dams?.[item.dam];
    if (!dam) continue;
    const rsi = riverSeverityIndex(item.status, item.trend);
    const severity = rsi >= 80 ? "emergency" : rsi >= 60 ? "warning" : rsi >= 35 ? "watch" : "advisory";
    const storage = Number.isFinite(item.storagePercent) ? `${item.storagePercent}% storage` : "storage reported";
    results.push({ id: item.id || `river-${item.dam}-${String(item.lastUpdated || "").slice(0,10)}`, kind: item.kind || "reservoir", dam: item.dam, damLabel: dam.label, river: dam.river, status: item.status, trend: item.trend, storagePercent: item.storagePercent, reservoirLevel: item.reservoirLevel, dischargeCumecs: item.dischargeCumecs, rsi, severity, downstreamLocalities: dam.downstreamLocalities, talukas: dam.talukas, bridges: dam.bridges, travelSensitivity: dam.travelSensitivity, timeline: createTimeline("monitoring", `${dam.label}: ${storage}.`), evidence: [createEvidence({ source: item.source, sourceTrust: item.sourceTrust, type: "official", observedAt: item.lastUpdated })], impact: `${dam.label} has ${storage}. Storage alone is not treated as a flood warning.`, recommendedAction: "Monitor official discharge and downstream warnings." });
  }
  return results;
}
function formatStatus(status) { return ({ normal: "below its alert level", elevated: "approaching its alert level", high: "at or above alert level", critical: "at or above danger level" })[status] || "unavailable"; }
function riverSeverityIndex(status, trend) {
  const base = { normal: 10, elevated: 35, high: 65, critical: 85 }[status] ?? 20;
  const trendBoost = trend === "increasing" ? 10 : trend === "decreasing" ? -5 : 0;
  return Math.max(0, Math.min(100, base + trendBoost));
}
