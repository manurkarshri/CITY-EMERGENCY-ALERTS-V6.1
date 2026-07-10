const INCIDENT_LABELS = { 1: "Accident", 2: "Fog", 3: "Dangerous conditions", 4: "Rain", 6: "Traffic jam", 7: "Lane closed", 8: "Road closed", 9: "Roadworks", 10: "Strong wind", 11: "Flooding", 14: "Broken-down vehicle" };

export function analyseJourneyRoutes(routes = [], context = {}) {
  const analysed = routes.map(route => analyseRoute(route, context));
  analysed.sort((a, b) => b.journeySuitability.score - a.journeySuitability.score || a.travelTimeSeconds - b.travelTimeSeconds);
  return analysed.map((route, index) => ({ ...route, rank: index + 1, recommended: index === 0 }));
}

export function analyseRoute(route, context = {}) {
  const nearbyIncidents = (context.trafficIncidents || []).filter(incident => incidentNearRoute(incident, route.points || []));
  const routeClosure = (route.sections || []).some(section => String(section.simpleCategory || "").toUpperCase().includes("CLOSURE"));
  if (routeClosure) return result(route, 0, ["TomTom routing reports a current closure on this route."], nearbyIncidents, [penalty("road_closure", 100)]);

  let score = 100;
  const reasons = [];
  const penalties = [];
  const delayMinutes = Math.round((route.trafficDelaySeconds || 0) / 60);
  if (delayMinutes >= 30) addPenalty("heavy_traffic", 25, `Live traffic adds about ${delayMinutes} minutes.`, penalties, reasons);
  else if (delayMinutes >= 15) addPenalty("traffic", 15, `Live traffic adds about ${delayMinutes} minutes.`, penalties, reasons);
  else if (delayMinutes >= 5) addPenalty("traffic", 8, `Live traffic adds about ${delayMinutes} minutes.`, penalties, reasons);

  const incidentCategories = new Map();
  for (const incident of nearbyIncidents) {
    const category = Number(incident.properties?.iconCategory);
    if (!incidentCategories.has(category)) incidentCategories.set(category, incident);
  }
  for (const [category] of [...incidentCategories].slice(0, 5)) {
    const value = ({ 1: 20, 3: 15, 7: 15, 9: 8, 11: 25, 14: 10 })[category] || 5;
    const adjustedValue = category === 8 ? 35 : value;
    const wording = category === 8 ? "A road closure is reported very near this route; verify the affected road before travel." : `${INCIDENT_LABELS[category] || "Traffic incident"} reported along this route.`;
    addPenalty(`traffic_incident_${category}`, adjustedValue, wording, penalties, reasons);
  }

  const weather = weatherExposure(route.points || [], context.routeWeatherById?.[route.id] || context.environmental?.weatherIntelligence?.regions || {});
  if (weather.rainRisk === "High") addPenalty("heavy_rain", 20, "Heavy rainfall may affect this route.", penalties, reasons);
  else if (weather.rainRisk === "Medium") addPenalty("rain", 10, "Moderate rainfall may slow this route.", penalties, reasons);
  if (weather.visibilityRisk === "High") addPenalty("low_visibility", 15, "Low visibility may make driving unsafe.", penalties, reasons);
  if (weather.windRisk === "High") addPenalty("strong_wind", 10, "Strong winds may affect road safety.", penalties, reasons);

  for (const event of [...(context.alerts || []), ...(context.incidents || [])]) {
    if (!eventNearRoute(event, route.points || [])) continue;
    const value = event.category === "road_closure" ? 100 : ["flood", "waterlogging"].includes(event.category) ? 25 : event.category === "accident" ? 20 : event.severity === "warning" ? 15 : 8;
    if (value === 100) return result(route, 0, [`${event.title} blocks or closes this route.`], nearbyIncidents, [penalty(event.category, 100)]);
    addPenalty(event.category || "active_event", value, `${event.title} may affect this route.`, penalties, reasons);
  }

  score = Math.max(0, score - penalties.reduce((sum, item) => sum + item.value, 0));
  if (!reasons.length) reasons.push("No significant route-specific disruption was found in the connected data.");
  return result(route, score, reasons, nearbyIncidents, penalties, weather);
}

function result(route, score, reasons, trafficIncidents, penalties, weather = {}) {
  return { ...route, routeTrafficIncidents: trafficIncidents, routeWeather: weather, journeySuitability: { score, label: label(score), recommendation: recommendation(score), reasons: [...new Set(reasons)].slice(0, 6), penalties } };
}
function addPenalty(type, value, reason, penalties, reasons) { penalties.push(penalty(type, value)); reasons.push(reason); }
function penalty(type, value) { return { type, value }; }
function label(score) { return score >= 90 ? "Excellent" : score >= 75 ? "Good to Go" : score >= 60 ? "Proceed with Caution" : score >= 40 ? "Consider Delaying" : "Avoid if Possible"; }
function recommendation(score) { return score >= 90 ? "Travel conditions look suitable." : score >= 75 ? "Travel is generally suitable; allow a small buffer." : score >= 60 ? "Proceed with caution and allow extra time." : score >= 40 ? "Consider another route or delay travel." : "Avoid this route if possible unless travel is essential."; }

function weatherExposure(points, regions) {
  const ranked = Object.values(regions).filter(region => Number.isFinite(Number(region.latitude)) && Number.isFinite(Number(region.longitude))).map(region => ({ region, distance: minDistance(points, [{ latitude: region.latitude, longitude: region.longitude }]) })).filter(item => item.distance <= 35).sort((a, b) => riskRank(b.region) - riskRank(a.region) || a.distance - b.distance);
  return ranked[0]?.region || {};
}
function riskRank(region) { return rank(region.rainRisk) + rank(region.visibilityRisk) + rank(region.windRisk); }
function rank(value) { return ({ High: 4, Medium: 3, Low: 2, Minimal: 1 })[value] || 0; }

function eventNearRoute(event, points) {
  const position = event.position || event.coordinates || event.geometry?.coordinates;
  if (!position) return false;
  const target = Array.isArray(position) ? { latitude: position[1], longitude: position[0] } : { latitude: position.lat ?? position.latitude, longitude: position.lon ?? position.longitude };
  return minDistance(points, [target]) <= Number(event.influenceRadiusKm || 2);
}
function incidentNearRoute(incident, points) {
  const coordinates = incident.geometry?.coordinates;
  if (!coordinates) return false;
  const flat = incident.geometry.type === "Point" ? [coordinates] : coordinates;
  const category = Number(incident.properties?.iconCategory);
  const thresholdKm = category === 8 ? 0.2 : category === 7 ? 0.3 : 0.75;
  return minDistance(points, flat.map(item => ({ longitude: item[0], latitude: item[1] }))) <= thresholdKm;
}
function minDistance(routePoints, targets) {
  if (!routePoints.length || !targets.length) return Infinity;
  const sampled = routePoints.filter((_, index) => index % Math.max(1, Math.floor(routePoints.length / 120)) === 0);
  let minimum = Infinity;
  for (const point of sampled) for (const target of targets) minimum = Math.min(minimum, haversine(point, target));
  return minimum;
}
function haversine(a, b) {
  const lat1 = Number(a.latitude ?? a.lat), lon1 = Number(a.longitude ?? a.lon), lat2 = Number(b.latitude ?? b.lat), lon2 = Number(b.longitude ?? b.lon);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
  const rad = value => value * Math.PI / 180, dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
