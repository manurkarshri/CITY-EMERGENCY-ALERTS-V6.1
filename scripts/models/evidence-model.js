export function createEvidence(input = {}) {
  return { source: input.source || "Unknown", sourceTrust: input.sourceTrust || "D", type: input.type || "supporting", observedAt: input.observedAt || new Date().toISOString(), link: input.link || "", note: input.note || "" };
}
