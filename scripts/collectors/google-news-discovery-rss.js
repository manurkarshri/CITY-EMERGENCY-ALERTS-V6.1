import { classifyIncidentText } from "./indian-express-pune-rss.js";
import { jaccardSimilarity } from "../lib/similarity.js";
import { detectLocality } from "../intelligence/locality.js";
import { incidentFreshnessHours } from "../intelligence/life-safety-classification.js";

export const FEED_URLS = [
  // A broad Pune feed is deliberately included before focused feeds. Focused
  // Google News queries can return no items even when the broad feed contains
  // qualifying local reports; downstream classification remains strict.
  googleSearch("Pune", "en"),
  googleSearch("Pune (accident OR hit-and-run OR crash OR collision OR killed OR injured OR fire OR rescue OR emergency)", "en"),
  googleSearch("Pune (flood OR landslide OR road closure OR collapse OR infrastructure failure OR explosion OR gas leak OR electrocution OR drowning OR stampede OR evacuation)", "en"),
  googleSearch("(PCMC OR Pimpri OR Chinchwad OR Akurdi OR Moshi OR Bhosari OR Nigdi OR Wakad OR Chakan) (accident OR crash OR killed OR injured OR fire OR collapse OR rescue OR emergency)", "en"),
  googleSearch("(Pune District OR Lonavala OR Talegaon OR Baramati OR Shirur OR Daund OR Indapur OR Junnar OR Bhor OR Mulshi) (accident OR crash OR killed OR injured OR fire OR flood OR landslide OR collapse OR rescue OR emergency)", "en"),
  googleSearch("Pune (dam discharge OR river alert OR river overflow OR waterlogging OR heavy rain OR red alert OR orange alert OR drinking water advisory OR water contamination OR turbidity)", "en"),
  googleSearch("Pune (protest OR march OR agitation OR morcha) (road closed OR traffic diversion OR traffic disruption OR violence OR police advisory)", "en"),
  googleSearch("Pune (food poisoning OR contaminated food OR unsafe food OR food adulteration OR food recall OR FDA raid OR drinking water unsafe OR boil water)", "en"),
  googleSearch("Pune (disease outbreak OR dengue OR cholera OR medical advisory OR medicine recall OR medicine shortage OR hospital emergency OR blood shortage)", "en"),
  googleSearch("Pune (air quality OR AQI OR pollution OR toxic smoke OR sewage spill OR chemical discharge OR environmental hazard OR lightning OR thunderstorm OR cloudburst OR rabies OR leopard attack)", "en"),
  googleSearch("(\u092a\u0941\u0923\u0947 OR \u092a\u093f\u0902\u092a\u0930\u0940 OR \u091a\u093f\u0902\u091a\u0935\u0921 OR \u0905\u0915\u0941\u0930\u094d\u0921\u0940 OR \u092e\u094b\u0936\u0940 OR Pune OR PCMC) (\u0905\u092a\u0918\u093e\u0924 OR \u0927\u0921\u0915 OR \u0920\u093e\u0930 OR \u091c\u0916\u092e\u0940 OR \u091a\u093f\u0930\u0921\u0932\u0947 OR \u0906\u0917 OR \u092a\u0942\u0930 OR \u0926\u0930\u0921 OR \u0930\u0938\u094d\u0924\u093e \u092c\u0902\u0926 OR \u0907\u092e\u093e\u0930\u0924 \u0915\u094b\u0938\u0933\u0932\u0940 OR \u092a\u0942\u0932 \u0915\u094b\u0938\u0933\u0932\u093e OR \u092c\u091a\u093e\u0935 OR \u0938\u094d\u092b\u094b\u091f OR \u0917\u0945\u0938 \u0917\u0933\u0924\u0940 OR \u092c\u0941\u0921\u093e\u0932\u0947 OR \u091a\u0947\u0902\u0917\u0930\u093e\u091a\u0947\u0902\u0917\u0930\u0940 OR \u0938\u094d\u0925\u0932\u093e\u0902\u0924\u0930 OR \u0906\u092a\u0924\u094d\u0924\u0940)", "mr"),
  googleSearch("(\u092a\u0941\u0923\u0947 OR \u092a\u093f\u0902\u092a\u0930\u0940 OR \u091a\u093f\u0902\u091a\u0935\u0921 OR \u0905\u0915\u0941\u0930\u094d\u0921\u0940 OR \u092e\u094b\u0936\u0940 OR Pune OR PCMC) (\u0939\u093e\u0926\u0938\u093e OR \u0926\u0941\u0930\u094d\u0918\u091f\u0928\u093e OR \u091f\u0915\u094d\u0915\u0930 OR \u092e\u094c\u0924 OR \u0918\u093e\u092f\u0932 OR \u0915\u0941\u091a\u0932\u093e OR \u0906\u0917 OR \u092c\u093e\u0922\u093c OR \u092d\u0942\u0938\u094d\u0916\u0932\u0928 OR \u0938\u0921\u093c\u0915 \u092c\u0902\u0926 OR \u0907\u092e\u093e\u0930\u0924 \u0917\u093f\u0930\u0940 OR \u092a\u0941\u0932 \u0917\u093f\u0930\u093e OR \u092c\u091a\u093e\u0935 OR \u0935\u093f\u0938\u094d\u092b\u094b\u091f OR \u0917\u0948\u0938 \u0930\u093f\u0938\u093e\u0935 OR \u0921\u0942\u092c\u093e OR \u092d\u0917\u0926\u0921\u093c OR \u0928\u093f\u0915\u093e\u0938\u0940 OR \u0906\u092a\u0926\u093e)", "hi")
];

