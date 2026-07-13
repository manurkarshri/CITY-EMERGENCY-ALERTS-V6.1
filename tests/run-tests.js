import { normalizeText, createStableId } from "../scripts/lib/text.js";
import { haversineKm } from "../scripts/lib/geo.js";
import "./test-intelligence-core.js";
import "./test-environmental-intelligence.js";
import "./test-journey-intelligence.js";
import "./test-freshness.js";
import "./test-locality.js";
import "./test-tomtom-journey.js";
import "./test-imd-alerts.js";
import "./test-media-incidents.js";
import "./test-google-news-discovery.js";
import "./test-free-news-api.js";
import "./test-newsdata-io.js";
import "./test-corroboration.js";
import "./test-ndma-cap.js";
import "./test-transport-incidents.js";
import "./test-incident-relevance.js";
import "./test-pune-metro-source.js";
import "./test-alert-empty-state.js";
import "./test-incident-presentation.js";
import "./test-rtdas-river.js";
import "./test-visit-history.js";
import "./test-safety-checklists.js";
import "./test-official-sources.js";
import "./test-event-source-links.js";
import "./test-pwa-offline.js";
import "./test-collection-health.js";
import "./test-journey-layout.js";
import "./test-disclaimer.js";
import "./test-pwa-icons.js";
import "./test-media-alert-promotion.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(normalizeText(" Heavy   Rain! ") === "heavy rain", "normalizeText failed");
assert(createStableId("Heavy Rain Alert").includes("heavy-rain"), "createStableId failed");
assert(haversineKm({lat:18.52, lon:73.85}, {lat:18.52, lon:73.85}) === 0, "haversine zero distance failed");

console.log("Milestone C tests passed.");
