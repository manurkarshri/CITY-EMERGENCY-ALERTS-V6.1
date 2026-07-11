import { summarizeCollection } from "../scripts/collectors/collection-health.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const required = ["imd_nowcast", "ndma_sachet", "indian_express_pune", "hindustan_times_pune", "pune_metro"].map(id => ({ id, status: "healthy" }));
const optionalFailure = summarizeCollection([...required, { id: "free_news_api", status: "unavailable" }], ["free_news_api: HTTP 400"]);
assert(optionalFailure.status === "healthy", "Optional media failure must not mark official intelligence stale");
assert(optionalFailure.error === null && optionalFailure.optionalErrors.length === 1, "Optional errors must remain visible without degrading core health");
const coreFailure = summarizeCollection(required.map(source => source.id === "ndma_sachet" ? { ...source, status: "unavailable" } : source), ["ndma_sachet: unavailable"]);
assert(coreFailure.status === "stale" && coreFailure.error.includes("ndma_sachet"), "Core official failure must degrade collection health");
