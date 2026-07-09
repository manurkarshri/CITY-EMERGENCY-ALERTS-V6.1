import { classifyEventText } from "../scripts/intelligence/classification.js";
import { jaccardSimilarity } from "../scripts/lib/similarity.js";
import { assessConfidence } from "../scripts/intelligence/confidence.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(classifyEventText("Khadakwasla dam water release").category === "dam_release", "Dam release classification failed");
assert(jaccardSimilarity("heavy rain pune", "heavy rain in pune city") > 0.4, "Similarity failed");

const confidence = assessConfidence({ sourceTrust: "A", sources: [{ name: "PMC" }, { name: "IMD" }], localities: ["Kharadi"], talukas: ["haveli"], lastUpdated: new Date().toISOString() });
assert(confidence.confidenceScore > 50, "Confidence scoring failed");

console.log("Intelligence core tests passed.");
