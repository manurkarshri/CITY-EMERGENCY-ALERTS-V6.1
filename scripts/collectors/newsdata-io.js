import { classifyIncidentText } from "./indian-express-pune-rss.js";

const API_URL = "https://newsdata.io/api/1/latest";
const MINIMUM_REFRESH_MS = 30 * 60 * 1000;
const ALLOWED_PUBLISHERS = /Indian Express|Hindustan Times|e?Sakal|Lokmat|Loksatta|Maharashtra Times|ABP Majha|ABP Live Marathi|TV9 Marathi/i;

export async function fetchNewsDataIncidents(options = {}) {
  const apiKey = options.apiKey || process.env.NEWSDATA_API_KEY;
  if (!apiKey) throw new Error("NEWSDATA_API_KEY is not configured");
  const checkedAt = options.checkedAt || new Date().toISOString();
  if (!isDue(options.lastSuccessfulAt, checkedAt)) return { notModified: true, skipped: true };
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const url = new URL(API_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("country", "in");
  url.searchParams.set("q", "Pune OR PCMC OR Pimpri");
  url.searchParams.set("category", "crime,environment");
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
  const text = `${title} ${summary}`;
  const classification = classifyNewsDataText(text);
  const publishedAt = isoDate(article.pubDate || article.pubDateTZ || article.published_at);
  const link = safePublisherUrl(article.link);
  if (!title || !publisher || !ALLOWED_PUBLISHERS.test(publisher) || !classification || !publishedAt || !link) return null;
  if (!/pune|pimpri|chinchwad|pcmc|पुण|पिंपरी|चिंचवड/i.test(text)) return null;
  return {
    sourceId: publisherId(publisher), collectionSourceId: "newsdata_io", upstreamId: String(article.article_id || ""),
    title: `Developing: ${title}`, summary: summary || title, category: classification.category, severity: classification.severity,
    source: canonicalPublisher(publisher), sourceTrust: "B", link, publishedAt, lastUpdated: publishedAt,
    sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
    expiresAt: new Date(new Date(publishedAt).getTime() + (classification.severity === "watch" ? 24 : 12) * 36e5).toISOString(),
    collectionProvider: "NewsData.io"
  };
}

function classifyNewsDataText(text) {
  return classifyIncidentText(text) || [
    { category: "accident", severity: "watch", pattern: /अपघात|धडक|वाहन.*उलट/i },
    { category: "fire", severity: "watch", pattern: /आग|अग्नितांडव|आगीची घटना/i },
    { category: "flood", severity: "watch", pattern: /पूर|पाणी साच|जलमय|धरण.*विसर्ग|नदी.*पातळी/i },
    { category: "landslide", severity: "watch", pattern: /दरड|भूस्खलन/i },
    { category: "road_closure", severity: "watch", pattern: /रस्ता बंद|वाहतूक बंद|मार्ग बंद|वाहतूक वळव/i },
    { category: "transport_disruption", severity: "advisory", pattern: /रेल्वे.*रद्द|मेट्रो.*बंद|उड्डाण.*रद्द|वाहतूक.*विस्कळीत/i }
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

