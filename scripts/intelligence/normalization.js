import { createStableId } from "../lib/text.js";
import { createEvent } from "../models/event-model.js";
import { classifyEventText } from "./classification.js";
import { detectLocality } from "./locality.js";

export async function normalizeRawEvent(raw = {}) {
  const text = `${raw.title || ""} ${raw.summary || ""}`;
  const inferred = classifyEventText(text);
  const classification = { category: raw.category || inferred.category, severity: raw.severity || inferred.severity };
  const location = await detectLocality(text.replace(/\bDeccan Queen\b/gi, "train"));
  const geographicScope = inferGeographicScope(raw, location);

  return createEvent({
    id: createStableId(`${classification.category} ${raw.title} ${raw.publishedAt || ""}`),
    eventKind: raw.eventKind || inferEventKind(raw, classification),
    sourceId: raw.sourceId || "",
    title: raw.title || "Untitled event",
    summary: raw.summary || raw.title || "",
    category: classification.category,
    severity: classification.severity,
    source: raw.source || "Unknown",
    sourceTrust: raw.sourceTrust || "D",
    sources: [{ name: raw.source || "Unknown", trust: raw.sourceTrust || "D", link: raw.link || "", origin: raw.sourceOrigin || "" }],
    link: raw.link || "",
    publishedAt: raw.publishedAt || new Date().toISOString(),
    lastUpdated: raw.lastUpdated || raw.publishedAt || new Date().toISOString(),
    sourceCheckedAt: raw.sourceCheckedAt || null,
    lastVerifiedAt: raw.lastVerifiedAt || null,
    expiresAt: raw.expiresAt || null,
    recommendedAction: raw.recommendedAction || "",
    affectedArea: raw.affectedArea || "",
    upstreamId: raw.upstreamId || "",
    collectionProvider: raw.collectionProvider || "",
    discoveryOnly: Boolean(raw.discoveryOnly),
    discoveredAt: raw.discoveredAt || null,
    capMessageType: raw.capMessageType || "",
    capReferences: raw.capReferences || "",
    coordinates: raw.coordinates || [],
    roadNumbers: raw.roadNumbers || [],
    geographicScope,
    lifecycle: ["A+", "A"].includes(raw.sourceTrust) ? "verified" : "detected",
    ...location,
    talukas: raw.talukas || location.talukas,
    localities: raw.localities || location.localities
  });
}

export function inferGeographicScope(raw = {}, location = {}) {
  if (raw.geographicScope) return raw.geographicScope;
  if ([...(raw.talukas || location.talukas || []), ...(raw.localities || location.localities || [])].length) return "local";
  const area = `${raw.affectedArea || ""} ${raw.title || ""}`;
  if (/\bpune\s+district\b/i.test(area) || (["imd_nowcast", "ndma_sachet"].includes(raw.sourceId) && /\bpune\b/i.test(area))) return "pune_district";
  return "broader_area";
}

export function inferEventKind(raw, classification) {
  if (["imd_nowcast", "ndma_sachet"].includes(raw.sourceId)) return "alert";
  const text = `${raw.title || ""} ${raw.summary || ""} ${raw.recommendedAction || ""}`;
  if (/\b(?:alert|warning|advisory|nowcast|forecast|watch|evacuat|avoid travel|take shelter)\b/i.test(text)) return "alert";
  if (["A+", "A"].includes(raw.sourceTrust) && ["emergency", "warning"].includes(classification.severity) && !["accident", "fire", "road_closure", "waterlogging", "transport_disruption"].includes(classification.category)) return "alert";
  return "incident";
}
