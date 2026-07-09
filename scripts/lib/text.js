export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createStableId(value) {
  return normalizeText(value).slice(0, 90).replace(/\s+/g, "-") || `event-${Date.now()}`;
}
