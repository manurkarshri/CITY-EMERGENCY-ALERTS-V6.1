import { buildWeatherIntelligence } from "../scripts/environment/weather-intelligence.js";
import { buildEnvironmentalImpact } from "../scripts/environment/environmental-impact.js";
import { buildEmergencyStory } from "../scripts/environment/emergency-story-engine.js";
import { buildOpenMeteoUrl, normalizeOpenMeteoResponse } from "../scripts/collectors/open-meteo.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const weather = buildWeatherIntelligence({ regions: { pune_city: { label: "Pune City", temp: 27, next6hRainMm: 20, wind: 18, visibility: 3 } } });
assert(weather.regions.pune_city.rainRisk === "Medium", "Weather rain risk failed");
const impact = buildEnvironmentalImpact({ weatherIntelligence: weather, riverIntelligence: [], activeEvents: [], seasonalIntelligence: { activeSeason: "monsoon" } });
assert(impact.riskLevel === "Elevated", "Environmental impact risk failed");
const story = buildEmergencyStory({ weatherIntelligence: weather, riverIntelligence: [], environmentalImpact: impact, activeEvents: [] });
assert(story.length > 20, "Emergency story failed");

const locations = { pune_city: { label: "Pune City", lat: 18.5204, lon: 73.8567 } };
const apiUrl = buildOpenMeteoUrl(locations);
assert(apiUrl.includes("precipitation_probability"), "Open-Meteo URL is missing forecast rain probability");
const normalized = normalizeOpenMeteoResponse({
  latitude: 18.52,
  longitude: 73.86,
  utc_offset_seconds: 19800,
  current: { time: "2026-07-10T12:00", temperature_2m: 27, relative_humidity_2m: 82, precipitation: 1.2, rain: 1.2, weather_code: 61, wind_speed_10m: 17, wind_gusts_10m: 31 },
  hourly: { time: ["2026-07-10T12:00", "2026-07-10T13:00", "2026-07-10T14:00"], precipitation_probability: [60, 70, 40], precipitation: [1.2, 2.3, 0.5], visibility: [8000, 6000, 9000] }
}, locations, "2026-07-10T06:30:00.000Z");
assert(normalized.pune_city.next6hRainMm === 4, "Open-Meteo rainfall normalization failed");
assert(normalized.pune_city.precipitationProbability === 70, "Open-Meteo probability normalization failed");
assert(normalized.pune_city.visibility === 6, "Open-Meteo visibility normalization failed");
assert(normalized.pune_city.observedAt.endsWith("+05:30"), "Open-Meteo local timestamp normalization failed");
console.log("Environmental intelligence tests passed.");
