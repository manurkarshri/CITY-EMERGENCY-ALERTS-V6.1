const PUBLIC_SAFETY = new Set(["accident", "fire", "explosion", "flood", "waterlogging", "landslide", "building_collapse", "structural_collapse", "industrial_accident", "hazardous_material", "chemical_hazard", "electrical_hazard", "rescue", "rescue_operation", "water_rescue", "evacuation", "public_safety", "infrastructure_failure", "health_emergency"]);
const TRAVEL = new Set(["transport_disruption", "lane_closure", "severe_congestion", "vehicle_breakdown", "dangerous_road_condition", "roadworks"]);

export function groupIncidentsForCitizens(items = []) {
  const groups = { publicSafety: [], travel: [], other: [], roadClosures: [] };
  for (const item of items) {
    if (isTomTomRoadClosure(item)) groups.roadClosures.push(item);
    else if (PUBLIC_SAFETY.has(item.category)) groups.publicSafety.push(item);
    else if (TRAVEL.has(item.category)) groups.travel.push(item);
    else groups.other.push(item);
  }
  return groups;
}

export function displayableIncidentItems(items = []) {
  return items.filter(item => !isTomTomRoadClosure(item));
}

export function isTomTomRoadClosure(item = {}) {
  const tomtom = item.sourceId === "tomtom_traffic" || String(item.id || "").startsWith("tomtom-traffic-") || /TomTom Traffic/i.test(item.source || "");
  return tomtom && item.category === "road_closure";
}
