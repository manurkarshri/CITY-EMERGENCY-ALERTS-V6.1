import { validateJsonFile } from "./validate-json.js";
import { validateEvent } from "./validate-events.js";
import { validateEnvironmentalContext } from "./validate-environment.js";
import { validateJourneyIntelligence } from "./validate-journey.js";
import { readJson } from "../lib/io.js";
import { log } from "../lib/logger.js";

const files = [
  "data/intelligence.json",
  "data/alerts.json",
  "data/incidents.json",
  "data/weather.json",
  "data/journey-context.json",
  "data/source-health.json",
  "data/build-status.json",
  "data/environmental-context.json",
  "data/journey-intelligence.json"
];

for (const file of files) {
  await validateJsonFile(file);
  log("Valid JSON", { file });
}

for (const file of ["data/alerts.json", "data/incidents.json"]) {
  const data = await readJson(file, { items: [] });
  for (const event of data.items || []) {
    const errors = validateEvent(event);
    if (errors.length) throw new Error(`${file}: ${event.id || "unknown"}: ${errors.join(", ")}`);
  }
}

const env = await readJson("data/environmental-context.json", {});
const envErrors = validateEnvironmentalContext(env);
if (envErrors.length) throw new Error(`Environmental context validation failed: ${envErrors.join(", ")}`);

const journey = await readJson("data/journey-intelligence.json", {});
const journeyErrors = validateJourneyIntelligence(journey);
if (journeyErrors.length) throw new Error(`Journey validation failed: ${journeyErrors.join(", ")}`);

log("Milestone C validation complete.");
