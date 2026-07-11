const FEED_URL = "https://mausam.imd.gov.in/imd_latest/contents/dist_nowcast_rss.php";

export async function fetchImdNowcasts(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    const response = await fetchImpl(FEED_URL, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" }, signal: controller.signal });
    if (!response.ok) throw new Error(`IMD RSS request failed with HTTP ${response.status}`);
    return normalizeImdNowcastRss(await response.text(), checkedAt);
  } finally { clearTimeout(timeout); }
}

export function normalizeImdNowcastRss(xml, checkedAt) {
  if (!/<rss\b/i.test(xml || "")) throw new Error("IMD returned an invalid RSS document");
  return [...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => parseItem(match[1], checkedAt)).filter(Boolean);
}

function parseItem(xml, checkedAt) {
  const district = field(xml, "title").trim();
  if (!/^pune(?:\s+district)?$/i.test(district)) return null;
  const summary = cleanDescription(field(xml, "description"));
  const publishedAt = isoDate(field(xml, "sent") || field(xml, "pubDate"));
  const expiresAt = isoDate(field(xml, "Expires"));
  if (!summary || !publishedAt || !expiresAt || new Date(expiresAt) <= new Date(checkedAt)) return null;
  const classification = classifyNowcast(summary);
  return { id: `imd-nowcast-${safe(field(xml, "guid") || `${publishedAt}-${summary}`)}`, eventKind: "alert", sourceId: "imd_nowcast", title: `IMD Pune nowcast: ${headline(summary)}`, summary,
    category: classification.category, severity: classification.severity, source: "India Meteorological Department", sourceTrust: "A",
    link: field(xml, "link") || "https://mausam.imd.gov.in/imd_latest/contents/districtwisewarnings.php", publishedAt, lastUpdated: publishedAt,
    sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt, expiresAt, affectedArea: "Pune District", talukas: [], localities: [] };
}

export function classifyNowcast(text) {
  const value = String(text).toLowerCase();
  if (/lightning|thunderstorm/.test(value)) return { category: "thunderstorm", severity: /severe|very severe|high cloud/.test(value) ? "warning" : "watch" };
  if (/very heavy|extremely heavy|heavy rain|>\s*15\s*mm/.test(value)) return { category: "heavy_rain", severity: "warning" };
  if (/rain/.test(value)) return { category: "rain", severity: /moderate|5\s*-\s*15/.test(value) ? "watch" : "advisory" };
  if (/strong|squall|wind/.test(value)) return { category: "strong_wind", severity: "watch" };
  return { category: "public_safety", severity: "advisory" };
}

function field(xml, name) { const match = String(xml).match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i")); return decodeXml((match?.[1] || "").replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim()); }
function cleanDescription(value) { return value.replace(/<[^>]+>/g, " ").replace(/\s*,\s*$/, "").replace(/\s+/g, " ").trim(); }
function headline(value) { return value.split(/[,.;]/)[0].trim().slice(0, 90) || "weather warning"; }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function safe(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100); }
function decodeXml(value) { return String(value).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'"); }
