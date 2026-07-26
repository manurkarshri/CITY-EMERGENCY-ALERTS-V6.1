import { parsePravahDailyReport } from "../scripts/collectors/maharashtra-pravah.js";
import { buildRiverIntelligence } from "../scripts/environment/river-intelligence.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const text = `
Status as on Date : 26/07/2026
Pune
Khadakwasla 26/07/2026 06:06 AM 30.00 55.91 85.91 55.91 85.91 100 % 57.47 %
Panshet 26/07/2026 06:26 AM 9.00 301.61 310.61 274.51 283.51 91.01 % 87.23 %
Warasgaon 26/07/2026 06:54 AM 12.23 363.13 375.36 307.72 319.95 84.74 % 90.53 %
Temghar 26/07/2026 06:31 AM 2.95 105.01 107.96 73.60 76.54 70.09 % 80.61 %
Mulshi Tata 26/07/2026 07:00 AM 230.00 522.76 752.76 491.18 721.18 93.96 % 89.44 %
`;

const parsed = parsePravahDailyReport(text, "2026-07-26T12:00:00.000Z");
assert(parsed.reportDay === "2026-07-26" && parsed.items.length === 5, "Current Pravah Pune dam rows must be parsed");
const khadakwasla = parsed.items.find(item => item.dam === "khadakwasla");
assert(khadakwasla.storagePercent === 100 && khadakwasla.liveContentsMcum === 55.91, "Pravah storage columns were interpreted incorrectly");
assert(khadakwasla.freshness === "current" && khadakwasla.storageOnly && khadakwasla.dischargeCumecs === null, "Pravah daily storage must be current-day informational data, not live discharge");

const intelligence = await buildRiverIntelligence({ items: parsed.items, sourceCheckedAt: "2026-07-26T12:00:00.000Z" });
assert(intelligence.length === 5 && intelligence.every(item => item.storageOnly), "Current Pravah storage must populate water intelligence with provenance");
assert(intelligence.every(item => item.severity === "advisory"), "Storage percentage alone must not create a warning");

const stale = parsePravahDailyReport(text, "2026-07-27T12:00:00.000Z");
assert(stale.items.every(item => item.freshness === "stale"), "A previous-day Pravah report must not be shown as current");

console.log("Maharashtra Pravah daily-report tests passed.");
