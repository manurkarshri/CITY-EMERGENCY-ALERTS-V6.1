export function validateJourneyIntelligence(data = {}) {
  const errors = [];
  if (!data.schemaVersion) errors.push("Missing schemaVersion");
  if (!data.generatedAt) errors.push("Missing generatedAt");
  if (!Array.isArray(data.journeys)) errors.push("journeys must be an array");
  for (const journey of data.journeys || []) {
    if (!journey.id) errors.push("Journey missing id");
    if (!journey.bestRoute) errors.push(`Journey ${journey.id} missing bestRoute`);
    for (const route of journey.routes || []) {
      const score = route.journeySuitability?.score;
      if (score === undefined || score < 0 || score > 100) errors.push(`Invalid journey score for ${route.id}`);
    }
  }
  return errors;
}
