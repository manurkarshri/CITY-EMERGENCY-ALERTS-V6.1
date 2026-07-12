import { classifyLifeSafetyText } from "../intelligence/life-safety-classification.js";
const FEED_URL = "https://indianexpress.com/section/cities/pune/feed/";

export async function fetchIndianExpressIncidents(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    const response = await fetchImpl(FEED_URL, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" }, signal: controller.signal });
    if (!response.ok) throw new Error(`Indian Express RSS request failed with HTTP ${response.status}`);
    return normalizeIndianExpressRss(await response.text(), checkedAt);
  } finally { clearTimeout(timeout); }
}

export function normalizeIndianExpressRss(xml, checkedAt) {
  if (!/<rss\b/i.test(xml || "")) throw new Error("Indian Express returned an invalid RSS document");
  return [...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => parseItem(match[1], checkedAt)).filter(Boolean);
}

function parseItem(xml, checkedAt) {
  const title = clean(field(xml, "title"));
  const description = clean(field(xml, "description"));
  const classification = classifyIncidentText(`${title} ${description}`);
  const publishedAt = isoDate(field(xml, "pubDate"));
  if (!classification || !publishedAt || new Date(checkedAt) - new Date(publishedAt) > 24 * 36e5) return null;
  return { sourceId: "indian_express_pune", title: `Developing: ${title}`, summary: description || title, category: classification.category,
    severity: classification.severity, source: "Indian Express Pune", sourceTrust: "B", link: field(xml, "link"), publishedAt,
    lastUpdated: publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
    expiresAt: new Date(new Date(publishedAt).getTime() + (classification.severity === "watch" ? 24 : 12) * 36e5).toISOString() };
}

export function classifyIncidentText(text) { return classifyLifeSafetyText(text); }

function field(xml, name) { const match = String(xml).match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i")); return decodeXml((match?.[1] || "").replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim()); }
function clean(value) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function decodeXml(value) { return String(value).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'"); }
