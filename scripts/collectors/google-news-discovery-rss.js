import { classifyIncidentText } from "./indian-express-pune-rss.js";
import { jaccardSimilarity } from "../lib/similarity.js";
import { detectLocality } from "../intelligence/locality.js";
import { incidentFreshnessHours } from "../intelligence/life-safety-classification.js";

const FEED_URLS = [
  googleSearch("Pune (PMC OR PCMC OR Pimpri OR Chinchwad) (accident OR fire OR flood OR landslide OR road closure OR building collapse OR wall collapse OR rescue OR trapped OR explosion OR gas leak OR emergency)", "en"),
  googleSearch("\u092a\u0941\u0923\u0947 (\u0905\u092a\u0918\u093e\u0924 OR \u0906\u0917 OR \u092a\u0942\u0930 OR \u0926\u0930\u0921 OR \u0930\u0938\u094d\u0924\u093e \u092c\u0902\u0926 OR \u0907\u092e\u093e\u0930\u0924 \u0915\u094b\u0938\u0933\u0932\u0940 OR \u092c\u091a\u093e\u0935 OR \u0938\u094d\u092b\u094b\u091f OR \u0906\u092a\u0924\u094d\u0924\u0940)", "mr"),
  googleSearch("\u092a\u0941\u0923\u0947 (\u0939\u093e\u0926\u0938\u093e OR \u0906\u0917 OR \u092c\u093e\u0922\u093c OR \u092d\u0942\u0938\u094d\u0916\u0932\u0928 OR \u0938\u0921\u093c\u0915 \u092c\u0902\u0926 OR \u0907\u092e\u093e\u0930\u0924 \u0917\u093f\u0930\u0928\u093e OR \u092c\u091a\u093e\u0935 OR \u0938\u094d\u092b\u094b\u091f OR \u0906\u092a\u0926\u093e)", "hi")
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
  const documents = await Promise.all(FEED_URLS.map(async url => {
    const response = await fetchImpl(url, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" } });
    if (!response.ok) throw new Error(`Google News RSS request failed with HTTP ${response.status}`);
    return response.text();
  }));
  return documents.flatMap(xml => normalizeGoogleNewsRss(xml, checkedAt));
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
    if (!Number.isFinite(publishedAt.getTime()) || new Date(checkedAt) - publishedAt > 24 * 36e5) continue;
    const location = await detectLocality(localitySearchText(discovery.title));
    items.push({
      eventKind: "incident", sourceId: discovery.publisherId, collectionSourceId: "google_news_discovery", upstreamId: discovery.id,
      title: `Developing: ${discovery.title}`, summary: `Reported by ${discovery.publisher}. Official confirmation is awaited.`,
      category: discovery.category, severity: discovery.severity, source: discovery.publisher, sourceTrust: "B", link: discovery.discoveryLink,
      sourceOrigin: ["pti", "ani"].includes(discovery.publisherId) ? discovery.publisherId : "",
      publishedAt: discovery.publishedAt, lastUpdated: discovery.publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
      expiresAt: new Date(publishedAt.getTime() + incidentFreshnessHours(discovery) * 36e5).toISOString(),
      collectionProvider: "Google News RSS", discoveryOnly: true,
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
  if (!publisher || !classification || !publishedAt || !/pune|pimpri|chinchwad|pcmc|pmc|पुण|पिंपरी|चिंचवड/i.test(title)) return null;
  if (new Date(checkedAt) - new Date(publishedAt) > 36 * 36e5) return null;
  return { id: stableKey(`${publisher.id}|${title}|${publishedAt}`), publisherId: publisher.id, publisher: publisher.name, title,
    category: classification.category, severity: classification.severity, publishedAt, discoveredAt: checkedAt,
    discoveryLink: field(xml, "link"), discoveryProvider: "Google News RSS", verificationStatus: "awaiting_direct_article", verifiedEventIds: [] };
}

function identifyPublisher(value) { return PUBLISHERS.find(item => item.aliases.some(alias => String(value).toLowerCase().includes(alias.toLowerCase()))) || null; }
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
