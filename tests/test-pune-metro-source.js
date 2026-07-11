import { normalizePuneMetroPressReleases } from "../scripts/collectors/pune-metro-press-releases.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const checkedAt = "2026-07-11T12:00:00.000Z";
const html = `<html><title>Pune Metro</title><table><tr><td>11 Jul 2026</td><td><a href='download/service.pdf'>Pune Metro service partially suspended between Vanaz and Garware College</a></td></tr><tr><td>11 Jul 2026</td><td><a href='download/project.pdf'>Casting work begins for new tunnel segments</a></td></tr></table></html>`;
const items = normalizePuneMetroPressReleases(html, checkedAt);
assert(items.length === 1, "Routine Pune Metro news must not create an incident");
assert(items[0].sourceTrust === "A" && items[0].category === "transport_disruption", "Pune Metro disruption trust or classification failed");
assert(items[0].link === "https://www.punemetrorail.org/download/service.pdf", "Pune Metro source link resolution failed");
console.log("Pune Metro official source tests passed.");
