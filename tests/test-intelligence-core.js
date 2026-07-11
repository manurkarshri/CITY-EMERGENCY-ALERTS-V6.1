import { classifyEventText } from "../scripts/intelligence/classification.js";
import { jaccardSimilarity } from "../scripts/lib/similarity.js";
import { assessConfidence } from "../scripts/intelligence/confidence.js";
import { inferEventKind } from "../scripts/intelligence/normalization.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(classifyEventText("Khadakwasla dam water release").category === "dam_release", "Dam release classification failed");
assert(jaccardSimilarity("heavy rain pune", "heavy rain in pune city") > 0.4, "Similarity failed");

const confidence = assessConfidence({ sourceTrust: "A", sources: [{ name: "PMC" }, { name: "IMD" }], localities: ["Kharadi"], talukas: ["haveli"], lastUpdated: new Date().toISOString() });
assert(confidence.confidenceScore > 50, "Confidence scoring failed");
assert(inferEventKind({ sourceId: "imd_nowcast", sourceTrust: "A" }, { category: "rain", severity: "watch" }) === "alert", "Official warning must be classified as an alert");
assert(inferEventKind({ sourceTrust: "B", title: "Heavy rain warning for Pune" }, { category: "rain", severity: "warning" }) === "alert", "Trusted-media warning must be classified as an alert");
assert(inferEventKind({ sourceTrust: "B", title: "Warehouse fire reported in Hadapsar" }, { category: "fire", severity: "warning" }) === "incident", "Reported fire must remain an incident");
assert(inferEventKind({ sourceTrust: "A", title: "Road accident near Katraj" }, { category: "accident", severity: "warning" }) === "incident", "Official accident report must remain an incident");

console.log("Intelligence core tests passed.");
