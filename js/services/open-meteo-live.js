const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export async function fetchRouteWeather(routePoints = []) {
  const points = samplePoints(routePoints, 4);
  return fetchWeatherPoints(points, "route");
}

export async function fetchLocationWeather(position, label = "Selected location") {
  const regions = await fetchWeatherPoints([{ latitude: position.lat, longitude: position.lon }], "selected");
  const item = regions.selected_1;
  return { ...item, label };
}

async function fetchWeatherPoints(points, prefix) {
  if (!points.length) return {};
  const params = new URLSearchParams({
    latitude: points.map(point => point.latitude ?? point.lat).join(","),
    longitude: points.map(point => point.longitude ?? point.lon).join(","),
    current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m",
    hourly: "precipitation_probability,precipitation,visibility",
    forecast_days: "1",
    timezone: "auto"
  });
  const response = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`);
  const payload = await response.json();
  const values = Array.isArray(payload) ? payload : [payload];
  const checkedAt = new Date().toISOString();
  return Object.fromEntries(values.map((item, index) => [`${prefix}_${index + 1}`, normalizeLiveWeather(item, checkedAt)]));
}

export function normalizeLiveWeather(item, checkedAt) {
  const hourly = item.hourly || {};
  const start = Math.max(0, (hourly.time || []).findIndex(time => time >= item.current?.time));
  const indexes = Array.from({ length: Math.min(6, (hourly.time || []).length - start) }, (_, index) => start + index);
  const rain6h = indexes.reduce((sum, index) => sum + number(hourly.precipitation?.[index]), 0);
  const visibility = Math.min(...indexes.map(index => number(hourly.visibility?.[index], 10000))) / 1000;
  const probability = Math.max(0, ...indexes.map(index => number(hourly.precipitation_probability?.[index])));
  const gust = number(item.current?.wind_gusts_10m);
  const temperature = number(item.current?.temperature_2m);
  const rainRisk = rain6h >= 30 ? "High" : rain6h >= 15 ? "Medium" : rain6h >= 5 ? "Low" : "Minimal";
  const windRisk = gust >= 60 ? "High" : gust >= 40 ? "Medium" : gust >= 20 ? "Low" : "Minimal";
  const visibilityRisk = visibility <= 1 ? "High" : visibility <= 2 ? "Medium" : visibility <= 5 ? "Low" : "Minimal";
  return {
    label: "Route weather point",
    latitude: Number(item.latitude), longitude: Number(item.longitude), temp: temperature,
    currentRain: number(item.current?.rain), rain6h: round(rain6h), precipitationProbability: probability,
    wind: number(item.current?.wind_speed_10m), gust, humidity: number(item.current?.relative_humidity_2m),
    visibility: round(visibility), weatherCode: item.current?.weather_code ?? null,
    rainRisk, windRisk, visibilityRisk, heatRisk: temperature >= 45 ? "Emergency" : temperature >= 41 ? "Warning" : temperature >= 38 ? "Watch" : "Normal",
    source: "Open-Meteo", sourceUrl: "https://open-meteo.com/", sourceCheckedAt: checkedAt, observedAt: item.current?.time || null,
    advice: advice(rainRisk, windRisk, visibilityRisk)
  };
}

function samplePoints(points, count) {
  if (!points.length) return [];
  const indexes = Array.from({ length: Math.min(count, points.length) }, (_, index) => Math.round(index * (points.length - 1) / Math.max(1, Math.min(count, points.length) - 1)));
  return [...new Set(indexes)].map(index => points[index]);
}
function advice(rain, wind, visibility) {
  if (rain === "High") return ["Heavy rainfall may cause waterlogging and travel disruption."];
  if (visibility === "High") return ["Low visibility may make driving unsafe."];
  if (wind === "High") return ["Strong winds may affect road safety."];
  if (rain === "Medium") return ["Moderate rainfall may slow travel."];
  return ["No major weather-related disruption indicated."];
}
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function round(value) { return Math.round(value * 10) / 10; }
