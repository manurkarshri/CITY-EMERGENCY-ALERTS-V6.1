import { loadConfig } from "../lib/config.js";
export async function buildGeographicIntelligence() {
  const localities = await loadConfig("localities.config.json");
  const infrastructure = await loadConfig("infrastructure-map.config.json");
  return { generatedAt: new Date().toISOString(), model: "administrative-ui-operational-backend", operationalZones: localities.operationalZones || {}, infrastructure, note: "UI remains Region → Taluka → Locality. Operational geography is used only by intelligence engines." };
}
