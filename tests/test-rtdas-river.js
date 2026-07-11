import { parseRtdasRiverPage, parseRtdasReservoirPage } from "../scripts/collectors/maharashtra-rtdas.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const riverHtml = `<input title="District : Pune&lt;/br>River Level : 542.61 (mtr)&lt;/br>Alert Level : 545.00 (mtr)&lt;/br>Danger Level : 546.30 (mtr)&lt;/br>Discharge : 13.98 (Cumecs)&lt;/br>Last Updated Date : 11/07/2026&lt;/br>Last Updated Time : 19:15:00&lt;/br>" tooltiptitle="Dattawadi" />`;
const river = parseRtdasRiverPage(riverHtml, { Dattawadi: { river: "Mutha River", talukas: ["pune_city"], localities: ["Dattawadi"] } }, "2026-07-11T19:30:00+05:30");
assert(river.length === 1, "RTDAS river record was not parsed");
assert(river[0].level === 542.61 && river[0].status === "normal", "RTDAS river thresholds were not interpreted correctly");
assert(river[0].freshness === "current", "Fresh RTDAS river record was marked stale");

const reservoirHtml = `<input title="Reservoir Level : 582.56 (mtr)&lt;/br>Discharge : 000.00 (Cumecs)&lt;/br>% Contents : 100.00 (%)&lt;/br>Live Contents : 55.91(McuM)&lt;/br>Last Updated Date : 11/07/2026&lt;/br>Last Updated Time : 19:00:00&lt;/br>" tooltiptitle="Khadakwasala" />`;
const reservoir = parseRtdasReservoirPage(reservoirHtml, { Khadakwasala: "khadakwasla" }, "2026-07-11T19:30:00+05:30");
assert(reservoir.length === 1 && reservoir[0].storagePercent === 100, "RTDAS reservoir storage was not parsed");
assert(reservoir[0].status === "normal", "Full storage was incorrectly converted into a flood warning");

console.log("Maharashtra RTDAS river tests passed.");
