import { classifyIncidentText } from "./indian-express-pune-rss.js";

const API_URL = "https://api.freenewsapi.io/v1/news";
const SEARCHES = [
  { language: "en", q: "Pune accident fire flood landslide" },
  { language: "en", q: "PCMC emergency closure disruption accident" },
  { language: "mr", q: "पुणे अपघात आग पूर दरड" },
  { language: "mr", q: "पिंपरी चिंचवड रस्ता बंद आपत्ती" }
];
const ALLOWED_PUBLISHERS = /Indian Express|Hindustan Times|e?Sakal|Lokmat|Loksatta|Maharashtra Times|ABP Majha|ABP Live Marathi|TV9 Marathi/i;

export async function fetchFreeNewsIncidents(options = {}) {
  const apiKey = options.apiKey || process.env.FREE_NEWS_API_KEY;
  if (!apiKey) throw new Error("FREE_NEWS_API_KEY is not configured");
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const publishedAfter = new Date(new Date(checkedAt).getTime() - 36 * 36e5).toISOString();
  const responses = [];
  for (const search of SEARCHES) {
    const url = new URL(API_URL);
    url.searchParams.set("country", "IN");
    url.searchParams.set("language", search.language);
    url.searchParams.set("q", search.q);
    url.searchParams.set("published_after", publishedAfter);
    url.searchParams.set("order_by", "recent");
    const response = await fetchWithTimeout(fetchImpl, url, apiKey, options.timeoutMs || 20000);
    if (!response.ok) throw new Error(`FreeNewsAPI request failed with HTTP ${response.status}`);
    responses.push(await response.json());
  }
  const normalized = responses.flatMap(payload => normalizeFreeNewsResponse(payload, checkedAt));
  return uniqueArticles(normalized);
}

export function normalizeFreeNewsResponse(payload, checkedAt) {
  return (payload?.data || []).map(article => normalizeArticle(article, checkedAt)).filter(Boolean);
}

function normalizeArticle(article, checkedAt) {
  const title = clean(article.title);
  const summary = clean(article.subtitle || article.description || "");
  const publisher = publisherName(article.publisher);
  const text = `${title} ${summary}`;
  const classification = classifyFreeNewsText(text);
  const publishedAt = isoDate(article.published_at || article.publishedAt);
  const originalUrl = safePublisherUrl(article.original_url || article.url);
  if (!title || !publisher || !ALLOWED_PUBLISHERS.test(publisher) || !classification || !publishedAt || !originalUrl) return null;
  if (!/pune|pimpri|chinchwad|pcmc|पुण|पिंपरी|चिंचवड/i.test(text)) return null;
  return {
    sourceId: publisherId(publisher), upstreamId: String(article.uuid || ""), title: `Developing: ${title}`,
    summary: summary || title, category: classification.category, severity: classification.severity,
    source: canonicalPublisher(publisher), sourceTrust: "B", link: originalUrl, publishedAt, lastUpdated: publishedAt,
    sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
    expiresAt: new Date(new Date(publishedAt).getTime() + (classification.severity === "watch" ? 24 : 12) * 36e5).toISOString(),
    collectionProvider: "FreeNewsAPI"
  };
}

function classifyFreeNewsText(text) {
  return classifyIncidentText(text) || [
    { category: "accident", severity: "watch", pattern: /अपघात|धडक|वाहन.*उलट/i },
    { category: "fire", severity: "watch", pattern: /आग|अग्नितांडव|आगीची घटना/i },
    { category: "flood", severity: "watch", pattern: /पूर|पाणी साच|जलमय|धरण.*विसर्ग|नदी.*पातळी/i },
    { category: "landslide", severity: "watch", pattern: /दरड|भूस्खलन/i },
    { category: "road_closure", severity: "watch", pattern: /रस्ता बंद|वाहतूक बंद|मार्ग बंद|वाहतूक वळव/i },
    { category: "transport_disruption", severity: "advisory", pattern: /रेल्वे.*रद्द|मेट्रो.*बंद|उड्डाण.*रद्द|वाहतूक.*विस्कळीत/i }
  ].find(rule => rule.pattern.test(text)) || null;
}

async function fetchWithTimeout(fetchImpl, url, apiKey, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetchImpl(url, { headers: { "x-api-key": apiKey, "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" }, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}
function uniqueArticles(items) { const seen = new Set(); return items.filter(item => { const key = item.upstreamId || item.link; if (seen.has(key)) return false; seen.add(key); return true; }); }
function publisherName(value) { return typeof value === "string" ? value : String(value?.name || ""); }
function canonicalPublisher(value) {
  if (/Indian Express/i.test(value)) return "Indian Express Pune";
  if (/Hindustan Times/i.test(value)) return "Hindustan Times Pune";
  if (/e?Sakal/i.test(value)) return "eSakal Pune";
  if (/Lokmat/i.test(value)) return "Lokmat Pune";
  if (/Loksatta/i.test(value)) return "Loksatta Pune";
  if (/Maharashtra Times/i.test(value)) return "Maharashtra Times Pune";
  if (/ABP/i.test(value)) return "ABP Majha Pune";
  if (/TV9/i.test(value)) return "TV9 Marathi Pune";
  return value;
}
function publisherId(value) { return canonicalPublisher(value).toLowerCase().replace(/\s+pune$/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function safePublisherUrl(value) { try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; } }
function clean(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }

