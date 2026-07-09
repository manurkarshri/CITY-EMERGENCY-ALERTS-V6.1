export function createEvent(input = {}) {
  return {
    id: input.id || "",
    title: input.title || "",
    summary: input.summary || "",
    category: input.category || "public_safety",
    severity: input.severity || "advisory",
    source: input.source || "Unknown",
    sourceTrust: input.sourceTrust || "D",
    sources: input.sources || [],
    link: input.link || "",
    talukas: input.talukas || [],
    localities: input.localities || [],
    operationalZones: input.operationalZones || [],
    publishedAt: input.publishedAt || new Date().toISOString(),
    lastUpdated: input.lastUpdated || input.publishedAt || new Date().toISOString(),
    lifecycle: input.lifecycle || "detected",
    confidence: input.confidence || "Low",
    confidenceScore: input.confidenceScore || 0,
    impact: input.impact || "",
    recommendedAction: input.recommendedAction || "",
    relatedEventIds: input.relatedEventIds || []
  };
}
