import { loadConfig } from "../lib/config.js";
import { createTimeline } from "../models/environmental-timeline-model.js";
import { createEvidence } from "../models/evidence-model.js";

export async function buildRiverIntelligence(riverData = {}) {
  const systems = await loadConfig("river-systems.config.json");
  const results = [];
  for (const item of riverData.items || []) {
    const dam = systems.dams?.[item.dam];
    if (!dam) continue;
    const rsi = riverSeverityIndex(item.status, item.trend);
    const severity = rsi >= 80 ? "emergency" : rsi >= 60 ? "warning" : rsi >= 35 ? "watch" : "advisory";
    results.push({ id: `river-${item.dam}-${String(item.lastUpdated || "").slice(0,10)}`, dam: item.dam, damLabel: dam.label, river: dam.river, status: item.status, trend: item.trend, rsi, severity, downstreamLocalities: dam.downstreamLocalities, talukas: dam.talukas, bridges: dam.bridges, travelSensitivity: dam.travelSensitivity, timeline: createTimeline(item.trend === "increasing" ? "developing" : "monitoring", `${dam.label} release is ${item.status}.`), evidence: [createEvidence({ source: item.source, sourceTrust: item.sourceTrust, type: "official", observedAt: item.lastUpdated })], impact: `${dam.label} release may affect downstream areas along ${dam.river}.`, recommendedAction: "Avoid riverbanks and follow official instructions." });
  }
  return results;
}
function riverSeverityIndex(status, trend) {
  const base = { normal: 10, elevated: 35, high: 65, critical: 85 }[status] ?? 20;
  const trendBoost = trend === "increasing" ? 10 : trend === "decreasing" ? -5 : 0;
  return Math.max(0, Math.min(100, base + trendBoost));
}
