import { readJson, writeJson } from "./lib/io.js";
import { log } from "./lib/logger.js";
import { discoverRoutes } from "./journey/route-discovery.js";
import { compareRoutes } from "./journey/route-comparison.js";
import { buildJourneyExplanation } from "./journey/journey-explanation.js";

log("Journey Intelligence build started.");

const requests = await readJson("data/journey-requests.json", { sampleRequests: [] });
const intelligence = await readJson("data/intelligence.json", { alerts: [], incidents: [], situation: {} });
const environmental = await readJson("data/environmental-context.json", {});
const context = { ...intelligence, environmentalContext: environmental };

const journeys = [];

for (const request of requests.sampleRequests || []) {
  const routes = await discoverRoutes(request.start, request.destination);
  const compared = compareRoutes(routes, context).map(route => ({
    ...route,
    explanation: buildJourneyExplanation(route)
  }));

  journeys.push({
    id: request.id,
    start: request.start,
    destination: request.destination,
    departure: request.departure,
    generatedAt: new Date().toISOString(),
    bestRoute: compared[0] || null,
    routes: compared
  });
}

await writeJson("data/journey-intelligence.json", {
  schemaVersion: "6.0.0",
  generatedAt: new Date().toISOString(),
  status: "healthy",
  journeys
});

intelligence.journeyIntelligence = { journeys };
await writeJson("data/intelligence.json", intelligence);

log("Journey Intelligence build completed.", { journeys: journeys.length });
