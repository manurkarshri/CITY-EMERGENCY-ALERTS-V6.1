import { normalizeGoogleNewsRss, corroborateGoogleDiscoveries } from "../scripts/collectors/google-news-discovery-rss.js";

const checkedAt = "2026-07-11T12:00:00.000Z";
const xml = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Major fire in Pune industrial area - The Indian Express]]></title><link>https://news.google.com/rss/articles/example</link><pubDate>Sat, 11 Jul 2026 10:00:00 GMT</pubDate><source url="https://indianexpress.com">The Indian Express</source></item><item><title>पुण्यात मोठी आग - एबीपी माझा</title><link>https://news.google.com/mr</link><pubDate>Sat, 11 Jul 2026 10:10:00 GMT</pubDate><source>एबीपी माझा</source></item><item><title>Political meeting in Mumbai - TV9 Marathi</title><link>https://news.google.com/x</link><pubDate>Sat, 11 Jul 2026 10:00:00 GMT</pubDate><source>TV9 Marathi</source></item></channel></rss>`;
const discoveries = normalizeGoogleNewsRss(xml, checkedAt);
assert(discoveries.length === 2, "English and Marathi Pune emergency discoveries must be retained");
assert(discoveries[0].verificationStatus === "awaiting_direct_article", "Google discovery must not self-verify");
const verified = corroborateGoogleDiscoveries(discoveries, [{ id: "ie-direct", sourceId: "indian_express_pune", category: "fire", title: "Major fire in Pune industrial area", summary: "Fire breaks out in Pune industrial area", publishedAt: "2026-07-11T10:05:00.000Z" }]);
assert(verified[0].verificationStatus === "verified_direct_article", "Matching direct publisher article must verify a discovery");
console.log("Google News discovery tests passed.");
function assert(condition, message) { if (!condition) throw new Error(message); }
