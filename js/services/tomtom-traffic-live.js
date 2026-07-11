const ENDPOINT = "https://api.tomtom.com/traffic/services/5/incidentDetails";
const BBOX = "73.30,17.85,74.55,19.45";
const FIELDS = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,lastReportTime}}}";

export async function fetchLivePuneTrafficIncidents() {
  const key = window.__CEA_CONFIG__?.tomtomApiKey;
  if (!key) throw new Error("TomTom traffic is not configured");
  const params = new URLSearchParams({ key, bbox: BBOX, fields: FIELDS, language: "en-GB", timeValidityFilter: "present" });
  const response = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`TomTom Traffic request failed (${response.status})`);
  const payload = await response.json();
  const checkedAt = new Date().toISOString();
  return { checkedAt, items: (payload.incidents || []).map(item => normalize(item, checkedAt)).filter(Boolean) };
}

function normalize(item, checkedAt) {
  const p = item.properties || {};
  const icon = Number(p.iconCategory);
  const delay = Number(p.delay || 0);
  if (![2, 4, 8, 9, 10, 14].includes(icon) && !(icon === 7 && delay >= 900)) return null;
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
function classify(icon, delay) { if (icon === 9) return { category: "road_closure", severity: "warning" }; if (icon === 2) return { category: "accident", severity: delay >= 1800 ? "warning" : "watch" }; if (icon === 8) return { category: "lane_closure", severity: "watch" }; if (icon === 10) return { category: "roadworks", severity: "advisory" }; if (icon === 14) return { category: "vehicle_breakdown", severity: "advisory" }; if (icon === 7) return { category: "severe_congestion", severity: delay >= 1800 ? "watch" : "advisory" }; return { category: "dangerous_road_condition", severity: "watch" }; }
function label(icon) { return ({ 2: "Road accident", 4: "Dangerous road conditions", 7: "Severe congestion", 8: "Lane closed", 9: "Road closed", 10: "Roadworks", 14: "Broken-down vehicle" })[icon] || "Traffic disruption"; }
function impact(category) { return category === "road_closure" ? "The road may be blocked or diverted." : category === "accident" ? "Traffic delays are likely near the incident." : "This condition may delay or disrupt road travel."; }
function action(category) { return category === "road_closure" ? "Use an alternative route and confirm conditions before departure." : "Approach cautiously and consider an alternative route."; }
function validIso(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toISOString() : null; }
