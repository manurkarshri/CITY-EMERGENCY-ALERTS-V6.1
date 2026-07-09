export function validateEnvironmentalContext(data = {}) {
  const errors = [];
  if (!data.schemaVersion) errors.push("Missing schemaVersion");
  if (!data.generatedAt) errors.push("Missing generatedAt");
  if (!data.weatherIntelligence) errors.push("Missing weatherIntelligence");
  if (!Array.isArray(data.riverIntelligence)) errors.push("riverIntelligence must be an array");
  if (!data.environmentalImpact) errors.push("Missing environmentalImpact");
  if (!data.story) errors.push("Missing emergency story");
  return errors;
}
