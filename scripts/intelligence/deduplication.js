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
      if (score >= 0.78 || sameSourceUpdateMatch(event, primary) || sameCollapseRescueEvent(event, primary) || sameCasualtyAccident(event, primary) || lifeSafetyMatch(event, primary) || corroboratedMatch(event, primary) || wireDuplicateMatch(event, primary) || officialUpdateMatch(event, primary)) matched = group;
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

function sameCollapseRescueEvent(a, b) {
  const relatedCategories = new Set(["structural_collapse", "rescue_operation"]);
  if (!relatedCategories.has(a.category) || !relatedCategories.has(b.category) || a.category === b.category) return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 36 * 36e5) return false;
  const titleA = String(a.title || "");
  const titleB = String(b.title || "");
  if (!/\bpune\b|\bpcmc\b|\bpimpri\b|\bmoshi\b/i.test(titleA) || !/\bpune\b|\bpcmc\b|\bpimpri\b|\bmoshi\b/i.test(titleB)) return false;
  const countsA = new Set(titleA.match(/\b\d{1,3}\b/g) || []);
  const countsB = new Set(titleB.match(/\b\d{1,3}\b/g) || []);
  return [...countsA].some(value => Number(value) > 0 && countsB.has(value));
}

function sameCasualtyAccident(a, b) {
  if (a.category !== "accident" || b.category !== "accident") return false;
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > 24 * 36e5) return false;
  const textA = `${a.title || ""} ${a.summary || ""}`;
  const textB = `${b.title || ""} ${b.summary || ""}`;
  const numbersA = casualtyNumbers(textA);
  const numbersB = casualtyNumbers(textB);
  const sharedCasualty = [...numbersA].some(value => value > 0 && numbersB.has(value));
  const vehicle = type => new RegExp(`\\b${type}\\b`, "i").test(textA) && new RegExp(`\\b${type}\\b`, "i").test(textB);
  const sameVehicle = ["truck", "bus", "car", "tanker", "tempo", "motorcycle", "bike"].some(vehicle);
  const procession = /warkari|wari|palkhi|pilgrim|procession|ashadhi/i;
  return sharedCasualty && sameVehicle && procession.test(textA) && procession.test(textB);
}

function casualtyNumbers(text) {
  const values = new Set((String(text).match(/\b\d{1,2}\b/g) || []).map(Number));
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  for (const [word, value] of Object.entries(words)) if (new RegExp(`\\b${word}\\b`, "i").test(text)) values.add(value);
  return values;
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
