import { deduplicateTrafficIncidents, enrichIncidentGeography, sameTrafficIncident } from "../js/intelligence/incident-relevance.js";
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
console.log("Incident geographic relevance and deduplication tests passed.");
