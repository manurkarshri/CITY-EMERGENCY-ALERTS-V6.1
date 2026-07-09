import { calculateJourneyScore } from "../scripts/journey/journey-score.js";
import { compareRoutes } from "../scripts/journey/route-comparison.js";
import { buildJourneyExplanation } from "../scripts/journey/journey-explanation.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const route = { id: "test", label: "Test Route", via: ["Sinhagad Road"], operationalZones: ["Mutha River"], baseTimeMin: 30, mapsQuery: "test route" };
const context = {
  alerts: [{ id: "a1", category: "dam_release", severity: "warning", title: "Khadakwasla Dam", localities: ["Sinhagad Road"], operationalZones: ["Mutha River"] }],
  incidents: [],
  situation: { weather: { regions: { pune_city: { rainRisk: "Medium", visibilityRisk: "Low", windRisk: "Minimal" } } } },
  environmentalContext: { riverIntelligence: [] }
};

const score = calculateJourneyScore(route, context);
assert(score.score < 100, "Journey score should reduce due to active risk");

const compared = compareRoutes([route], context);
assert(compared[0].recommended === true, "Single route should be recommended");

const explanation = buildJourneyExplanation(compared[0]);
assert(explanation.includes("Journey suitability"), "Journey explanation failed");

console.log("Journey intelligence tests passed.");
