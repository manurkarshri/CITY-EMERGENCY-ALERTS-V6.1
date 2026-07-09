import { normalizeText, createStableId } from "../scripts/lib/text.js";
import { haversineKm } from "../scripts/lib/geo.js";
import "./test-intelligence-core.js";
import "./test-environmental-intelligence.js";
import "./test-journey-intelligence.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(normalizeText(" Heavy   Rain! ") === "heavy rain", "normalizeText failed");
assert(createStableId("Heavy Rain Alert").includes("heavy-rain"), "createStableId failed");
assert(haversineKm({lat:18.52, lon:73.85}, {lat:18.52, lon:73.85}) === 0, "haversine zero distance failed");

console.log("Milestone C tests passed.");
