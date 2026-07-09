export function buildEnvironmentalImpact({ weatherIntelligence = {}, riverIntelligence = [], activeEvents = [], seasonalIntelligence = {} }) {
  const impacts = [];
  const highWeather = Object.values(weatherIntelligence.regions || {}).filter(r => ["High", "Medium"].includes(r.rainRisk));
  if (highWeather.length) impacts.push(`${highWeather.length} area(s) have elevated rain-related travel impact.`);
  const riverWarnings = riverIntelligence.filter(r => ["warning", "emergency"].includes(r.severity));
  if (riverWarnings.length) impacts.push(`${riverWarnings.length} river or dam related warning(s) may affect downstream areas.`);
  const roadEvents = activeEvents.filter(e => ["accident", "road_closure", "waterlogging"].includes(e.category));
  if (roadEvents.length) impacts.push(`${roadEvents.length} active transport-related event(s) may affect travel.`);
  return { generatedAt: new Date().toISOString(), riskLevel: riverWarnings.length || highWeather.length ? "Elevated" : "Normal", impacts, citizenSummary: impacts.length ? impacts.join(" ") : "No major environmental disruption indicated from current data.", seasonalContext: seasonalIntelligence.activeSeason || "normal" };
}
