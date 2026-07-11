import { normalizeImdNowcastRss, classifyNowcast } from "../scripts/collectors/imd-nowcast-rss.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const checkedAt = "2026-07-11T05:00:00.000Z";
const xml = `<?xml version="1.0"?><rss><channel>
<item><title>PUNE</title><guid>pune-1</guid><link>https://mausam.imd.gov.in/warning</link><sent>2026-07-11T10:00:00+05:30</sent><Expires>2026-07-11T13:00:00+05:30</Expires><description><![CDATA[Moderate rain: 5-15 mm/hr ,]]></description></item>
<item><title>MUMBAI</title><guid>mumbai-1</guid><sent>2026-07-11T10:00:00+05:30</sent><Expires>2026-07-11T13:00:00+05:30</Expires><description>Heavy rain</description></item>
</channel></rss>`;
const items = normalizeImdNowcastRss(xml, checkedAt);
assert(items.length === 1, "IMD collector must retain only Pune alerts");
assert(items[0].severity === "watch" && items[0].category === "rain", "Moderate rain classification failed");
assert(items[0].sourceTrust === "A" && items[0].expiresAt, "Official trust or expiry missing");
assert(classifyNowcast("Very heavy rain").severity === "warning", "Heavy rain severity failed");
assert(normalizeImdNowcastRss(xml, "2026-07-11T08:00:00.000Z").length === 0, "Expired warning must be removed");
console.log("IMD alert collector tests passed.");
