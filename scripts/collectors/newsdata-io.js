import { classifyIncidentText } from "./indian-express-pune-rss.js";
import { sourceOrigin } from "../intelligence/source-independence.js";
import { incidentFreshnessHours } from "../intelligence/life-safety-classification.js";
import { classifyQualifyingMediaArticle } from "../intelligence/media-article-qualification.js";

const API_URL = "https://newsdata.io/api/1/latest";
const MINIMUM_REFRESH_MS = 30 * 60 * 1000;
const ALLOWED_PUBLISHERS = /Indian Express|Hindustan Times|Live Hindustan|e?Sakal|Lokmat|Loksatta|Maharashtra Times|ABP Majha|ABP Live Marathi|ABP News|TV9 Marathi|News18(?: Hindi| Lokmat| Marathi)?|Dainik Bhaskar|Amar Ujala|Press Trust of India|\bPTI\b|Asian News International|\bANI\b|\bIANS\b|The Hindu|Deccan Herald|Times of India|The Telegraph|\bNDTV\b|India Today|ThePrint|The Print|Moneycontrol|Mid-day|Mid Day|Pudhari|Divya Marathi|Gomantak|Agrowon|Punekar News|Pune Pulse|Saam TV/i;

export async function fetchNewsDataIncidents(options = {}) {
  const apiKey = options.apiKey || process.env.NEWSDATA_API_KEY;
  if (!apiKey) throw new Error("NEWSDATA_API_KEY is not configured");
  const checkedAt = options.checkedAt || new Date().toISOString();
  if (!isDue(options.lastSuccessfulAt, checkedAt)) return { notModified: true, skipped: true };
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const url = new URL(API_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("country", "in");
  url.searchParams.set("q", "Pune OR PCMC OR Pimpri OR Chinchwad OR Hadapsar OR Hinjawadi");
  const response = await fetchWithTimeout(fetchImpl, url, options.timeoutMs || 20000);
  if (!response.ok) throw new Error(`NewsData.io request failed with HTTP ${response.status}`);
  return normalizeNewsDataResponse(await response.json(), checkedAt);
}

export function isDue(lastSuccessfulAt, checkedAt) {
  const last = Date.parse(lastSuccessfulAt || "");
  const current = Date.parse(checkedAt);
  return !Number.isFinite(last) || !Number.isFinite(current) || current - last >= MINIMUM_REFRESH_MS;
}

export function normalizeNewsDataResponse(payload, checkedAt) {
  return uniqueArticles((payload?.results || []).map(article => normalizeArticle(article, checkedAt)).filter(Boolean));
}

function normalizeArticle(article, checkedAt) {
  const title = clean(article.title);
  const summary = clean(article.description);
  const publisher = String(article.source_name || article.source_id || "");
  const classification = classifyQualifyingMediaArticle(title, summary);
  const publishedAt = isoDate(article.pubDate || article.pubDateTZ || article.published_at);
  const link = safePublisherUrl(article.link);
  if (!title || !publisher || !ALLOWED_PUBLISHERS.test(publisher) || !classification || !publishedAt || !link) return null;
  if (!isPuneHeadline(title)) return null;
  return {
    sourceId: publisherId(publisher), collectionSourceId: "newsdata_io", upstreamId: String(article.article_id || ""),
    title: `Developing: ${title}`, summary: summary || title, category: classification.category, severity: classification.severity,
    source: canonicalPublisher(publisher), sourceTrust: "B", link, publishedAt, lastUpdated: publishedAt,
    sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
    expiresAt: new Date(new Date(publishedAt).getTime() + incidentFreshnessHours(classification) * 36e5).toISOString(),
    collectionProvider: "NewsData.io", sourceOrigin: sourceOrigin(`${publisher} ${title} ${summary}`)
  };
}

function classifyNewsDataText(text) {
  return classifyIncidentText(text) || [
    { category: "accident", severity: "watch", pattern: /\u0905\u092a\u0918\u093e\u0924|\u0927\u0921\u0915|\u0935\u093e\u0939\u0928.*\u0909\u0932\u091f/i },
    { category: "fire", severity: "watch", pattern: /\u0906\u0917|\u0905\u0917\u094d\u0928\u093f\u0924\u093e\u0902\u0921\u0935|\u0906\u0917\u0940\u091a\u0940 \u0918\u091f\u0928\u093e/i },
    { category: "flood", severity: "watch", pattern: /\u092a\u0942\u0930|\u092a\u093e\u0923\u0940 \u0938\u093e\u091a|\u091c\u0932\u092e\u092f|\u0927\u0930\u0923.*\u0935\u093f\u0938\u0930\u094d\u0917|\u0928\u0926\u0940.*\u092a\u093e\u0924\u0933\u0940/i },
    { category: "landslide", severity: "watch", pattern: /\u0926\u0930\u0921|\u092d\u0942\u0938\u094d\u0916\u0932\u0928/i },
    { category: "road_closure", severity: "watch", pattern: /\u0930\u0938\u094d\u0924\u093e \u092c\u0902\u0926|\u0935\u093e\u0939\u0924\u0942\u0915 \u092c\u0902\u0926|\u092e\u093e\u0930\u094d\u0917 \u092c\u0902\u0926|\u0935\u093e\u0939\u0924\u0942\u0915 \u0935\u0933\u0935/i },
    { category: "transport_disruption", severity: "advisory", pattern: /\u0930\u0947\u0932\u094d\u0935\u0947.*\u0930\u0926\u094d\u0926|\u092e\u0947\u091f\u094d\u0930\u094b.*\u092c\u0902\u0926|\u0909\u0921\u094d\u0921\u093e\u0923.*\u0930\u0926\u094d\u0926|\u0935\u093e\u0939\u0924\u0942\u0915.*\u0935\u093f\u0938\u094d\u0915\u0933\u0940\u0924/i },
    { category: "accident", severity: "watch", pattern: /\u0926\u0941\u0930\u094d\u0918\u091f\u0928\u093e|\u0939\u093e\u0926\u0938\u093e|\u091f\u0915\u094d\u0915\u0930|\u0935\u093e\u0939\u0928.*\u092a\u0932\u091f/i },
    { category: "fire", severity: "watch", pattern: /\u0906\u0917 \u0932\u0917|\u092d\u0940\u0937\u0923 \u0906\u0917/i },
    { category: "flood", severity: "watch", pattern: /\u092c\u093e\u0922\u093c|\u091c\u0932\u092d\u0930\u093e\u0935|\u092a\u093e\u0928\u0940 \u092d\u0930|\u0928\u0926\u0940.*\u091c\u0932\u0938\u094d\u0924\u0930/i },
    { category: "landslide", severity: "watch", pattern: /\u092d\u0942\u0938\u094d\u0916\u0932\u0928|\u091a\u091f\u094d\u091f\u093e\u0928.*\u0917\u093f\u0930/i },
    { category: "road_closure", severity: "watch", pattern: /\u0938\u0921\u093c\u0915 \u092c\u0902\u0926|\u0930\u093e\u0938\u094d\u0924\u093e \u092c\u0902\u0926|\u092e\u093e\u0930\u094d\u0917 \u092c\u0902\u0926|\u091f\u094d\u0930\u0948\u092b\u093f\u0915 \u0921\u093e\u092f\u0935\u0930\u094d\u091c\u0928/i },
    { category: "transport_disruption", severity: "advisory", pattern: /\u091f\u094d\u0930\u0947\u0928.*(?:\u0930\u0926\u094d\u0926|\u092c\u093e\u0927\u093f\u0924)|\u0930\u0947\u0932.*\u092c\u093e\u0927\u093f\u0924|\u092e\u0947\u091f\u094d\u0930\u094b.*\u092c\u0902\u0926|\u0909\u0921\u093c\u093e\u0928.*\u0930\u0926\u094d\u0926/i }
  ].find(rule => rule.pattern.test(text)) || null;
}

async function fetchWithTimeout(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetchImpl(url, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" }, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}
function uniqueArticles(items) { const seen = new Set(); return items.filter(item => { const key = item.upstreamId || item.link; if (seen.has(key)) return false; seen.add(key); return true; }); }
function canonicalPublisher(value) {
  if (/Indian Express/i.test(value)) return "Indian Express Pune";
  if (/Hindustan Times/i.test(value)) return "Hindustan Times Pune";
  if (/Live Hindustan/i.test(value)) return "Live Hindustan Pune";
  if (/e?Sakal/i.test(value)) return "eSakal Pune";
  if (/Lokmat/i.test(value)) return "Lokmat Pune";
  if (/Loksatta/i.test(value)) return "Loksatta Pune";
  if (/Maharashtra Times/i.test(value)) return "Maharashtra Times Pune";
  if (/ABP Majha|ABP Live Marathi/i.test(value)) return "ABP Majha Pune";
  if (/ABP News/i.test(value)) return "ABP News Pune";
  if (/News18 Lokmat|News18 Marathi/i.test(value)) return "News18 Lokmat";
  if (/News18 Hindi/i.test(value)) return "News18 Hindi Pune";
  if (/Dainik Bhaskar/i.test(value)) return "Dainik Bhaskar Pune";
  if (/Amar Ujala/i.test(value)) return "Amar Ujala Pune";
  if (/TV9/i.test(value)) return "TV9 Marathi Pune";
  if (/\bIANS\b/i.test(value)) return "IANS";
  if (/The Hindu/i.test(value)) return "The Hindu";
  if (/Deccan Herald/i.test(value)) return "Deccan Herald";
  if (/Times of India/i.test(value)) return "Times of India";
  if (/The Telegraph/i.test(value)) return "The Telegraph";
  if (/\bNDTV\b/i.test(value)) return "NDTV";
  if (/India Today/i.test(value)) return "India Today";
  if (/ThePrint|The Print/i.test(value)) return "ThePrint";
  if (/Moneycontrol/i.test(value)) return "Moneycontrol";
  if (/Mid-day|Mid Day/i.test(value)) return "Mid-day";
  if (/Pudhari/i.test(value)) return "Pudhari";
  if (/Divya Marathi/i.test(value)) return "Divya Marathi";
  if (/Gomantak/i.test(value)) return "Gomantak";
  if (/Agrowon/i.test(value)) return "Agrowon";
  if (/Punekar News/i.test(value)) return "Punekar News";
  if (/Pune Pulse/i.test(value)) return "Pune Pulse";
  if (/Saam TV/i.test(value)) return "Saam TV";
  if (/Press Trust of India|\bPTI\b/i.test(value)) return "PTI";
  if (/Asian News International|\bANI\b/i.test(value)) return "ANI";
  return value;
}
function publisherId(value) { return canonicalPublisher(value).toLowerCase().replace(/\s+pune$/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function isPuneHeadline(title) { return /\bpune\b|\bpimpri\b|\bchinchwad\b|\bpcmc\b|\u092a\u0941\u0923|\u092a\u093f\u0902\u092a\u0930\u0940|\u091a\u093f\u0902\u091a\u0935\u0921|\u092a\u0940\u0938\u0940\u090f\u092e\u0938\u0940/i.test(title); }
function safePublisherUrl(value) { try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; } }
function clean(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
