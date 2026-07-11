const API = "https://api.tomtom.com";
const PUNE = { lat: 18.5204, lon: 73.8567, radius: 150000 };

export function tomTomConfigured() {
  return Boolean(apiKey());
}

export async function searchPlaces(query, options = {}) {
  const text = String(query || "").trim();
  if (text.length < 2) return [];
  const payload = await request(buildSearchUrl(text, { ...options, key: requireKey() }));
  return normalizeSearchResults(payload);
}

export function buildSearchUrl(text, options = {}) {
  const params = new URLSearchParams({
    key: options.key || "", typeahead: "true", limit: String(options.limit || 6), countrySet: "IN",
    geobias: `point:${PUNE.lat},${PUNE.lon}`, language: "en-GB"
  });
  return `${API}/search/2/search/${encodeURIComponent(text)}.json?${params}`;
}

export async function reverseGeocode(latitude, longitude) {
  assertCoordinate(latitude, longitude);
  const params = new URLSearchParams({ key: requireKey(), language: "en-GB", radius: "100" });
  const payload = await request(`${API}/search/2/reverseGeocode/${latitude},${longitude}.json?${params}`);
  const item = payload.addresses?.[0];
  return {
    id: `current-${latitude}-${longitude}`,
    label: item?.address?.freeformAddress || "Current location",
    address: item?.address?.freeformAddress || "Current location",
    milestone: shortAddress(item?.address),
    position: { lat: Number(latitude), lon: Number(longitude) }
  };
}

export async function labelRoutesByMilestones(routes = []) {
  const labelled = await Promise.all(routes.map(async (route, index) => {
    const points = route.points || [];
    if (points.length < 3) return { ...route, label: index === 0 ? "Fastest route" : `Alternative route ${index}` };
    const candidates = [points[Math.floor(points.length * 0.38)], points[Math.floor(points.length * 0.68)]];
    const places = await Promise.all(candidates.map(point => reverseGeocode(point.latitude, point.longitude).catch(() => null)));
    const milestones = [...new Set(places.map(place => place?.milestone).filter(Boolean))].slice(0, 2);
    return { ...route, label: milestones.length ? `Via ${milestones.join(" – ")}` : index === 0 ? "Fastest route" : `Alternative route ${index}` };
  }));
  const counts = labelled.reduce((out, route) => out.set(route.label, (out.get(route.label) || 0) + 1), new Map());
  return labelled.map(route => counts.get(route.label) > 1
    ? { ...route, label: `${route.label} · ${(route.distanceMeters / 1000).toFixed(1)} km / ${Math.round(route.travelTimeSeconds / 60)} min` }
    : route);
}

export async function calculateRoutes(start, destination, options = {}) {
  assertCoordinate(start?.lat, start?.lon);
  assertCoordinate(destination?.lat, destination?.lon);
  const params = new URLSearchParams({
    key: requireKey(), traffic: "true", travelMode: "car", routeType: "fastest",
    maxAlternatives: String(options.maxAlternatives ?? 2), alternativeType: "anyRoute",
    routeRepresentation: "polyline", computeTravelTimeFor: "all", language: "en-GB",
    sectionType: "traffic"
  });
  if (options.departAt && options.departAt !== "now") params.set("departAt", options.departAt);
  else params.set("departAt", "now");
  const locations = `${start.lat},${start.lon}:${destination.lat},${destination.lon}`;
  const payload = await request(`${API}/routing/1/calculateRoute/${locations}/json?${params}`);
  return normalizeRoutes(payload, start, destination);
}

export async function trafficIncidentsForRoutes(routes) {
  const points = routes.flatMap(route => route.points || []);
  if (!points.length) return [];
  const bbox = boundingBox(points, 0.02);
  const fields = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,lastReportTime}}}";
  const params = new URLSearchParams({
    key: requireKey(), bbox: bbox.join(","), fields, language: "en-GB", timeValidityFilter: "present"
  });
  const payload = await request(`${API}/traffic/services/5/incidentDetails?${params}`);
  return payload.incidents || [];
}

export function normalizeSearchResults(payload = {}) {
  return (payload.results || []).filter(item => item.position).map(item => ({
    id: item.id || `${item.position.lat}-${item.position.lon}`,
    label: item.poi?.name || item.address?.freeformAddress || item.address?.municipality || "Unnamed place",
    address: item.address?.freeformAddress || [item.address?.municipalitySubdivision, item.address?.municipality].filter(Boolean).join(", "),
    position: { lat: Number(item.position.lat), lon: Number(item.position.lon) },
    type: item.type || "place"
  }));
}

export function normalizeRoutes(payload = {}, start, destination) {
  return (payload.routes || []).map((route, index) => {
    const points = route.legs?.flatMap((leg, legIndex) => (leg.points || []).filter((_, pointIndex) => legIndex === 0 || pointIndex > 0)) || [];
    const summary = route.summary || {};
    return {
      id: `tomtom-route-${index + 1}`,
      label: index === 0 ? "Fastest route" : `Alternative ${index}`,
      start, destination, points, sections: route.sections || [],
      distanceMeters: Number(summary.lengthInMeters || 0),
      travelTimeSeconds: Number(summary.travelTimeInSeconds || 0),
      trafficDelaySeconds: Number(summary.trafficDelayInSeconds || 0),
      noTrafficTravelTimeSeconds: Number(summary.noTrafficTravelTimeInSeconds || 0),
      historicTrafficTravelTimeSeconds: Number(summary.historicTrafficTravelTimeInSeconds || 0),
      liveTrafficTravelTimeSeconds: Number(summary.liveTrafficIncidentsTravelTimeInSeconds || summary.travelTimeInSeconds || 0),
      departureTime: summary.departureTime || null,
      arrivalTime: summary.arrivalTime || null
    };
  });
}

async function request(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`TomTom request failed (${response.status})`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("TomTom request timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function boundingBox(points, padding) {
  const lats = points.map(point => Number(point.latitude ?? point.lat));
  const lons = points.map(point => Number(point.longitude ?? point.lon));
  return [Math.min(...lons) - padding, Math.min(...lats) - padding, Math.max(...lons) + padding, Math.max(...lats) + padding].map(value => value.toFixed(6));
}

function apiKey() { return window.__CEA_CONFIG__?.tomtomApiKey || ""; }
function requireKey() { const key = apiKey(); if (!key) throw new Error("Journey routing is not configured yet."); return key; }
function assertCoordinate(lat, lon) { if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) throw new Error("A valid location must be selected."); }
function shortAddress(address = {}) { return address.municipalitySubdivision || address.localName || address.streetName || address.municipality || address.freeformAddress || "Route area"; }
