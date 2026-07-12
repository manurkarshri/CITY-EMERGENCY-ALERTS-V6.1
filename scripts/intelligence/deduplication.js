import { jaccardSimilarity } from "../lib/similarity.js";
import { hasIndependentCorroboration, independentSourceCount, sameWireOrigin } from "./source-independence.js";

export function deduplicateEvents(events = []) {
  const groups = [];
  for (const event of events) {
    let matched = null;
    for (const group of groups) {
      const primary = group[0];
      let score = jaccardSimilarity(`${event.title} ${event.summary}`, `${primary.title} ${primary.summary}`);
      if (event.category === primary.category) score += 0.12;
      if ((event.localities || []).some(x => (primary.localities || []).includes(x))) score += 0.15;
      if (score >= 0.78 || sameSourceUpdateMatch(event, primary) || lifeSafetyMatch(event, primary) || corroboratedMatch(event, primary) || wireDuplicateMatch(event, primary) || officialUpdateMatch(event, primary)) matched = group;
    }
    matched ? matched.push(event) : groups.push([event]);
  }
  return groups.map(mergeGroup);
}

function mergeGroup(group) {
  const primary = [...group].sort((a, b) => rank(b.sourceTrust) - rank(a.sourceTrust))[0];
  const sources = group.flatMap(e => e.sources || []);
  const unique = uniqueSources(sources);
  return { ...primary, sources: unique, independentSourceCount: independentSourceCount(unique), corroboratedByIndependentSources: hasIndependentCorroboration(unique), relatedEventIds: group.filter(e => e.id !== primary.id).map(e => e.id) };
}

export function corroboratedMatch(a, b) {
  if (!a?.source || !b?.source || a.source === b.source || a.category !== b.category) return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 36 * 36e5) return false;
  const similarity = jaccardSimilarity(`${a.title} ${a.summary}`, `${b.title} ${b.summary}`);
  const sharedPlace = (a.localities || []).some(place => (b.localities || []).includes(place)) || (a.talukas || []).some(place => (b.talukas || []).includes(place));
  return sharedPlace ? similarity >= 0.25 : similarity >= 0.55;
}

function sameSourceUpdateMatch(a, b) {
  if (a.sourceId !== b.sourceId || a.category !== b.category) return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 36 * 36e5) return false;
  const similarity = jaccardSimilarity(a.title, b.title);
  // Progressive casualty/recovery headlines often replace several words while
  // describing the same collapse. Keep the relaxed threshold limited to the
  // same publisher, category and 36-hour window.
  if (a.category === "structural_collapse") return similarity >= 0.28;
  return similarity >= 0.42;
}

function lifeSafetyMatch(a, b) {
  if (!['structural_collapse', 'rescue_operation'].includes(a.category) || a.category !== b.category) return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 36 * 36e5) return false;
  const similarity = jaccardSimilarity(`${a.title} ${a.summary}`, `${b.title} ${b.summary}`);
  return similarity >= 0.24;
}

function wireDuplicateMatch(a, b) {
  if (a.category !== b.category) return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 18 * 36e5) return false;
  const sourceA = (a.sources || [{ name: a.source, origin: a.sourceOrigin }])[0];
  const sourceB = (b.sources || [{ name: b.source, origin: b.sourceOrigin }])[0];
  if (!sameWireOrigin(sourceA, sourceB)) return false;
  return (a.localities || []).some(place => (b.localities || []).includes(place)) || (a.talukas || []).some(place => (b.talukas || []).includes(place));
}

export function officialUpdateMatch(a, b) {
  if (!["A+", "A"].includes(a?.sourceTrust) || !["A+", "A"].includes(b?.sourceTrust) || a.category !== b.category) return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 4 * 36e5) return false;
  const expiryA = new Date(a.expiresAt).getTime();
  const expiryB = new Date(b.expiresAt).getTime();
  if (Number.isFinite(expiryA) && Number.isFinite(expiryB) && Math.min(expiryA, expiryB) < Math.max(timeA, timeB)) return false;
  const areaA = String(a.affectedArea || "").toLowerCase();
  const areaB = String(b.affectedArea || "").toLowerCase();
  const sameArea = areaA && areaB && areaA.split(/[,;]/).some(area => area.trim() && areaB.includes(area.trim()));
  const similarity = jaccardSimilarity(`${a.title} ${a.summary}`, `${b.title} ${b.summary}`);
  return Boolean(sameArea || similarity >= 0.3);
}

function rank(trust) { return { "A+": 5, A: 4, B: 3, C: 2, D: 1 }[trust] || 1; }
function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter(s => { const key = `${s.name}|${s.link}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
