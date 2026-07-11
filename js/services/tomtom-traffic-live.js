const ENDPOINT = "https://api.tomtom.com/traffic/services/5/incidentDetails";
const BBOXES = ["73.30,17.85,73.925,18.65", "73.925,17.85,74.55,18.65", "73.30,18.65,73.925,19.45", "73.925,18.65,74.55,19.45"];
const FIELDS = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,lastReportTime}}}";

export async function fetchLivePuneTrafficIncidents() {
  const key = window.__CEA_CONFIG__?.tomtomApiKey;
  if (!key) throw new Error("TomTom traffic is not configured");
  const payloads = await Promise.all(BBOXES.map(async bbox => {
    const params = new URLSearchParams({ key, bbox, fields: FIELDS, language: "en-GB", timeValidityFilter: "present" });
    const response = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`TomTom Traffic request failed (${response.status})`);
    return response.json();
  }));
  const checkedAt = new Date().toISOString();
  const incidents = payloads.flatMap(payload => payload.incidents || []);
  const unique = incidents.filter((item, index, all) => all.findIndex(other => other.properties?.id === item.properties?.id) === index);
  return { checkedAt, items: unique.map(item => normalize(item, checkedAt)).filter(Boolean) };
}

function normalize(item, checkedAt) {
  const p = item.properties || {};
  const icon = Number(p.iconCategory);
  const delay = Number(p.delay || 0);
  if (![1, 3, 7, 8, 9, 11, 14].includes(icon) && !(icon === 6 && delay >= 900)) return null;
  const type = classify(icon, delay);
  const description = (p.events || []).map(event => event.description).filter(Boolean).join("; ") || label(icon);
  const location = [p.from, p.to].filter(Boolean).join(" to ");
  const publishedAt = validIso(p.lastReportTime || p.startTime) || checkedAt;
  const end = validIso(p.endTime);
  return { id: `tomtom-traffic-${p.id || `${icon}-${publishedAt}`}`, title: `Traffic: ${description}${location ? ` - ${location}` : ""}`,
    summary: `${description}${delay >= 60 ? ` Estimated delay ${Math.round(delay / 60)} minutes.` : ""}`, category: type.category, severity: type.severity,
    source: "TomTom Traffic Incidents", sourceTrust: "C", sources: [{ name: "TomTom Traffic", trust: "C", link: "https://www.tomtom.com/traffic-index/" }],
    link: "https://www.tomtom.com/traffic-index/", talukas: [], localities: [], operationalZones: [], publishedAt, lastUpdated: publishedAt,
    sourceCheckedAt: checkedAt, lastVerifiedAt: checkedAt, intelligenceGeneratedAt: checkedAt,
    expiresAt: end && new Date(end) > new Date() ? end : new Date(Date.now() + 3 * 36e5).toISOString(), lifecycle: "active",
    confidence: "Supporting", confidenceScore: 35, impact: impact(type.category), recommendedAction: action(type.category), relatedEventIds: [] };
}
function classify(icon, delay) { if (icon === 8) return { category: "road_closure", severity: "warning" }; if (icon === 1) return { category: "accident", severity: delay >= 1800 ? "warning" : "watch" }; if (icon === 7) return { category: "lane_closure", severity: "watch" }; if (icon === 9) return { category: "roadworks", severity: "advisory" }; if (icon === 11) return { category: "flood", severity: "watch" }; if (icon === 14) return { category: "vehicle_breakdown", severity: "advisory" }; if (icon === 6) return { category: "severe_congestion", severity: delay >= 1800 ? "watch" : "advisory" }; return { category: "dangerous_road_condition", severity: "watch" }; }
function label(icon) { return ({ 1: "Road accident", 3: "Dangerous road conditions", 6: "Severe congestion", 7: "Lane closed", 8: "Road closed", 9: "Roadworks", 11: "Flooding", 14: "Broken-down vehicle" })[icon] || "Traffic disruption"; }
function impact(category) { return category === "road_closure" ? "The road may be blocked or diverted." : category === "accident" ? "Traffic delays are likely near the incident." : "This condition may delay or disrupt road travel."; }
function action(category) { return category === "road_closure" ? "Use an alternative route and confirm conditions before departure." : "Approach cautiously and consider an alternative route."; }
function validIso(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
