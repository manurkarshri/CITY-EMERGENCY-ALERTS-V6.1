import { loadConfig } from "../lib/config.js";
export async function buildCriticalInfrastructureIntelligence(activeEvents = []) {
  const infra = await loadConfig("infrastructure-map.config.json");
  const relevant = [];
  for (const event of activeEvents) {
    if (["road_closure", "accident"].includes(event.category)) relevant.push("highways");
    if (["flood", "dam_release", "waterlogging"].includes(event.category)) relevant.push("bridges");
    if (["fire", "gas_leak", "building_collapse"].includes(event.category)) relevant.push("emergencyServices");
  }
  return { generatedAt: new Date().toISOString(), mode: "on-demand", relevantDomains: [...new Set(relevant)], infrastructure: infra };
}
