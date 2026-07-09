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
      if (score >= 0.78) matched = group;
    }
    matched ? matched.push(event) : groups.push([event]);
  }
  return groups.map(mergeGroup);
}

function mergeGroup(group) {
  const primary = [...group].sort((a, b) => rank(b.sourceTrust) - rank(a.sourceTrust))[0];
  const sources = group.flatMap(e => e.sources || []);
  return { ...primary, sources: uniqueSources(sources), relatedEventIds: group.filter(e => e.id !== primary.id).map(e => e.id) };
}

function rank(trust) { return { A: 4, B: 3, C: 2, D: 1 }[trust] || 1; }
function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter(s => { const key = `${s.name}|${s.link}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
