import { displayableIncidentItems, groupIncidentsForCitizens } from "../js/intelligence/incident-presentation.js";
import { hierarchicalIncidentEvents } from "../js/intelligence/incident-relevance.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const groups = groupIncidentsForCitizens([
  { id: "tomtom-traffic-close", source: "TomTom Traffic Incidents", category: "road_closure" },
  { id: "tomtom-traffic-crash", source: "TomTom Traffic Incidents", category: "accident" },
  { id: "news-fire", source: "Trusted News", category: "fire" },
  { id: "metro", source: "Pune Metro", category: "transport_disruption" }
]);
assert(groups.roadClosures.length === 1, "TomTom road closures must move to Journey");
assert(groups.publicSafety.length === 2, "Accidents and fires must remain on Incidents");
assert(groups.travel.length === 1, "Major transport disruption must remain on Incidents");
const fallbackItems = [
  { id: "pune-road-close", sourceId: "tomtom_traffic", category: "road_closure", talukas: ["pune_city"], localities: ["Deccan Gymkhana"], lifecycle: "active", expiresAt: "2099-01-01T00:00:00.000Z" },
  { id: "moshi-collapse", source: "Trusted News", category: "structural_collapse", talukas: ["pcmc"], localities: ["Moshi"], lifecycle: "developing", expiresAt: "2099-01-01T00:00:00.000Z" }
];
const fallback = hierarchicalIncidentEvents(displayableIncidentItems(fallbackItems), { taluka: "pune_city", locality: "Sadashiv Peth" });
assert(fallback.level === "district" && fallback.items[0]?.id === "moshi-collapse", "Journey-only road closures must not block the Incident district fallback");
console.log("Incident presentation and Journey closure tests passed.");
