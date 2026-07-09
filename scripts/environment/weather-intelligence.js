export function buildWeatherIntelligence(weather = {}) {
  const regions = {};
  for (const [key, item] of Object.entries(weather.regions || {})) {
    const rain6h = Number(item.next6hRainMm ?? item.rain ?? 0);
    const wind = Number(item.gust ?? item.wind ?? 0);
    const visibility = Number(item.visibility ?? 10);
    const temp = Number(item.temp ?? 0);
    const rainRisk = rain6h >= 30 ? "High" : rain6h >= 15 ? "Medium" : rain6h >= 5 ? "Low" : "Minimal";
    const windRisk = wind >= 60 ? "High" : wind >= 40 ? "Medium" : wind >= 20 ? "Low" : "Minimal";
    const visibilityRisk = visibility <= 1 ? "High" : visibility <= 2 ? "Medium" : visibility <= 5 ? "Low" : "Minimal";
    const heatRisk = temp >= 45 ? "Emergency" : temp >= 41 ? "Warning" : temp >= 38 ? "Watch" : "Normal";
    regions[key] = { label: item.label || key, source: item.source || "Weather", temp, rain6h, wind, visibility, rainRisk, windRisk, visibilityRisk, heatRisk, travelImpact: rainRisk === "High" || visibilityRisk === "High" ? "High" : rainRisk === "Medium" ? "Medium" : "Low", advice: buildWeatherAdvice(rainRisk, windRisk, visibilityRisk, heatRisk) };
  }
  return { generatedAt: new Date().toISOString(), regions };
}
function buildWeatherAdvice(rainRisk, windRisk, visibilityRisk, heatRisk) {
  const advice = [];
  if (rainRisk === "High") advice.push("Heavy rainfall may cause waterlogging. Allow extra travel time.");
  if (rainRisk === "Medium") advice.push("Moderate rainfall may slow travel in low-lying areas.");
  if (windRisk === "High") advice.push("Strong winds may affect trees, temporary structures and two-wheelers.");
  if (visibilityRisk === "High") advice.push("Low visibility may make driving unsafe.");
  if (heatRisk === "Warning" || heatRisk === "Emergency") advice.push("Avoid prolonged outdoor activity and stay hydrated.");
  return advice.length ? advice : ["No major weather-related disruption indicated."];
}
