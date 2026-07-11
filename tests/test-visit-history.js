import { createVisitSnapshot, compareVisitSnapshots } from "../js/core/visit-history.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const event = { id: "a1", title: "River warning", severity: "warning", lifecycle: "active", publishedAt: "2026-07-11T10:00:00Z", lastUpdated: "2026-07-11T10:00:00Z", link: "https://example.gov/a1" };
const first = createVisitSnapshot([event], [], "2026-07-11T10:05:00Z");
assert(compareVisitSnapshots(null, first).firstVisit, "First visit did not establish a baseline");
assert(compareVisitSnapshots(first, first).items.length === 0, "Unchanged event was reported again");

const updated = createVisitSnapshot([{ ...event, lastUpdated: "2026-07-11T10:10:00Z", summary: "Updated details" }, { ...event, id: "a2", title: "New warning" }], [], "2026-07-11T10:15:00Z");
const changes = compareVisitSnapshots(first, updated).items;
assert(changes.filter(item => item.change === "updated").length === 1, "Updated event was not detected once");
assert(changes.filter(item => item.change === "new").length === 1, "New event was not detected once");

const resolved = compareVisitSnapshots(updated, createVisitSnapshot([], [], "2026-07-11T11:00:00Z")).items;
assert(resolved.length === 2 && resolved.every(item => item.change === "resolved"), "Resolved events were not detected");
assert(resolved.every(item => item.link), "Resolved event source link was not retained");

console.log("Since Your Last Visit tests passed.");
