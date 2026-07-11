import fs from "fs/promises";

function assert(condition, message) { if (!condition) throw new Error(message); }
const journeyUi = await fs.readFile(new URL("../js/ui/journey.js", import.meta.url), "utf8");
const cardsCss = await fs.readFile(new URL("../css/cards.css", import.meta.url), "utf8");

assert(journeyUi.indexOf('id="journeyResults"') < journeyUi.indexOf('id="journeyRoadClosures"'), "Road closures must render after journey results");
assert(journeyUi.includes('class="grid journey-metrics"'), "Journey metrics need a dedicated layout class");
assert(cardsCss.includes(".journey-metrics .metric strong,.journey-metrics .metric span{display:block}"), "Journey metric labels must be on a separate line");
