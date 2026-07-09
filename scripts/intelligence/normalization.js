import { createStableId } from "../lib/text.js";
import { createEvent } from "../models/event-model.js";
import { classifyEventText } from "./classification.js";
import { detectLocality } from "./locality.js";

export async function normalizeRawEvent(raw = {}) {
  const text = `${raw.title || ""} ${raw.summary || ""}`;
  const classification = classifyEventText(text);
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
    lastUpdated: raw.publishedAt || new Date().toISOString(),
    lifecycle: raw.sourceTrust === "A" ? "verified" : "detected",
    ...location
  });
}
