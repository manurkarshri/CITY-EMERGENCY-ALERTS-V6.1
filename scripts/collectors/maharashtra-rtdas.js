const SOURCE_NAME = "Maharashtra WRD RTDAS";
const SOURCE_URL = "https://wrd.maharashtra.gov.in/";

export async function fetchRtdasPage(url, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`RTDAS request failed with HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function parseRtdasRiverPage(html, stationConfig = {}, checkedAt = new Date().toISOString(), previousItems = []) {
  const previous = new Map(previousItems.filter(item => item.kind === "river_gauge").map(item => [item.station, item]));
  return extractRecords(html).flatMap(record => {
    const config = stationConfig[record.name];
    if (!config) return [];
    const level = fieldNumber(record.title, "River Level");
    const alertLevel = fieldNumber(record.title, "Alert Level");
    const dangerLevel = fieldNumber(record.title, "Danger Level");
    const observedAt = fieldTimestamp(record.title);
    const freshness = itemFreshness(observedAt, checkedAt);
    const status = riverStatus(level, alertLevel, dangerLevel);
    return [{
      id: `rtdas-river-${slug(record.name)}`,
      kind: "river_gauge",
      station: record.name,
      river: config.river,
      position: config.position || null,
      talukas: config.talukas || [],
      localities: config.localities || [],
      level,
      alertLevel,
      dangerLevel,
      dischargeCumecs: fieldNumber(record.title, "Discharge"),
      status,
      trend: trend(level, previous.get(record.name)?.level),
      freshness,
      lastUpdated: observedAt,
      sourceCheckedAt: checkedAt,
      source: SOURCE_NAME,
      sourceTrust: "A",
      sourceUrl: SOURCE_URL
    }];
  });
}

export function parseRtdasReservoirPage(html, reservoirMap = {}, checkedAt = new Date().toISOString()) {
  return extractRecords(html).flatMap(record => {
    const dam = reservoirMap[record.name];
    if (!dam) return [];
    const observedAt = fieldTimestamp(record.title);
    return [{
      id: `rtdas-reservoir-${dam}`,
      kind: "reservoir",
      dam,
      station: record.name,
      reservoirLevel: fieldNumber(record.title, "Reservoir Level"),
      storagePercent: fieldNumber(record.title, "% Contents"),
      liveContentsMcum: fieldNumber(record.title, "Live Contents"),
      dischargeCumecs: fieldNumber(record.title, "Discharge"),
      status: "normal",
      trend: "unknown",
      freshness: itemFreshness(observedAt, checkedAt),
      lastUpdated: observedAt,
      sourceCheckedAt: checkedAt,
      source: SOURCE_NAME,
      sourceTrust: "A",
      sourceUrl: SOURCE_URL
    }];
  });
}

function extractRecords(html = "") {
  return [...html.matchAll(/<input\b[^>]*\btitle="([^"]*)"[^>]*\btooltiptitle="([^"]+)"[^>]*>/gi)]
    .map(match => ({ title: decode(match[1]), name: decode(match[2]).trim() }));
}

function fieldNumber(text, label) {
  const match = text.match(new RegExp(`${escapeRegExp(label)}\\s*:\\s*([0-9.]+|NA|NR)`, "i"));
  if (!match || /^(?:NA|NR)$/i.test(match[1])) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function fieldTimestamp(text) {
  const date = text.match(/Last Updated Date\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  const time = text.match(/Last Updated Time\s*:\s*(\d{2}):(\d{2})(?::(\d{2}))?/i);
  if (!date || !time) return null;
  return `${date[3]}-${date[2]}-${date[1]}T${time[1]}:${time[2]}:${time[3] || "00"}+05:30`;
}

function itemFreshness(observedAt, checkedAt, staleAfterMinutes = 180) {
  if (!observedAt) return "unavailable";
  const age = new Date(checkedAt) - new Date(observedAt);
  return age >= 0 && age <= staleAfterMinutes * 60000 ? "current" : "stale";
}

function riverStatus(level, alertLevel, dangerLevel) {
  if (![level, alertLevel, dangerLevel].every(Number.isFinite)) return "unavailable";
  if (level >= dangerLevel) return "critical";
  if (level >= alertLevel) return "high";
  const range = dangerLevel - alertLevel;
  if (range > 0 && level >= alertLevel - Math.max(0.5, range)) return "elevated";
  return "normal";
}

function trend(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return "unknown";
  if (current > previous + 0.05) return "increasing";
  if (current < previous - 0.05) return "decreasing";
  return "steady";
}

function decode(value) {
  return value.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, "&").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
