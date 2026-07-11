import { createStableId } from "../lib/text.js";
import { createEvent } from "../models/event-model.js";
import { classifyEventText } from "./classification.js";
import { detectLocality } from "./locality.js";

export async function normalizeRawEvent(raw = {}) {
  const text = `${raw.title || ""} ${raw.summary || ""}`;
  const inferred = classifyEventText(text);
  const classification = { category: raw.category || inferred.category, severity: raw.severity || inferred.severity };
  const location = await detectLocality(text);

  return createEvent({
    id: createStableId(`${classification.category} ${raw.title} ${raw.publishedAt || ""}`),
    title: raw.title || "Untitled event",
    summary: raw.summary || raw.title || "",
    category: classification.category,
    severity: classification.severity,
    source: raw.source || "Unknown",
    sourceTrust: raw.sourceTrust || "D",
    sources: [{ name: raw.source || "Unknown", trust: raw.sourceTrust || "D", link: raw.link || "" }],
    link: raw.link || "",
    publishedAt: raw.publishedAt || new Date().toISOString(),
    lastUpdated: raw.lastUpdated || raw.publishedAt || new Date().toISOString(),
    sourceCheckedAt: raw.sourceCheckedAt || null,
    lastVerifiedAt: raw.lastVerifiedAt || null,
    expiresAt: raw.expiresAt || null,
    lifecycle: ["A+", "A"].includes(raw.sourceTrust) ? "verified" : "detected",
    ...location,
    talukas: raw.talukas || location.talukas,
    localities: raw.localities || location.localities
  });
}
