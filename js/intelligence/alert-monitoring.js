export function buildAlertMonitoringSummary(appState = {}) {
  const selected = appState.selected || {};
  const region = appState.regions?.[selected.region]?.label;
  const taluka = appState.talukas?.[selected.taluka]?.label;
  const locality = selected.locality;
  const area = [locality, taluka, region].filter((value, index, all) => value && all.indexOf(value) === index).join(", ") || "Pune District";
  const sources = ["imd_nowcast", "ndma_sachet"].map(id => (appState.sourceHealth?.sources || []).find(source => source.id === id)).filter(Boolean)
    .map(source => ({ name: source.name, status: friendlyStatus(source.status), checkedAt: source.sourceCheckedAt }));
  const currentSources = sources.filter(source => source.status === "current").length;
  const weatherRegions = appState.environmental?.weatherIntelligence?.regions || {};
  const weather = weatherRegions[selected.taluka] || weatherRegions[selected.region] || weatherRegions.pune_city || Object.values(weatherRegions)[0];
  const weatherLabel = weather ? `${weather.rainRisk || "Minimal"} rain risk` : "Weather unavailable";
  const riverItems = appState.environmental?.riverIntelligence || [];
  const riverAttention = riverItems.filter(item => ["watch", "warning", "emergency", "elevated", "high", "critical"].includes(item.severity) || ["elevated", "high", "critical"].includes(item.status)).length;
  return { area, sources, weather: weatherLabel, water: riverItems.length ? (riverAttention ? `${riverAttention} water reading${riverAttention === 1 ? "" : "s"} need attention` : "Rivers and dams normal") : "Water data unavailable", official: sources.length ? `${currentSources}/${sources.length} official alert sources current` : "Official source status unavailable" };
}
function friendlyStatus(status) { return ["healthy", "current"].includes(status) ? "current" : status || "unavailable"; }