function googleSearch(query, language) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${language}-IN&gl=IN&ceid=IN:${language}`;
}

const PUBLISHERS = [
  { id: "ians", name: "IANS", aliases: ["IANS", "Indo-Asian News Service"] },
  { id: "the_hindu", name: "The Hindu", aliases: ["The Hindu"] },
  { id: "deccan_herald", name: "Deccan Herald", aliases: ["Deccan Herald"] },
  { id: "times_of_india", name: "Times of India", aliases: ["Times of India", "The Times of India"] },
  { id: "the_telegraph", name: "The Telegraph", aliases: ["The Telegraph"] },
  { id: "ndtv", name: "NDTV", aliases: ["NDTV"] },
  { id: "india_today", name: "India Today", aliases: ["India Today"] },
  { id: "the_print", name: "ThePrint", aliases: ["ThePrint", "The Print"] },
  { id: "moneycontrol", name: "Moneycontrol", aliases: ["Moneycontrol", "Moneycontrol.com"] },
  { id: "mid_day", name: "Mid-day", aliases: ["Mid-day", "Mid Day", "mid-day"] },
  { id: "pudhari", name: "Pudhari", aliases: ["Pudhari"] },
  { id: "divya_marathi", name: "Divya Marathi", aliases: ["Divya Marathi"] },
  { id: "gomantak", name: "Gomantak", aliases: ["Gomantak"] },
  { id: "agrowon", name: "Agrowon", aliases: ["Agrowon"] },
  { id: "punekar_news", name: "Punekar News", aliases: ["Punekar News"] },
  { id: "pune_pulse", name: "Pune Pulse", aliases: ["Pune Pulse"] },
  { id: "news18_lokmat", name: "News18 Lokmat", aliases: ["News18 Lokmat", "News18 Marathi"] },
  { id: "saam_tv", name: "Saam TV", aliases: ["Saam TV"] },
  { id: "pti", name: "PTI", aliases: ["PTI", "Press Trust of India"] },
  { id: "ani", name: "ANI", aliases: ["ANI", "Asian News International"] },
  { id: "indian_express_pune", name: "Indian Express Pune", aliases: ["The Indian Express", "Indian Express"] },
  { id: "hindustan_times_pune", name: "Hindustan Times Pune", aliases: ["Hindustan Times"] },
  { id: "sakal", name: "eSakal Pune", aliases: ["Sakal", "eSakal", "सकाळ"] },
  { id: "lokmat", name: "Lokmat Pune", aliases: ["Lokmat", "Lokmat Times", "लोकमत"] },
  { id: "loksatta", name: "Loksatta Pune", aliases: ["Loksatta", "लोकसत्ता"] },
  { id: "maharashtra_times", name: "Maharashtra Times Pune", aliases: ["Maharashtra Times", "Maharashtra Times Marathi", "महाराष्ट्र टाइम्स"] },
  { id: "abp_majha", name: "ABP Majha Pune", aliases: ["ABP Majha", "ABP Live Marathi", "एबीपी माझा"] },
  { id: "tv9_marathi", name: "TV9 Marathi Pune", aliases: ["TV9 Marathi", "टीव्ही 9 मराठी"] }
];

export async function fetchGoogleNewsDiscoveries(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const results = await Promise.allSettled(FEED_URLS.map(async url => {
    const response = await fetchImpl(url, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" } });
    if (!response.ok) throw new Error(`Google News RSS request failed with HTTP ${response.status}`);
    return response.text();
  }));
  const documents = results.filter(result => result.status === "fulfilled").map(result => result.value);
  if (!documents.length) {
    const firstError = results.find(result => result.status === "rejected");
    throw firstError?.reason || new Error("All Google News RSS requests failed");
  }
  return uniqueDiscoveries(documents.flatMap(xml => normalizeGoogleNewsRss(xml, checkedAt)));
}

export function normalizeGoogleNewsRss(xml, checkedAt) {
  if (!/<rss\b/i.test(xml || "")) throw new Error("Google News returned an invalid RSS document");
  return [...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => parseItem(match[1], checkedAt)).filter(Boolean);
}

export function corroborateGoogleDiscoveries(discoveries = [], directEvents = []) {
  return discoveries.map(discovery => {
    const matches = directEvents.filter(event => event.sourceId === discovery.publisherId && isMatch(discovery, event));
    return { ...discovery, verificationStatus: matches.length ? "verified_direct_article" : "awaiting_direct_article", verifiedEventIds: matches.map(item => item.id || `${item.sourceId}:${item.publishedAt}`) };
  });
}

export async function materializeGoogleDiscoveries(discoveries = [], checkedAt = new Date().toISOString()) {
  const items = [];
  for (const discovery of discoveries) {
    const publishedAt = new Date(discovery.publishedAt);
    if (!Number.isFinite(publishedAt.getTime()) || new Date(checkedAt) - publishedAt > 72 * 36e5) continue;
    const location = await detectLocality(localitySearchText(discovery.title));
    items.push({
      eventKind: "incident", sourceId: discovery.publisherId, collectionSourceId: "google_news_discovery", upstreamId: discovery.id,
      title: `Developing: ${discovery.title}`, summary: "A current trusted-media report relevant to Pune District.",
      category: discovery.category, severity: discovery.severity, source: discovery.publisher, sourceTrust: "B", link: discovery.discoveryLink,
      sourceOrigin: ["pti", "ani"].includes(discovery.publisherId) ? discovery.publisherId : "",
      publishedAt: discovery.publishedAt, discoveredAt: discovery.discoveredAt, lastUpdated: discovery.publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
      expiresAt: new Date(publishedAt.getTime() + incidentFreshnessHours(discovery) * 36e5).toISOString(),
      collectionProvider: "Google News RSS", discoveryOnly: true,
      reportedAuthority: discovery.reportedAuthority || "",
      geographicScope: location.localities.length || location.talukas.length ? "local" : "pune_district",
      affectedArea: location.localities.join(", ") || "Pune District", talukas: location.talukas, localities: location.localities
    });
  }
  return items;
}

function parseItem(xml, checkedAt) {
  const rawTitle = clean(field(xml, "title"));
  const sourceLabel = clean(field(xml, "source"));
  const publisher = identifyPublisher(sourceLabel || rawTitle);
  const title = stripPublisherSuffix(rawTitle, sourceLabel);
  const classification = classifyDiscoveryText(title);
  const publishedAt = isoDate(field(xml, "pubDate"));
  if (!publisher || !classification || !publishedAt || !isPuneDistrictHeadline(title)) return null;
  if (new Date(checkedAt) - new Date(publishedAt) > 72 * 36e5) return null;
  return { id: stableKey(`${publisher.id}|${title}|${publishedAt}`), publisherId: publisher.id, publisher: publisher.name, title,
    category: classification.category, severity: classification.severity, publishedAt, discoveredAt: checkedAt,
    reportedAuthority: reportedAuthority(title),
    discoveryLink: field(xml, "link"), discoveryProvider: "Google News RSS", verificationStatus: "awaiting_direct_article", verifiedEventIds: [] };
}

function reportedAuthority(text) {
  const rules = [
    [/\b(?:IMD|India Meteorological Department|weather department)\b/i, "India Meteorological Department"],
    [/\b(?:PMC|Pune Municipal Corporation)\b/i, "Pune Municipal Corporation"],
    [/\b(?:PCMC|Pimpri[- ]Chinchwad Municipal Corporation)\b/i, "Pimpri-Chinchwad Municipal Corporation"],
    [/\b(?:Pune Police|traffic police)\b/i, "Pune Police"],
    [/\b(?:district administration|district collector)\b/i, "Pune District Administration"],
    [/\b(?:irrigation department|water resources department|WRD)\b/i, "Maharashtra Water Resources Department"]
  ];
  return rules.find(([pattern]) => pattern.test(String(text || "")))?.[1] || "";
}

function identifyPublisher(value) { return PUBLISHERS.find(item => item.aliases.some(alias => String(value).toLowerCase().includes(alias.toLowerCase()))) || null; }
function isPuneDistrictHeadline(title) {
  return /\bpune\b|\bpcmc\b|\bpmc\b|\bpimpri\b|\bchinchwad\b|\bakurdi\b|\bmoshi\b|\bbhosari\b|\bnigdi\b|\bwakad\b|\bwagholi\b|\bhinj[ae]wadi\b|\bchakan\b|\blonavala\b|\btalegaon\b|\bbaramati\b|\bshirur\b|\bdaund\b|\bindapur\b|\bjunnar\b|\bsaswad\b|\bbhor\b|\bmulshi\b|\bmalshej\b|\btamhini\b|\bghorpade peth\b|पुण|पिंपरी|चिंचवड|अकुर्डी|मोशी/i.test(title);
}
function classifyDiscoveryText(text) {
  const hindiAndMarathi = [
    { category: "accident", severity: "watch", pattern: /\u0905\u092a\u0918\u093e\u0924|\u0927\u0921\u0915|\u0939\u093e\u0926\u0938\u093e|\u0926\u0941\u0930\u094d\u0918\u091f\u0928\u093e/i },
    { category: "fire", severity: "watch", pattern: /\u0906\u0917|\u0905\u0917\u094d\u0928\u093f\u0924\u093e\u0902\u0921\u0935/i },
    { category: "road_closure", severity: "watch", pattern: /\u0930\u0938\u094d\u0924(?:\u093e|\u0947).{0,36}\u092c\u0902\u0926|\u0935\u093e\u0939\u0924.{0,36}(?:\u092c\u0902\u0926|\u092c\u0926\u0932|\u0935\u0933\u0935)|\u0938\u0921\u093c\u0915.{0,36}\u092c\u0902\u0926|\u091f\u094d\u0930\u0948\u092b\u093f\u0915 \u0921\u093e\u092f\u0935\u0930\u094d\u091c\u0928/i },
    { category: "flood", severity: "watch", pattern: /(?:^|[\s,;:])\u092a\u0942\u0930(?:[\s,;:.!?]|$)|\u092c\u093e\u0922\u093c|\u091c\u0932\u092d\u0930\u093e\u0935/i },
    { category: "landslide", severity: "watch", pattern: /\u0926\u0930\u0921|\u092d\u0942\u0938\u094d\u0916\u0932\u0928/i },
    { category: "transport_disruption", severity: "advisory", pattern: /\u0930\u0947\u0932\u0935\u0947.*\u0930\u0926\u094d\u0926|\u092e\u0947\u091f\u094d\u0930\u094b.*\u092c\u0902\u0926/i }
  ];
  return classifyIncidentText(text) || hindiAndMarathi.find(rule => rule.pattern.test(text)) || [
    { category: "dam_release", severity: "warning", pattern: /\b(?:dam|reservoir).{0,55}(?:discharge|release(?:d|s|ing)? water|spillway)|\b\d[\d,]*\s*cusecs?\b/i },
    { category: "health_emergency", severity: "warning", pattern: /\b(?:drinking|tap|raw) water.{0,70}(?:advisory|contaminat|turbidity|unsafe|boil|filter)|\b(?:boil|filter).{0,45}(?:drinking|tap) water\b/i },
    { category: "health_emergency", severity: "warning", pattern: /\b(?:dengue|cholera|viral|disease) (?:surge|outbreak)\b/i },
    { category: "heavy_rain", severity: "warning", pattern: /\b(?:red|orange) alert.{0,60}(?:rain|pune)|\bheavy to (?:very|extremely) heavy rain\b/i },
    { category: "road_closure", severity: "warning", pattern: /\b(?:protest|march|agitation|morcha).{0,80}(?:road clos|traffic diversion|traffic disrupt|route diversion)\b/i },
    { category: "road_closure", severity: "warning", pattern: /\b(?:ghat|road|route|bridge|expressway|highway).{0,60}(?:closed|closure|blocked|diversion)\b/i },
    { category: "public_safety", severity: "warning", pattern: /\b(?:shot at|shooting|firing|armed attack)\b/i },
    { category: "accident", severity: "watch", pattern: /अपघात|धडक|वाहन.*उलट/i },
    { category: "fire", severity: "watch", pattern: /आग|अग्नितांडव|आगीची घटना/i },
    { category: "flood", severity: "watch", pattern: /पूर|पाणी साच|जलमय|धरण.*विसर्ग|नदी.*पातळी/i },
    { category: "landslide", severity: "watch", pattern: /दरड|भूस्खलन/i },
    { category: "road_closure", severity: "watch", pattern: /रस्ता बंद|वाहतूक बंद|मार्ग बंद|वाहतूक वळव/i },
    { category: "transport_disruption", severity: "advisory", pattern: /रेल्वे.*रद्द|गाडी.*रद्द|मेट्रो.*बंद|उड्डाण.*रद्द/i },
    { category: "power_outage", severity: "advisory", pattern: /वीजपुरवठा.*खंडित|वीज.*बंद/i },
    { category: "water_supply", severity: "advisory", pattern: /पाणीपुरवठा.*बंद|पाणी.*कपात/i }
  ].find(rule => rule.pattern.test(text)) || null;
}
function localitySearchText(text) {
  return String(text || "")
    .replace(/\u0939\u0921\u092a\u0938\u0930/gi, "Hadapsar")
    .replace(/\u092a\u093f\u0902\u092a\u0930\u0940/gi, "Pimpri")
    .replace(/\u091a\u093f\u0902\u091a\u0935\u0921/gi, "Chinchwad")
    .replace(/\u092e\u094b\u0936\u0940/gi, "Moshi")
    .replace(/\u0939\u093f\u0902\u091c\u0947\u0935\u093e\u0921\u093c\u0940/gi, "Hinjawadi");
}
function stripPublisherSuffix(title, source) { return source ? title.replace(new RegExp(`\\s+-\\s+${escapeRegExp(source)}$`, "i"), "").trim() : title; }
function isMatch(a, b) { const hours = Math.abs(new Date(a.publishedAt) - new Date(b.publishedAt)) / 36e5; return hours <= 36 && a.category === b.category && jaccardSimilarity(a.title, `${b.title || ""} ${b.summary || ""}`) >= 0.32; }
function field(xml, name) { const match = String(xml).match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i")); return decodeXml((match?.[1] || "").replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim()); }
function clean(value) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function decodeXml(value) { return String(value).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'"); }
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function stableKey(value) { let hash = 2166136261; for (const char of value) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); } return `google-news-${(hash >>> 0).toString(16)}`; }
function uniqueDiscoveries(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.publisherId}|${item.title.toLowerCase()}|${item.publishedAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
