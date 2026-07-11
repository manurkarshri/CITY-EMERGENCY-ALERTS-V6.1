const ENDPOINT = "https://api.tomtom.com/traffic/services/5/incidentDetails";
const PUNE_DISTRICT_BBOXES = ["73.30,17.85,73.925,18.65", "73.925,17.85,74.55,18.65", "73.30,18.65,73.925,19.45", "73.925,18.65,74.55,19.45"];
const FIELDS = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,lastReportTime}}}";

export async function fetchTomTomTrafficIncidents(options = {}) {
  const key = options.apiKey || process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY is not configured for scheduled traffic collection");
  const checkedAt = options.checkedAt || new Date().toISOString();
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const payloads = await Promise.all(PUNE_DISTRICT_BBOXES.map(async bbox => {
    const params = new URLSearchParams({ key, bbox, fields: FIELDS, language: "en-GB", timeValidityFilter: "present" });
    const response = await fetchImpl(`${ENDPOINT}?${params}`);
    if (!response.ok) throw new Error(`TomTom Traffic request failed with HTTP ${response.status}`);
    return response.json();
  }));
  const incidents = payloads.flatMap(payload => payload.incidents || []).filter((item, index, all) => all.findIndex(other => other.properties?.id === item.properties?.id) === index);
  return normalizeTomTomTraffic({ incidents }, checkedAt);
}

export function normalizeTomTomTraffic(payload, checkedAt) {
  return (payload?.incidents || []).map(item => normalizeIncident(item, checkedAt)).filter(Boolean).sort((a, b) => trafficPriority(b) - trafficPriority(a)).slice(0, 40);
}

function normalizeIncident(item, checkedAt) {
  const properties = item?.properties || {};
  const icon = Number(properties.iconCategory);
  const delay = Number(properties.delay || 0);
  if (!citizenSignificant(icon, delay, Number(properties.magnitudeOfDelay || 0))) return null;
  const classification = classify(icon, delay);
  const description = clean((properties.events || []).map(event => event.description).filter(Boolean).join("; ")) || label(icon);
  const location = [properties.from, properties.to].filter(Boolean).join(" to ");
  const publishedAt = isoDate(properties.lastReportTime || properties.startTime) || checkedAt;
  const end = isoDate(properties.endTime);
  const expiresAt = end && new Date(end) > new Date(checkedAt) ? end : new Date(new Date(checkedAt).getTime() + 3 * 36e5).toISOString();
  return { eventKind: "incident", sourceId: "tomtom_traffic", upstreamId: properties.id || "", title: `Traffic: ${description}${location ? ` - ${location}` : ""}`,
    summary: `${description}${delay >= 60 ? ` Estimated delay ${Math.round(delay / 60)} minutes.` : ""}`, category: classification.category,
    severity: classification.severity, source: "TomTom Traffic Incidents", sourceTrust: "C", link: "https://www.tomtom.com/traffic-index/",
    publishedAt, lastUpdated: publishedAt, sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt, expiresAt, affectedArea: location, trafficFrom: properties.from || "", trafficTo: properties.to || "",
    coordinates: item.geometry?.coordinates || [], roadNumbers: properties.roadNumbers || [], delaySeconds: delay, magnitudeOfDelay: Number(properties.magnitudeOfDelay || 0) };
}

function citizenSignificant(icon, delay, magnitude) { return icon === 8 || icon === 11 || (icon === 1 && (delay >= 300 || magnitude >= 2)) || (icon === 3 && (delay >= 600 || magnitude >= 3)) || (icon === 7 && delay >= 600) || (icon === 9 && delay >= 900) || (icon === 14 && delay >= 900) || (icon === 6 && delay >= 1800); }
function trafficPriority(item) { return ({ warning: 300, watch: 200, advisory: 100 })[item.severity] + Math.min(99, Math.round((item.delaySeconds || 0) / 60)); }

function classify(icon, delay) {
  if (icon === 8) return { category: "road_closure", severity: "warning" };
  if (icon === 1) return { category: "accident", severity: delay >= 1800 ? "warning" : "watch" };
  if (icon === 7) return { category: "lane_closure", severity: "watch" };
  if (icon === 9) return { category: "roadworks", severity: "advisory" };
  if (icon === 11) return { category: "flood", severity: "watch" };
  if (icon === 14) return { category: "vehicle_breakdown", severity: "advisory" };
  if (icon === 6) return { category: "severe_congestion", severity: delay >= 1800 ? "watch" : "advisory" };
  return { category: "dangerous_road_condition", severity: "watch" };
}
function label(icon) { return ({ 1: "Road accident", 3: "Dangerous road conditions", 6: "Severe congestion", 7: "Lane closed", 8: "Road closed", 9: "Roadworks", 11: "Flooding", 14: "Broken-down vehicle" })[icon] || "Traffic disruption"; }
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function isoDate(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
