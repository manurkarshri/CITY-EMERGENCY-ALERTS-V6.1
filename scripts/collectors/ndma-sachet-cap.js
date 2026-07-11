const RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_maharashtra.xml";

export async function fetchNdmaSachetAlerts(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const checkedAt = options.checkedAt || new Date().toISOString();
  const headers = { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" };
  if (options.etag) headers["If-None-Match"] = options.etag;
  const response = await fetchImpl(RSS_URL, { headers });
  if (response.status === 304) return attachMeta([], { notModified: true, etag: options.etag });
  if (!response.ok) throw new Error(`NDMA SACHET RSS request failed with HTTP ${response.status}`);
  const rss = await response.text();
  if (!/<rss\b/i.test(rss)) throw new Error("NDMA SACHET returned an invalid RSS document");
  const candidates = parseRssCandidates(rss, checkedAt);
  const records = await Promise.all(candidates.map(item => fetchCap(item, fetchImpl, checkedAt)));
  return attachMeta(records.filter(Boolean), { etag: response.headers.get("etag") || null, notModified: false });
}

export function parseNdmaCap(xml, link, checkedAt) {
  if (!/<(?:cap:)?alert\b/i.test(xml || "")) return null;
  const status = field(xml, "status");
  const msgType = field(xml, "msgType");
  const scope = field(xml, "scope");
  if (status !== "Actual" || scope !== "Public" || !["Alert", "Update"].includes(msgType)) return null;
  const infos = [...String(xml).matchAll(/<(?:cap:)?info\b[^>]*>([\s\S]*?)<\/(?:cap:)?info>/gi)].map(match => match[1]);
  const info = infos.find(value => /^en(?:-|$)/i.test(field(value, "language"))) || infos[0];
  if (!info) return null;
  const area = field(info, "areaDesc");
  if (!/(?:^|[,;\s])pune(?:\s+district)?(?:$|[,;\s])/i.test(area)) return null;
  const expiresAt = isoDate(field(info, "expires"));
  if (!expiresAt || new Date(expiresAt) <= new Date(checkedAt)) return null;
  const event = clean(field(info, "event")) || "Emergency alert";
  const headline = clean(field(info, "headline")) || event;
  const description = clean(field(info, "description"));
  const instruction = clean(field(info, "instruction"));
  const classification = classifyCapEvent(event, field(info, "severity"));
  return { eventKind: "alert", sourceId: "ndma_sachet", upstreamId: field(xml, "identifier"), title: `Official: ${headline}`, summary: description || headline,
    category: classification.category, severity: classification.severity, source: `NDMA SACHET (${clean(field(xml, "sender")) || "Official authority"})`,
    sourceTrust: "A+", link, publishedAt: isoDate(field(xml, "sent")), lastUpdated: isoDate(field(xml, "sent")), sourceCheckedAt: checkedAt,
    lastVerifiedAt: checkedAt, expiresAt, recommendedAction: instruction || "Follow instructions issued by the responsible government authority.",
    talukas: [], localities: [], affectedArea: area, capMessageType: msgType, capReferences: clean(field(xml, "references")) };
}

export function classifyCapEvent(event, severity) {
  const text = String(event).toLowerCase();
  const category = /flood|inundat/.test(text) ? "flood" : /landslide|landslip/.test(text) ? "landslide" : /rain/.test(text) ? "heavy_rain" :
    /thunder|lightning/.test(text) ? "thunderstorm" : /cyclone|storm/.test(text) ? "storm" : /heat/.test(text) ? "heat" : /fire/.test(text) ? "fire" : "public_safety";
  const level = String(severity).toLowerCase();
  return { category, severity: level === "extreme" ? "emergency" : level === "severe" ? "warning" : level === "moderate" ? "watch" : "advisory" };
}

async function fetchCap(item, fetchImpl, checkedAt) {
  const response = await fetchImpl(item.link, { headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" } });
  if (!response.ok) throw new Error(`NDMA CAP request failed with HTTP ${response.status}`);
  return parseNdmaCap(await response.text(), item.link, checkedAt);
}
function parseRssCandidates(xml, checkedAt) {
  return [...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => ({ link: field(match[1], "link"), publishedAt: isoDate(field(match[1], "pubDate")) }))
    .filter(item => item.link && item.publishedAt && new Date(checkedAt) - new Date(item.publishedAt) <= 24 * 36e5);
}
function attachMeta(items, meta) { Object.assign(items, meta); return items; }
function field(xml, name) { const match = String(xml).match(new RegExp(`<(?:cap:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:cap:)?${name}>`, "i")); return decodeXml((match?.[1] || "").replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim()); }
function clean(value) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
function decodeXml(value) { return String(value).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'"); }
