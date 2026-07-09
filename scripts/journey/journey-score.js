export function calculateJourneyScore(route = {}, context = {}) {
  let score = 100;
  const reasons = [];
  const penalties = [];

  const allEvents = [
    ...(context.alerts || []),
    ...(context.incidents || []),
    ...((context.environmentalContext?.riverIntelligence || []).map(toRiverEvent))
  ];

  for (const event of allEvents) {
    const relevance = routeRelevance(route, event);
    if (!relevance) continue;

    const penalty = penaltyForEvent(event);
    if (penalty > 0) {
      score -= penalty;
      penalties.push({ eventId: event.id, category: event.category || "river", penalty, title: event.title || event.damLabel || event.category });
      reasons.push(reasonForEvent(event, penalty));
    }
  }

  const weather = context.situation?.weather?.regions || {};
  for (const region of Object.values(weather)) {
    if (region.rainRisk === "High") { score -= 20; reasons.push("Heavy rainfall may reduce travel suitability."); }
    else if (region.rainRisk === "Medium") { score -= 10; reasons.push("Moderate rainfall may slow travel."); }
    if (region.visibilityRisk === "High") { score -= 15; reasons.push("Low visibility may make driving unsafe."); }
    if (region.windRisk === "High") { score -= 10; reasons.push("Strong winds may affect road safety."); }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    label: labelForScore(score),
    recommendation: recommendationForScore(score),
    reasons: unique(reasons).slice(0, 5),
    penalties
  };
}

function routeRelevance(route, event) {
  const routeText = [...(route.via || []), ...(route.operationalZones || []), route.label || ""].join(" ").toLowerCase();
  const eventText = [...(event.localities || []), ...(event.talukas || []), ...(event.operationalZones || []), ...(event.downstreamLocalities || []), event.river || "", event.damLabel || "", event.title || ""].join(" ").toLowerCase();
  return routeText.split(/\s+/).some(token => token.length > 4 && eventText.includes(token)) || eventText.split(/\s+/).some(token => token.length > 4 && routeText.includes(token));
}

function penaltyForEvent(event) {
  if (event.category === "road_closure") return 35;
  if (event.category === "dam_release" || event.rsi >= 60) return 25;
  if (event.category === "flood" || event.category === "waterlogging") return 25;
  if (event.category === "accident") return 20;
  if (event.category === "heavy_rain") return 15;
  if (event.severity === "emergency") return 35;
  if (event.severity === "warning") return 20;
  if (event.severity === "watch") return 10;
  return 5;
}

function reasonForEvent(event, penalty) {
  const title = event.title || event.damLabel || event.category || "Active event";
  if (penalty >= 30) return `${title} may significantly affect this route.`;
  if (penalty >= 20) return `${title} may cause delays or safety concerns.`;
  return `${title} may have minor impact on travel.`;
}

function labelForScore(score) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good to Go";
  if (score >= 60) return "Proceed with Caution";
  if (score >= 40) return "Consider Delaying";
  return "Avoid if Possible";
}

function recommendationForScore(score) {
  if (score >= 90) return "Travel conditions look suitable.";
  if (score >= 75) return "Travel is generally suitable. Allow minor buffer time.";
  if (score >= 60) return "Proceed with caution and allow extra travel time.";
  if (score >= 40) return "Consider delaying or checking alternate routes.";
  return "Avoid this route if possible unless travel is essential.";
}

function toRiverEvent(r) {
  return { ...r, category: "dam_release", title: r.damLabel, severity: r.severity, localities: r.downstreamLocalities || [] };
}

function unique(items) {
  return [...new Set(items)];
}
