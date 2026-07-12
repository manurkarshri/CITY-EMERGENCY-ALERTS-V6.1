const WIRE_AGENCIES = [
  { key: "pti", pattern: /\b(?:pti|press trust of india)\b/i },
  { key: "ani", pattern: /\b(?:ani|asian news international)\b/i }
];

export function sourceOrigin(value = "") {
  const text = String(value || "");
  return WIRE_AGENCIES.find(agency => agency.pattern.test(text))?.key || "";
}

export function sourceIndependenceKey(source = {}) {
  const agency = source.origin || sourceOrigin(`${source.name || ""} ${source.attribution || ""}`);
  if (agency) return `wire:${agency}`;
  return `publisher:${canonicalSourceName(source.name || "")}`;
}

export function independentSourceCount(sources = []) {
  return new Set(sources.map(sourceIndependenceKey).filter(Boolean)).size;
}

export function hasIndependentCorroboration(sources = []) {
  return independentSourceCount(sources) > 1;
}

export function sameWireOrigin(a = {}, b = {}) {
  const originA = a.origin || sourceOrigin(`${a.name || ""} ${a.attribution || ""}`);
  const originB = b.origin || sourceOrigin(`${b.name || ""} ${b.attribution || ""}`);
  return Boolean(originA && originA === originB);
}

function canonicalSourceName(value) {
  return String(value || "").toLowerCase().replace(/\s+pune$/i, "").replace(/[^a-z0-9]+/g, " ").trim();
}
