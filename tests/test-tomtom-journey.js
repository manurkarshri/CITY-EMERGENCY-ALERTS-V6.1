import { normalizeSearchResults, normalizeRoutes } from "../js/services/tomtom.js";
import { analyseJourneyRoutes } from "../js/intelligence/journey-analysis.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const places = normalizeSearchResults({ results: [{ id: "deccan", type: "Geography", position: { lat: 18.516, lon: 73.841 }, address: { freeformAddress: "Deccan Gymkhana, Pune" } }] });
assert(places.length === 1 && places[0].position.lat === 18.516, "TomTom search normalization failed");

const start = { lat: 18.516, lon: 73.841 };
const destination = { lat: 18.591, lon: 73.739 };
const routes = normalizeRoutes({ routes: [
  { summary: { lengthInMeters: 22000, travelTimeInSeconds: 2700, trafficDelayInSeconds: 600, noTrafficTravelTimeInSeconds: 2100 }, legs: [{ points: [{ latitude: 18.516, longitude: 73.841 }, { latitude: 18.591, longitude: 73.739 }] }], sections: [] },
  { summary: { lengthInMeters: 25000, travelTimeInSeconds: 3000, trafficDelayInSeconds: 120, noTrafficTravelTimeInSeconds: 2880 }, legs: [{ points: [{ latitude: 18.516, longitude: 73.841 }, { latitude: 18.55, longitude: 73.8 }, { latitude: 18.591, longitude: 73.739 }] }], sections: [] }
] }, start, destination);
assert(routes.length === 2 && routes[0].trafficDelaySeconds === 600, "TomTom route normalization failed");

const analysed = analyseJourneyRoutes(routes, { trafficIncidents: [], environmental: { weatherIntelligence: { regions: {} } }, alerts: [], incidents: [] });
assert(analysed.length === 2, "Alternative routes were not analysed separately");
assert(analysed[0].id === "tomtom-route-2" && analysed[0].recommended, "Lower-risk route was not recommended");
assert(analysed[0].journeySuitability.score > analysed[1].journeySuitability.score, "Traffic penalty was not route-specific");

const closure = { type: "Feature", geometry: { type: "Point", coordinates: [73.8, 18.55] }, properties: { id: "closed", iconCategory: 8 } };
const blocked = analyseJourneyRoutes([routes[1]], { trafficIncidents: [closure], environmental: { weatherIntelligence: { regions: {} } } });
assert(blocked[0].journeySuitability.score === 0, "Blocked route must have JSI 0");

console.log("TomTom Journey integration tests passed.");
