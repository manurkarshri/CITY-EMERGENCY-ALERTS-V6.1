import { FEED_URLS, normalizeGoogleNewsRss, corroborateGoogleDiscoveries, materializeGoogleDiscoveries } from "../scripts/collectors/google-news-discovery-rss.js";

const checkedAt = "2026-07-11T12:00:00.000Z";
const xml = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Major fire in Pune industrial area - The Indian Express]]></title><link>https://news.google.com/rss/articles/example</link><pubDate>Sat, 11 Jul 2026 10:00:00 GMT</pubDate><source url="https://indianexpress.com">The Indian Express</source></item><item><title>पुण्यात मोठी आग - एबीपी माझा</title><link>https://news.google.com/mr</link><pubDate>Sat, 11 Jul 2026 10:10:00 GMT</pubDate><source>एबीपी माझा</source></item><item><title>Political meeting in Mumbai - TV9 Marathi</title><link>https://news.google.com/x</link><pubDate>Sat, 11 Jul 2026 10:00:00 GMT</pubDate><source>TV9 Marathi</source></item></channel></rss>`;
const discoveries = normalizeGoogleNewsRss(xml, checkedAt);
assert(discoveries.length === 2, "English and Marathi Pune emergency discoveries must be retained");
assert(discoveries[0].verificationStatus === "awaiting_direct_article", "Google discovery must not self-verify");
const verified = corroborateGoogleDiscoveries(discoveries, [{ id: "ie-direct", sourceId: "indian_express_pune", category: "fire", title: "Major fire in Pune industrial area", summary: "Fire breaks out in Pune industrial area", publishedAt: "2026-07-11T10:05:00.000Z" }]);
assert(verified[0].verificationStatus === "verified_direct_article", "Matching direct publisher article must verify a discovery");
const materialized = await materializeGoogleDiscoveries(discoveries, checkedAt);
assert(materialized.length === 2, "Trusted Google discoveries must create developing incidents");
assert(materialized.every(item => item.eventKind === "incident" && item.sourceTrust === "B" && item.collectionProvider === "Google News RSS"), "Google discoveries must remain trusted-media incidents, not official alerts");
const staleDiscovery = { ...discoveries[0], publishedAt: "2026-07-10T22:00:00.000Z" };
assert((await materializeGoogleDiscoveries([staleDiscovery], checkedAt)).length === 0, "Google-only discoveries older than 12 hours must not become current incidents");
const hindiXml = `<?xml version="1.0"?><rss><channel><item><title>\u092a\u0941\u0923\u0947 \u092e\u0947\u0902 \u0938\u0921\u093c\u0915 \u092c\u0902\u0926 - ANI</title><link>https://news.google.com/hi</link><pubDate>Sat, 11 Jul 2026 10:20:00 GMT</pubDate><source>ANI</source></item></channel></rss>`;
const hindi = normalizeGoogleNewsRss(hindiXml, checkedAt);
assert(hindi.length === 1 && hindi[0].publisherId === "ani" && hindi[0].category === "road_closure", "Hindi ANI discovery must be retained and classified");
const wariXml = `<?xml version="1.0"?><rss><channel><item><title>\u092a\u0941\u0923\u0947-\u0938\u094b\u0932\u093e\u092a\u0942\u0930 \u0930\u0938\u094d\u0924\u094d\u092f\u093e\u0935\u0930\u0940\u0932 \u0935\u093e\u0939\u0924\u0941\u0915\u0940\u0924 \u092c\u0926\u0932 - Lokmat</title><link>https://news.google.com/mr/wari</link><pubDate>Sat, 11 Jul 2026 10:20:00 GMT</pubDate><source>Lokmat</source></item></channel></rss>`;
const wari = normalizeGoogleNewsRss(wariXml, checkedAt);
assert(wari.length === 1 && wari[0].category === "road_closure", "Solapur road wording must not be misclassified as a flood");
const collapseXml = `<?xml version="1.0"?><rss><channel><item><title>Pune building collapse leaves workers trapped - NDTV</title><link>https://news.google.com/collapse</link><pubDate>Sat, 11 Jul 2026 10:30:00 GMT</pubDate><source>NDTV</source></item></channel></rss>`;
const collapse = normalizeGoogleNewsRss(collapseXml, checkedAt);
assert(collapse.length === 1 && collapse[0].publisherId === "ndtv" && collapse[0].category === "structural_collapse", "Trusted Pune structural-collapse reporting must be retained");
const accidentXml = `<?xml version="1.0"?><rss><channel>
<item><title>Elderly man killed in Akurdi hit-and-run accident - The Times of India</title><link>https://news.google.com/akurdi</link><pubDate>Sat, 11 Jul 2026 10:35:00 GMT</pubDate><source>The Times of India</source></item>
<item><title>Three women killed as truck crashes into procession of warkaris in Pune - ThePrint</title><link>https://news.google.com/theprint</link><pubDate>Sat, 11 Jul 2026 10:36:00 GMT</pubDate><source>ThePrint</source></item>
<item><title>3 women killed, 4 critical after truck ploughs into Ashadhi Ekadashi pilgrims near Pune - Moneycontrol.com</title><link>https://news.google.com/moneycontrol</link><pubDate>Sat, 11 Jul 2026 10:37:00 GMT</pubDate><source>Moneycontrol.com</source></item>
<item><title>Maharashtra wari accident: Three warkaris killed after truck hits pilgrimage procession in Pune - Mid-day</title><link>https://news.google.com/midday</link><pubDate>Sat, 11 Jul 2026 10:38:00 GMT</pubDate><source>Mid-day</source></item>
</channel></rss>`;
const accidents = normalizeGoogleNewsRss(accidentXml, checkedAt);
assert(accidents.length === 4 && accidents.every(item => item.category === "accident"), "Hit-and-run and procession collision wording must create accident incidents");
assert(["the_print", "moneycontrol", "mid_day"].every(id => accidents.some(item => item.publisherId === id)), "ThePrint, Moneycontrol and Mid-day must be accepted as Tier 2 publishers");
const englishQuery = decodeURIComponent(FEED_URLS[0]);
assert(englishQuery.includes("Pune (accident OR hit-and-run") && !englishQuery.includes("Pune (PMC OR"), "Pune accident discovery must not require an extra municipal keyword");
assert(FEED_URLS.some(url => decodeURIComponent(url).includes("PCMC OR Pimpri")) && FEED_URLS.some(url => decodeURIComponent(url).includes("Pune District OR Lonavala")), "PCMC localities and Pune District towns must have focused discovery searches");
console.log("Google News discovery tests passed.");
function assert(condition, message) { if (!condition) throw new Error(message); }
