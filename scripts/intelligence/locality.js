import { loadConfig } from "../lib/config.js";
import { normalizeText } from "../lib/text.js";

export async function detectLocality(text = "") {
  const talukas = await loadConfig("talukas.config.json");
  const localitiesCfg = await loadConfig("localities.config.json");
  const normalized = normalizeText(text);
  const foundTalukas = new Set();
  const foundLocalities = new Set();
  const foundZones = new Set();
  const owners = new Map();

  for (const [talukaKey, taluka] of Object.entries(talukas)) {
    for (const locality of taluka.localities || []) {
      const canonicalKey = normalizeText(locality);
      if (!owners.has(canonicalKey)) owners.set(canonicalKey, new Set());
      owners.get(canonicalKey).add(talukaKey);
      if (containsPhrase(normalized, canonicalKey)) {
        foundTalukas.add(talukaKey);
        foundLocalities.add(locality);
      }
    }
  }

  for (const [alias, canonical] of Object.entries(localitiesCfg.aliases || {})) {
    if (containsPhrase(normalized, normalizeText(alias)) || containsPhrase(normalized, normalizeText(canonical))) {
      foundLocalities.add(canonical);
      for (const owner of owners.get(normalizeText(canonical)) || []) foundTalukas.add(owner);
    }
  }

  for (const zones of Object.values(localitiesCfg.operationalZones || {})) {
    for (const zone of zones) if (containsPhrase(normalized, normalizeText(zone))) foundZones.add(zone);
  }

  return { talukas: [...foundTalukas], localities: [...foundLocalities], operationalZones: [...foundZones] };
}

function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  return ` ${text} `.includes(` ${phrase} `);
}
