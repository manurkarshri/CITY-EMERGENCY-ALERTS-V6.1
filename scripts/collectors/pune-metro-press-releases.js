const SOURCE_URL = "https://www.punemetrorail.org/press-release";
const DISRUPTION = /(?:service|metro|train)[\s\S]{0,80}(?:suspend|closed|closure|delay|disrupt|divert|cancel|partially closed)|(?:suspend|closed|closure|delay|disrupt|divert|cancel)[\s\S]{0,80}(?:service|metro|train)|traffic diversion/i;

export async function fetchPuneMetroIncidents(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    const response = await fetchImpl(SOURCE_URL, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" }, signal: controller.signal });
    if (!response.ok) throw new Error(`Pune Metro request failed with HTTP ${response.status}`);
    return normalizePuneMetroPressReleases(await response.text(), checkedAt);
  } finally { clearTimeout(timeout); }
}

export function normalizePuneMetroPressReleases(html, checkedAt) {
  if (!/<table\b/i.test(html || "") || !/Pune Metro/i.test(html || "")) throw new Error("Pune Metro returned an invalid press-release page");
  return [...String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<td\b[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td\b[^>]*>[\s\S]*?<a\b[^>]*href=['\"]([^'\"]+)['\"][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/td>[\s\S]*?<\/tr>/gi)]
    .map(match => normalizeRow(match[1], match[2], match[3], checkedAt)).filter(Boolean);
}

function normalizeRow(dateHtml, href, titleHtml, checkedAt) {
  const title = clean(titleHtml);
  const publishedAt = parseOfficialDate(clean(dateHtml));
  if (!publishedAt || new Date(checkedAt) - new Date(publishedAt) > 48 * 36e5 || !DISRUPTION.test(title)) return null;
  const link = new URL(href, SOURCE_URL).href;
  return { eventKind: "incident", sourceId: "pune_metro", title: `Official Pune Metro: ${title}`, summary: title,
    category: /traffic diversion/i.test(title) ? "road_closure" : "transport_disruption", severity: /closed|closure|suspend|cancel/i.test(title) ? "watch" : "advisory",
    source: "Pune Metro", sourceTrust: "A", link, publishedAt, lastUpdated: publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt,
    expiresAt: new Date(new Date(publishedAt).getTime() + 48 * 36e5).toISOString(), recommendedAction: "Confirm current Pune Metro service status before travel." };
}

function parseOfficialDate(value) { const match = String(value).match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/); if (!match) return null; const time = Date.parse(`${match[1]} ${match[2]} ${match[3]} 00:00:00 +0530`); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function clean(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim(); }
