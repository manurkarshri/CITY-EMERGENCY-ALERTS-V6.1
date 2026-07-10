import { normalizeSearchResults, normalizeRoutes, buildSearchUrl } from "../js/services/tomtom.js";
import { normalizeLiveWeather } from "../js/services/open-meteo-live.js";
import { analyseJourneyRoutes } from "../js/intelligence/journey-analysis.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const places = normalizeSearchResults({ results: [{ id: "deccan", type: "Geography", position: { lat: 18.516, lon: 73.841 }, address: { freeformAddress: "Deccan Gymkhana, Pune" } }] });
assert(places.length === 1 && places[0].position.lat === 18.516, "TomTom search normalization failed");
const nationwideSearchUrl = buildSearchUrl("Mumbai");
assert(nationwideSearchUrl.includes("countrySet=IN") && nationwideSearchUrl.includes("geobias=point"), "India-wide search must retain Pune geobias");
assert(!nationwideSearchUrl.includes("radius="), "India-wide search must not be constrained to Pune radius");

const freshWeather = normalizeLiveWeather({ latitude: 19.1, longitude: 72.9, current: { time: "2026-07-11T01:00", temperature_2m: 26, wind_speed_10m: 15, wind_gusts_10m: 22 }, hourly: { time: ["2026-07-11T01:00", "2026-07-11T02:00"], precipitation: [8, 8], precipitation_probability: [80, 90], visibility: [3000, 2000] } }, "2026-07-10T19:30:00Z");
assert(freshWeather.rainRisk === "Medium" && freshWeather.sourceCheckedAt, "Fresh route weather normalization failed");

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
const routeWeatherById = { [routes[0].id]: { point: { latitude: 18.55, longitude: 73.8, rainRisk: "High", visibilityRisk: "Minimal", windRisk: "Minimal" } }, [routes[1].id]: {} };
const weatherAnalysed = analyseJourneyRoutes(routes, { trafficIncidents: [], routeWeatherById, environmental: { weatherIntelligence: { regions: {} } } });
assert(weatherAnalysed.find(route => route.id === routes[0].id).journeySuitability.reasons.some(reason => reason.includes("Heavy rainfall")), "Weather was not applied to its route geometry");

const closure = { type: "Feature", geometry: { type: "Point", coordinates: [73.8, 18.55] }, properties: { id: "closed", iconCategory: 8 } };
const blockedRoute = { ...routes[1], sections: [{ simpleCategory: "ROAD_CLOSURE" }] };
const blocked = analyseJourneyRoutes([blockedRoute], { trafficIncidents: [], environmental: { weatherIntelligence: { regions: {} } } });
assert(blocked[0].journeySuitability.score === 0, "Blocked route must have JSI 0");
const nearbyClosure = analyseJourneyRoutes([routes[1]], { trafficIncidents: [closure], environmental: { weatherIntelligence: { regions: {} } } });
assert(nearbyClosure[0].journeySuitability.score > 0, "Nearby closure must be a caution penalty, not proof the route is blocked");
const nearbySideRoadClosure = { ...closure, geometry: { type: "Point", coordinates: [73.8, 18.556] } };
const notBlocked = analyseJourneyRoutes([routes[1]], { trafficIncidents: [nearbySideRoadClosure], environmental: { weatherIntelligence: { regions: {} } } });
assert(notBlocked[0].journeySuitability.score > 0, "Nearby side-road closure must not automatically block the route");

console.log("TomTom Journey integration tests passed.");
