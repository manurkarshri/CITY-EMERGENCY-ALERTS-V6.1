import { normalizeIndianExpressRss } from "../scripts/collectors/indian-express-pune-rss.js";
import { applyEventFreshness } from "../scripts/intelligence/freshness.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const checkedAt = "2026-07-11T06:00:00.000Z";
const xml = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[Major fire breaks out in Pune warehouse]]></title><link>https://indianexpress.com/article/cities/pune/fire-123/</link><pubDate>Sat, 11 Jul 2026 05:00:00 +0000</pubDate><description><![CDATA[Fire services are at the scene and nearby traffic is affected.]]></description></item>
<item><title>Routine political meeting held in Pune</title><link>https://indianexpress.com/article/cities/pune/politics-456/</link><pubDate>Sat, 11 Jul 2026 05:00:00 +0000</pubDate><description>Leaders addressed attendees.</description></item>
<item><title>Pune landslide report compares old satellite images</title><link>https://indianexpress.com/article/cities/pune/analysis-789/</link><pubDate>Sat, 11 Jul 2026 05:00:00 +0000</pubDate><description>Images show the distance from a building.</description></item>
</channel></rss>`;
const items = normalizeIndianExpressRss(xml, checkedAt);
assert(items.length === 1, "Only citizen-impacting incident stories may enter the feed");
assert(items[0].title.startsWith("Developing:"), "Media incident must be visibly marked Developing");
assert(items[0].sourceTrust === "B" && items[0].expiresAt, "Media trust or expiry is missing");
const lifecycle = applyEventFreshness(items[0], { now: checkedAt });
assert(lifecycle.lifecycle === "developing", "Tier 2 incident must retain developing lifecycle");
assert(normalizeIndianExpressRss(xml, "2026-07-13T06:00:00.000Z").length === 0, "Old media story must not become a current incident");
console.log("Trusted media incident tests passed.");
