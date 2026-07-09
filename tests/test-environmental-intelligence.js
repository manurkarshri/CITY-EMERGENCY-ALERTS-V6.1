import { buildWeatherIntelligence } from "../scripts/environment/weather-intelligence.js";
import { buildEnvironmentalImpact } from "../scripts/environment/environmental-impact.js";
import { buildEmergencyStory } from "../scripts/environment/emergency-story-engine.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const weather = buildWeatherIntelligence({ regions: { pune_city: { label: "Pune City", temp: 27, next6hRainMm: 20, wind: 18, visibility: 3 } } });
assert(weather.regions.pune_city.rainRisk === "Medium", "Weather rain risk failed");
const impact = buildEnvironmentalImpact({ weatherIntelligence: weather, riverIntelligence: [], activeEvents: [], seasonalIntelligence: { activeSeason: "monsoon" } });
assert(impact.riskLevel === "Elevated", "Environmental impact risk failed");
const story = buildEmergencyStory({ weatherIntelligence: weather, riverIntelligence: [], environmentalImpact: impact, activeEvents: [] });
assert(story.length > 20, "Emergency story failed");
console.log("Environmental intelligence tests passed.");
