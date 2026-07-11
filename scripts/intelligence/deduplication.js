import { jaccardSimilarity } from "../lib/similarity.js";

export function deduplicateEvents(events = []) {
  const groups = [];
  for (const event of events) {
    let matched = null;
    for (const group of groups) {
      const primary = group[0];
      let score = jaccardSimilarity(`${event.title} ${event.summary}`, `${primary.title} ${primary.summary}`);
      if (event.category === primary.category) score += 0.12;
      if ((event.localities || []).some(x => (primary.localities || []).includes(x))) score += 0.15;
      if (score >= 0.78 || corroboratedMatch(event, primary)) matched = group;
    }
    matched ? matched.push(event) : groups.push([event]);
  }
  return groups.map(mergeGroup);
}

function mergeGroup(group) {
  const primary = [...group].sort((a, b) => rank(b.sourceTrust) - rank(a.sourceTrust))[0];
  const sources = group.flatMap(e => e.sources || []);
  const unique = uniqueSources(sources);
  return { ...primary, sources: unique, corroboratedByIndependentSources: new Set(unique.map(source => source.name)).size > 1, relatedEventIds: group.filter(e => e.id !== primary.id).map(e => e.id) };
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

function rank(trust) { return { A: 4, B: 3, C: 2, D: 1 }[trust] || 1; }
function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter(s => { const key = `${s.name}|${s.link}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
