const ALERT_ELIGIBLE_CATEGORIES = new Set([
  "road_closure", "flood", "dam_release", "heavy_rain", "chemical_hazard", "gas_leak",
  "explosion", "public_safety", "power_outage", "transport_disruption", "health_emergency",
  "food_safety", "medical_advisory", "environmental_hazard", "animal_hazard", "weather_hazard"
]);

export function promoteCorroboratedMediaAlert(event = {}) {
  if (event.sourceTrust !== "B" || !ALERT_ELIGIBLE_CATEGORIES.has(event.category) || !["warning", "emergency"].includes(event.severity)) return event;
  if (event.reportedAuthority) {
    return {
      ...event,
      eventKind: "alert",
      alertBasis: "trusted_media_attributed_official",
      summary: `${event.summary || event.title} ${event.source || "A trusted media source"} attributes this alert to ${event.reportedAuthority}. The original official feed was not available to the app at collection time.`
    };
  }
  if (!event.corroboratedByIndependentSources || Number(event.independentSourceCount || 0) < 2) return event;
  return {
    ...event,
    eventKind: "alert",
    alertBasis: "media_corroborated",
    summary: `${event.summary || event.title} Multiple independent trusted media sources report this. Official confirmation is not yet available.`
  };
}
