import { canonicalLocality, localityMatches } from "../utils/locality.js";
import { isCurrentEvent } from "../utils/freshness.js";

export function enrichIncidentGeography(items = [], talukas = {}, localityConfig = {}) {
  const localityIndex = Object.entries(talukas).flatMap(([taluka, value]) =>
    (value.localities || []).map(locality => ({ taluka, locality, key: normalize(canonicalLocality(locality, localityConfig)) }))
  );
  return items.map(item => {
    const text = normalize(`${item.affectedArea || ""} ${item.title || ""} ${item.summary || ""}`);
    const matches = localityIndex.filter(entry => entry.key && containsPhrase(text, entry.key));
    const localities = [...new Set([...(item.localities || []), ...matches.map(entry => entry.locality)])];
    const mappedTalukas = [...new Set([...(item.talukas || []), ...matches.map(entry => entry.taluka)])];
    return { ...item, localities, talukas: mappedTalukas, geographicScope: localities.length || mappedTalukas.length ? "local" : "district_unmapped" };
  });
}

export function deduplicateTrafficIncidents(items = []) {
  const groups = [];
  for (const item of items) {
    const match = groups.find(group => sameTrafficIncident(group[0], item));
    match ? match.push(item) : groups.push([item]);
  }
  return groups.map(mergeTrafficGroup);
}

export function hierarchicalIncidentEvents(items = [], selected = {}, localityConfig = {}) {
  const current = [...items].filter(isCurrentEvent).sort(eventPriority);
  const taluka = selected.taluka || "";
  const locality = selected.locality || "";
  if (locality) {
    const localityItems = current.filter(item => (item.localities || []).some(value => localityMatches(value, locality, localityConfig)));
    if (localityItems.length) return { items: localityItems, level: "locality" };
  }
  if (taluka) {
    const talukaItems = current.filter(item => (item.talukas || []).includes(taluka));
    if (talukaItems.length) return { items: talukaItems, level: "taluka" };
  }
  return { items: current, level: current.length ? "district" : "none" };
}

export function sameTrafficIncident(left, right) {
  if (!left || !right || left.category !== right.category) return false;
  const leftSegment = segmentKey(left);
  const rightSegment = segmentKey(right);
  if (leftSegment && rightSegment && leftSegment === rightSegment) return true;
  const leftPoint = point(left);
  const rightPoint = point(right);
  return Boolean(leftPoint && rightPoint && haversineKm(leftPoint, rightPoint) <= 0.15 && normalize(left.summary) === normalize(right.summary));
}

function mergeTrafficGroup(group) {
  const primary = [...group].sort((a, b) => Number(b.delaySeconds || 0) - Number(a.delaySeconds || 0) || new Date(b.lastVerifiedAt || 0) - new Date(a.lastVerifiedAt || 0))[0];
  const sources = unique(group.flatMap(item => item.sources || []), source => `${source.name}|${source.link}`);
  const ids = group.map(item => item.id).filter(id => id && id !== primary.id);
  const localities = unique(group.flatMap(item => item.localities || []), normalize);
  const talukas = unique(group.flatMap(item => item.talukas || []), normalize);
  return { ...primary, sources, localities, talukas, relatedEventIds: unique([...(primary.relatedEventIds || []), ...ids], String), duplicateReportsMerged: group.length, lastVerifiedAt: latest(group.map(item => item.lastVerifiedAt)), sourceCheckedAt: latest(group.map(item => item.sourceCheckedAt)) };
}

function segmentKey(item) { const endpoints = [item.trafficFrom, item.trafficTo].map(normalize).filter(Boolean).sort(); return endpoints.length === 2 ? `${normalize(item.category)}|${endpoints.join("|")}` : ""; }
function point(item) { const coordinates = item.geometry?.type === "Point" ? item.geometry.coordinates : item.coordinates; if (!Array.isArray(coordinates) || !Number.isFinite(Number(coordinates[0])) || !Number.isFinite(Number(coordinates[1]))) return null; return { lon: Number(coordinates[0]), lat: Number(coordinates[1]) }; }
function containsPhrase(text, phrase) { return (` ${text} `).includes(` ${phrase} `); }
function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
function unique(items, key) { const seen = new Set(); return items.filter(item => { const value = key(item); if (seen.has(value)) return false; seen.add(value); return true; }); }
function latest(values) { return values.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null; }
function haversineKm(a, b) { const rad = value => value * Math.PI / 180; const dLat = rad(b.lat - a.lat); const dLon = rad(b.lon - a.lon); const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)); }
function eventPriority(a, b) { const rank = { emergency: 4, warning: 3, watch: 2, advisory: 1 }; return (rank[b.severity] || 0) - (rank[a.severity] || 0) || (b.confidenceScore || 0) - (a.confidenceScore || 0) || new Date(b.lastUpdated || b.publishedAt || 0) - new Date(a.lastUpdated || a.publishedAt || 0); }
