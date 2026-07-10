import { readJson } from "../lib/io.js";

export async function validateLocalityHierarchy() {
  const errors = [];
  const talukas = await readJson("config/talukas.config.json", {});
  const config = await readJson("config/localities.config.json", {});
  const requiredTalukas = ["pune_city", "pcmc", "haveli", "maval", "mulshi", "shirur", "baramati", "daund", "indapur", "bhor", "velhe", "purandar", "khed", "junnar", "ambegaon", "loni_kalbhor"];
  for (const key of requiredTalukas) if (!talukas[key]) errors.push(`Missing taluka: ${key}`);

  const owners = new Map();
  for (const [talukaKey, taluka] of Object.entries(talukas)) {
    if (!taluka.label) errors.push(`Missing label for taluka: ${talukaKey}`);
    for (const locality of taluka.localities || []) {
      const key = locality.toLowerCase();
      if (!owners.has(key)) owners.set(key, []);
      owners.get(key).push(talukaKey);
    }
  }
  for (const [locality, localityOwners] of owners) if (localityOwners.length > 1) errors.push(`Locality has multiple owners: ${locality} (${localityOwners.join(", ")})`);
  for (const canonical of Object.values(config.aliases || {})) {
    const isLocality = owners.has(canonical.toLowerCase());
    const isOperationalZone = Object.values(config.operationalZones || {}).flat().some(zone => zone.toLowerCase() === canonical.toLowerCase());
    if (!isLocality && !isOperationalZone) errors.push(`Alias target is not a locality or operational zone: ${canonical}`);
  }
  return errors;
}
