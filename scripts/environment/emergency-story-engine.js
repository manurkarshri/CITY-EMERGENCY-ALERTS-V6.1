export function buildEmergencyStory({ weatherIntelligence = {}, riverIntelligence = [], environmentalImpact = {}, activeEvents = [] }) {
  const lines = [];
  const highRain = Object.values(weatherIntelligence.regions || {}).filter(r => r.rainRisk === "High");
  const mediumRain = Object.values(weatherIntelligence.regions || {}).filter(r => r.rainRisk === "Medium");
  if (highRain.length) lines.push("Heavy rainfall may affect travel in parts of Pune District.");
  else if (mediumRain.length) lines.push("Moderate rainfall may slow travel in some areas.");
  const riverWarnings = riverIntelligence.filter(r => ["warning", "emergency"].includes(r.severity));
  if (riverWarnings.length) lines.push(`${riverWarnings.map(r => r.damLabel).join(", ")} related river conditions may affect downstream areas. Avoid riverbanks.`);
  const activeWarnings = activeEvents.filter(e => ["emergency", "warning"].includes(e.severity)).length;
  if (activeWarnings) lines.push(`${activeWarnings} important alert${activeWarnings === 1 ? "" : "s"} require attention.`);
  if (!lines.length && environmentalImpact.citizenSummary) lines.push(environmentalImpact.citizenSummary);
  if (!lines.length) lines.push("No major emergency disruption indicated from current intelligence.");
  return lines.join(" ");
}
