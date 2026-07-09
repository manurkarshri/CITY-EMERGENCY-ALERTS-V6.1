import { loadConfig } from "../lib/config.js";
import { normalizeText } from "../lib/text.js";

export async function detectLocality(text = "") {
  const talukas = await loadConfig("talukas.config.json");
  const localitiesCfg = await loadConfig("localities.config.json");
  const normalized = normalizeText(text);
  const foundTalukas = new Set();
  const foundLocalities = new Set();
  const foundZones = new Set();

  for (const [talukaKey, taluka] of Object.entries(talukas)) {
    for (const locality of taluka.localities || []) {
      if (normalized.includes(normalizeText(locality))) {
        foundTalukas.add(talukaKey);
        foundLocalities.add(locality);
      }
    }
  }

  for (const [alias, canonical] of Object.entries(localitiesCfg.aliases || {})) {
    if (normalized.includes(normalizeText(alias)) || normalized.includes(normalizeText(canonical))) foundLocalities.add(canonical);
  }

  for (const zones of Object.values(localitiesCfg.operationalZones || {})) {
    for (const zone of zones) if (normalized.includes(normalizeText(zone))) foundZones.add(zone);
  }

  return { talukas: [...foundTalukas], localities: [...foundLocalities], operationalZones: [...foundZones] };
}
