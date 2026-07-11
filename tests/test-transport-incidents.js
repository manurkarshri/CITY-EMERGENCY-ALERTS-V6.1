import { normalizeTomTomTraffic } from "../scripts/collectors/tomtom-traffic-incidents.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const checkedAt = "2026-07-11T06:00:00.000Z";
const payload = { incidents: [
  { geometry: { coordinates: [73.8, 18.5] }, properties: { id: "closed-1", iconCategory: 8, events: [{ description: "Road closed" }], from: "Aundh", to: "Baner", delay: 1200, startTime: "2026-07-11T05:30:00Z", endTime: "2026-07-11T09:00:00Z", lastReportTime: "2026-07-11T05:45:00Z" } },
  { geometry: { coordinates: [73.9, 18.6] }, properties: { id: "jam-small", iconCategory: 6, events: [{ description: "Slow traffic" }], delay: 300, startTime: "2026-07-11T05:30:00Z" } },
  { geometry: { coordinates: [73.7, 18.4] }, properties: { id: "jam-large", iconCategory: 6, events: [{ description: "Severe congestion" }], delay: 1800, startTime: "2026-07-11T05:30:00Z" } }
  ,{ geometry: { coordinates: [73.75, 18.45] }, properties: { id: "minor-accident", iconCategory: 1, events: [{ description: "Minor accident" }], delay: 60, magnitudeOfDelay: 1, startTime: "2026-07-11T05:30:00Z" } }
] };
const items = normalizeTomTomTraffic(payload, checkedAt);
assert(items.length === 2, "Routine congestion must be excluded from transport incidents");
const closure = items.find(item => item.category === "road_closure");
assert(closure?.sourceTrust === "C" && closure.severity === "warning", "Road closure normalization failed");
assert(closure.coordinates.length && closure.expiresAt, "Transport geometry or expiry missing");
assert(items.find(item => item.category === "severe_congestion")?.severity === "watch", "Severe congestion classification failed");
console.log("Transport incident collector tests passed.");
