export function canonicalLocality(value, config = {}) {
  const normalized = normalize(value);
  if (!normalized) return "";
  const match = Object.entries(config.aliases || {}).find(([alias, canonical]) => normalize(alias) === normalized || normalize(canonical) === normalized);
  return match ? match[1] : String(value).trim();
}

export function localityMatches(left, right, config = {}) {
  return normalize(canonicalLocality(left, config)) === normalize(canonicalLocality(right, config));
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
