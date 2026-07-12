const ALERT_ELIGIBLE_CATEGORIES = new Set([
  "road_closure", "flood", "dam_release", "heavy_rain", "chemical_hazard", "gas_leak",
  "explosion", "public_safety", "power_outage", "transport_disruption"
]);

export function promoteCorroboratedMediaAlert(event = {}) {
  if (event.sourceTrust !== "B" || !event.corroboratedByIndependentSources || Number(event.independentSourceCount || 0) < 2) return event;
  if (!ALERT_ELIGIBLE_CATEGORIES.has(event.category) || !["warning", "emergency"].includes(event.severity)) return event;
  return {
    ...event,
    eventKind: "alert",
    alertBasis: "media_corroborated",
    summary: `${event.summary || event.title} Multiple independent trusted media sources report this. Official confirmation is not yet available.`
  };
}
