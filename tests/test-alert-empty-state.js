import { buildAlertMonitoringSummary } from "../js/intelligence/alert-monitoring.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const summary = buildAlertMonitoringSummary({
  selected: { region: "pune_city", taluka: "pune_city", locality: "Kothrud" },
  regions: { pune_city: { label: "Pune City" } }, talukas: { pune_city: { label: "Pune City" } },
  sourceHealth: { sources: [{ id: "imd_nowcast", name: "IMD Pune", status: "healthy", sourceCheckedAt: "2026-07-11T10:00:00Z" }, { id: "ndma_sachet", name: "NDMA", status: "current", sourceCheckedAt: "2026-07-11T10:00:00Z" }] },
  environmental: { weatherIntelligence: { regions: { pune_city: { rainRisk: "Minimal" } } }, riverIntelligence: [{ status: "normal" }, { status: "normal" }] }
});
assert(summary.area === "Kothrud, Pune City", "Alert monitoring area must use the selected locality hierarchy without duplicate labels");
assert(summary.official === "2/2 official alert sources current", "Official alert source health summary failed");
assert(summary.weather === "Minimal rain risk" && summary.water === "Rivers and dams normal", "Environmental clear-state summary failed");
console.log("No-active-alert experience tests passed.");
