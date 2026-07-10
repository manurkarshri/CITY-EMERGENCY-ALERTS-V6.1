export function validateEnvironmentalContext(data = {}) {
  const errors = [];
  if (!data.schemaVersion) errors.push("Missing schemaVersion");
  if (!data.generatedAt) errors.push("Missing generatedAt");
  if (!data.weatherIntelligence) errors.push("Missing weatherIntelligence");
  if (!data.weatherSource) errors.push("Missing weatherSource");
  if (data.weatherSource && !["current", "stale", "unavailable"].includes(data.weatherSource.status)) errors.push("Invalid weather source status");
  if (!Array.isArray(data.riverIntelligence)) errors.push("riverIntelligence must be an array");
  if (!data.environmentalImpact) errors.push("Missing environmentalImpact");
  if (!data.story) errors.push("Missing emergency story");
  return errors;
}
