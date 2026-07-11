import { classifyIncidentText } from "./indian-express-pune-rss.js";

const FEED_URL = "https://www.hindustantimes.com/feeds/rss/cities/pune-news/rssfeed.xml";

export async function fetchHindustanTimesIncidents(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    const response = await fetchImpl(FEED_URL, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" }, signal: controller.signal });
    if (!response.ok) throw new Error(`Hindustan Times RSS request failed with HTTP ${response.status}`);
    return normalizeHindustanTimesRss(await response.text(), checkedAt);
  } finally { clearTimeout(timeout); }
}

export function normalizeHindustanTimesRss(xml, checkedAt) {
  if (!/<rss\b/i.test(xml || "")) throw new Error("Hindustan Times returned an invalid RSS document");
  return [...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => parseItem(match[1], checkedAt)).filter(Boolean);
}

function parseItem(xml, checkedAt) {
  const title = clean(field(xml, "title"));
  const description = clean(field(xml, "description"));
  const classification = classifyIncidentText(`${title} ${description}`);
  const publishedAt = isoDate(field(xml, "pubDate"));
  if (!classification || !publishedAt || new Date(checkedAt) - new Date(publishedAt) > 24 * 36e5) return null;
  return { sourceId: "hindustan_times_pune", title: `Developing: ${title}`, summary: description || title, category: classification.category,
    severity: classification.severity, source: "Hindustan Times Pune", sourceTrust: "B", link: field(xml, "link"), publishedAt,
    lastUpdated: publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
    expiresAt: new Date(new Date(publishedAt).getTime() + (classification.severity === "watch" ? 24 : 12) * 36e5).toISOString() };
}

function field(xml, name) { const match = String(xml).match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i")); return decodeXml((match?.[1] || "").replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim()); }
function clean(value) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function decodeXml(value) { return String(value).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'"); }
