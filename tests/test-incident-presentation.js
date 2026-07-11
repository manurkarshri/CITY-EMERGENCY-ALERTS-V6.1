import { groupIncidentsForCitizens } from "../js/intelligence/incident-presentation.js";

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
console.log("Incident presentation and Journey closure tests passed.");
