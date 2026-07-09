import { calculateJourneyScore } from "./journey-score.js";

export function compareRoutes(routes = [], context = {}) {
  const scored = routes.map(route => {
    const score = calculateJourneyScore(route, context);
    const delayMin = estimateDelay(route, score.score);
    return {
      ...route,
      journeySuitability: score,
      estimatedTimeMin: route.baseTimeMin ? route.baseTimeMin + delayMin : null,
      estimatedDelayMin: delayMin,
      googleMapsUrl: buildGoogleMapsUrl(route.mapsQuery || `${route.via?.[0] || ""} to ${route.via?.slice(-1)[0] || ""}`)
    };
  });

  scored.sort((a, b) => b.journeySuitability.score - a.journeySuitability.score || (a.estimatedTimeMin || 9999) - (b.estimatedTimeMin || 9999));

  return scored.map((route, index) => ({ ...route, rank: index + 1, recommended: index === 0 }));
}

function estimateDelay(route, score) {
  if (!route.baseTimeMin) return null;
  if (score >= 90) return 0;
  if (score >= 75) return 8;
  if (score >= 60) return 15;
  if (score >= 40) return 25;
  return 45;
}

function buildGoogleMapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
