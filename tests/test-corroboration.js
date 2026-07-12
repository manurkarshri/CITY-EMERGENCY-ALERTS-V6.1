import { normalizeHindustanTimesRss } from "../scripts/collectors/hindustan-times-pune-rss.js";
import { corroboratedMatch, deduplicateEvents } from "../scripts/intelligence/deduplication.js";
import { assessConfidence } from "../scripts/intelligence/confidence.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const checkedAt = "2026-07-11T06:00:00.000Z";
const xml = `<?xml version="1.0"?><rss><channel><item><title>Lonavala landslide blocks rail route, trains cancelled</title><link>https://www.hindustantimes.com/cities/pune-news/lonavala-rail-123.html</link><pubDate>Sat, 11 Jul 2026 10:30:00 +0530</pubDate><description>Rail services near Lonavala face disruption after a landslide.</description></item></channel></rss>`;
const ht = normalizeHindustanTimesRss(xml, checkedAt)[0];
assert(ht?.sourceTrust === "B" && ht.title.startsWith("Developing:"), "HT developing incident normalization failed");
const ie = { ...ht, id: "ie-1", source: "Indian Express Pune", title: "Developing: Lonavala landslides force train cancellations", sources: [{ name: "Indian Express Pune", link: "https://indianexpress.com/x" }] };
const htEvent = { ...ht, id: "ht-1", sources: [{ name: "Hindustan Times Pune", link: ht.link }] };
assert(corroboratedMatch(ie, htEvent), "Independent matching Lonavala reports should corroborate");
assert(!corroboratedMatch(ie, { ...htEvent, category: "fire" }), "Different categories must not corroborate");
assert(!corroboratedMatch(ie, { ...htEvent, source: ie.source }), "Same publisher must not self-corroborate");
const merged = deduplicateEvents([ie, htEvent])[0];
assert(merged.corroboratedByIndependentSources && merged.sources.length === 2, "Corroborated sources were not merged");
const confidence = assessConfidence({ ...merged, localities: ["Lonavala"], talukas: ["maval"], lastUpdated: checkedAt });
assert(confidence.confidenceScore >= 70, "Independent corroboration should materially raise confidence");
const ptiHindi = { ...htEvent, id: "pti-hindi", source: "Amar Ujala Pune", title: "Developing: पुणे में आग लगने के बाद यातायात प्रभावित", category: "fire", localities: ["Hadapsar"], talukas: ["haveli"], publishedAt: "2026-07-11T10:15:00.000Z", sources: [{ name: "Amar Ujala Pune", origin: "pti", link: "https://amarujala.example/pti" }] };
const ptiMarathi = { ...ptiHindi, id: "pti-marathi", source: "Lokmat Pune", title: "Developing: हडपसरमध्ये आगीमुळे वाहतूक प्रभावित", publishedAt: "2026-07-11T11:00:00.000Z", sources: [{ name: "Lokmat Pune", origin: "pti", link: "https://lokmat.example/pti" }] };
const wireMerged = deduplicateEvents([ptiHindi, ptiMarathi])[0];
assert(wireMerged.sources.length === 2, "Multilingual copies of a wire report should be grouped");
assert(!wireMerged.corroboratedByIndependentSources && wireMerged.independentSourceCount === 1, "PTI republication must count as one originating report");
console.log("Incident corroboration tests passed.");
