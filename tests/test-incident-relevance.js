import { deduplicateTrafficIncidents, enrichIncidentGeography, hierarchicalIncidentEvents, sameTrafficIncident } from "../js/intelligence/incident-relevance.js";
import talukas from "../config/talukas.config.json" with { type: "json" };
import localities from "../config/localities.config.json" with { type: "json" };

function assert(condition, message) { if (!condition) throw new Error(message); }
const base = { category: "road_closure", summary: "Closed", sourceCheckedAt: "2026-07-11T10:00:00Z", lastVerifiedAt: "2026-07-11T10:00:00Z", sources: [{ name: "TomTom", link: "https://tomtom.com" }] };
const forward = { ...base, id: "forward", trafficFrom: "Balewadi Road", trafficTo: "Baner Road", title: "Closed - Balewadi Road to Baner Road", affectedArea: "Balewadi Road to Baner Road", coordinates: [73.78, 18.57] };
const reverse = { ...base, id: "reverse", trafficFrom: "Baner Road", trafficTo: "Balewadi Road", title: "Closed - Baner Road to Balewadi Road", affectedArea: "Baner Road to Balewadi Road", coordinates: [73.7802, 18.5701] };
assert(sameTrafficIncident(forward, reverse), "Reverse-direction records for the same segment must match");
const merged = deduplicateTrafficIncidents([forward, reverse]);
assert(merged.length === 1 && merged[0].relatedEventIds.includes("reverse"), "Matched traffic records must merge while retaining related IDs");
const mapped = enrichIncidentGeography([forward], talukas, localities)[0];
assert(mapped.localities.includes("Baner") && mapped.localities.includes("Balewadi") && mapped.talukas.includes("pune_city"), "Road names must map to configured localities and Taluka");
const unmapped = enrichIncidentGeography([{ ...base, id: "unknown", title: "Closed", affectedArea: "Unnamed district road" }], talukas, localities)[0];
assert(unmapped.geographicScope === "district_unmapped", "Unmapped incidents must be marked as broader district items");
const future = "2099-07-12T10:00:00.000Z";
const hierarchyItems = [
  { id: "wagholi", title: "Wagholi incident", localities: ["Wagholi"], talukas: ["haveli"], lifecycle: "developing", expiresAt: future },
  { id: "manjari", title: "Manjari incident", localities: ["Manjari"], talukas: ["haveli"], lifecycle: "developing", expiresAt: future },
  { id: "maval", title: "Maval incident", localities: ["Lonavala"], talukas: ["maval"], lifecycle: "developing", expiresAt: future }
];
const exact = hierarchicalIncidentEvents(hierarchyItems, { taluka: "haveli", locality: "Wagholi" }, localities);
assert(exact.level === "locality" && exact.items.length === 1 && exact.items[0].id === "wagholi", "Incident hierarchy must prefer the selected locality");
const talukaFallback = hierarchicalIncidentEvents(hierarchyItems.slice(1), { taluka: "haveli", locality: "Wagholi" }, localities);
assert(talukaFallback.level === "taluka" && talukaFallback.items.length === 1 && talukaFallback.items[0].id === "manjari", "Incident hierarchy must fall back from locality to Taluka");
const districtFallback = hierarchicalIncidentEvents(hierarchyItems.slice(2), { taluka: "haveli", locality: "Wagholi" }, localities);
assert(districtFallback.level === "district" && districtFallback.items.length === 1 && districtFallback.items[0].id === "maval", "Incident hierarchy must fall back from Taluka to Pune District");
console.log("Incident geographic relevance and deduplication tests passed.");
