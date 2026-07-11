const ENDPOINT = "https://api.tomtom.com/traffic/services/5/incidentDetails";
const PUNE_DISTRICT_BBOX = "73.30,17.85,74.55,19.45";
const FIELDS = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,lastReportTime}}}";

export async function fetchTomTomTrafficIncidents(options = {}) {
  const key = options.apiKey || process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY is not configured for scheduled traffic collection");
  const checkedAt = options.checkedAt || new Date().toISOString();
  const params = new URLSearchParams({ key, bbox: PUNE_DISTRICT_BBOX, fields: FIELDS, language: "en-GB", timeValidityFilter: "present" });
  const response = await (options.fetchImpl || globalThis.fetch)(`${ENDPOINT}?${params}`);
  if (!response.ok) throw new Error(`TomTom Traffic request failed with HTTP ${response.status}`);
  return normalizeTomTomTraffic(await response.json(), checkedAt);
}

export function normalizeTomTomTraffic(payload, checkedAt) {
  return (payload?.incidents || []).map(item => normalizeIncident(item, checkedAt)).filter(Boolean);
}

function normalizeIncident(item, checkedAt) {
  const properties = item?.properties || {};
  const icon = Number(properties.iconCategory);
  const delay = Number(properties.delay || 0);
  if (![2, 4, 8, 9, 10, 14].includes(icon) && !(icon === 7 && delay >= 900)) return null;
  const classification = classify(icon, delay);
  const description = clean((properties.events || []).map(event => event.description).filter(Boolean).join("; ")) || label(icon);
  const location = [properties.from, properties.to].filter(Boolean).join(" to ");
  const publishedAt = isoDate(properties.lastReportTime || properties.startTime) || checkedAt;
  const end = isoDate(properties.endTime);
  const expiresAt = end && new Date(end) > new Date(checkedAt) ? end : new Date(new Date(checkedAt).getTime() + 3 * 36e5).toISOString();
  return { sourceId: "tomtom_traffic", upstreamId: properties.id || "", title: `Traffic: ${description}${location ? ` - ${location}` : ""}`,
    summary: `${description}${delay >= 60 ? ` Estimated delay ${Math.round(delay / 60)} minutes.` : ""}`, category: classification.category,
    severity: classification.severity, source: "TomTom Traffic Incidents", sourceTrust: "C", link: "https://www.tomtom.com/traffic-index/",
    publishedAt, lastUpdated: publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt, expiresAt,
    coordinates: item.geometry?.coordinates || [], roadNumbers: properties.roadNumbers || [] };
}

function classify(icon, delay) {
  if (icon === 9) return { category: "road_closure", severity: "warning" };
  if (icon === 2) return { category: "accident", severity: delay >= 1800 ? "warning" : "watch" };
  if (icon === 8) return { category: "lane_closure", severity: "watch" };
  if (icon === 10) return { category: "roadworks", severity: "advisory" };
  if (icon === 14) return { category: "vehicle_breakdown", severity: "advisory" };
  if (icon === 7) return { category: "severe_congestion", severity: delay >= 1800 ? "watch" : "advisory" };
  return { category: "dangerous_road_condition", severity: "watch" };
}
function label(icon) { return ({ 2: "Road accident", 4: "Dangerous road conditions", 7: "Severe congestion", 8: "Lane closed", 9: "Road closed", 10: "Roadworks", 14: "Broken-down vehicle" })[icon] || "Traffic disruption"; }
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
