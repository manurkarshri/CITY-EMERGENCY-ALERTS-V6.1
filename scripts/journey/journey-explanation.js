export function buildJourneyExplanation(route) {
  const score = route.journeySuitability?.score ?? 0;
  const label = route.journeySuitability?.label || "Unknown";
  const reasons = route.journeySuitability?.reasons || [];

  const firstLine = route.recommended
    ? `Best route: ${route.label}. Journey suitability is ${label} (${score}/100).`
    : `${route.label}: Journey suitability is ${label} (${score}/100).`;

  const reasonText = reasons.length
    ? ` Main reason: ${reasons[0]}`
    : " No major route-specific disruption detected.";

  const timeText = route.estimatedTimeMin
    ? ` Estimated travel time is about ${route.estimatedTimeMin} minutes${route.estimatedDelayMin ? ` including around ${route.estimatedDelayMin} minutes delay` : ""}.`
    : " Detailed time estimate is not available for this route.";

  return `${firstLine}${timeText}${reasonText}`;
}
