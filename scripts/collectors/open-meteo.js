const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export function buildOpenMeteoUrl(locations, timezone = "Asia/Kolkata") {
  const values = Object.values(locations || {});
  const params = new URLSearchParams({
    latitude: values.map(item => item.lat).join(","),
    longitude: values.map(item => item.lon).join(","),
    current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m",
    hourly: "precipitation_probability,precipitation,visibility",
    forecast_days: "2",
    timezone
  });
  return `${ENDPOINT}?${params}`;
}

export function normalizeOpenMeteoResponse(payload, locations, checkedAt) {
  const entries = Object.entries(locations || {});
  const responses = Array.isArray(payload) ? payload : [payload];
  if (!entries.length || responses.length !== entries.length) {
    throw new Error("Open-Meteo returned an unexpected number of locations");
  }

  return Object.fromEntries(entries.map(([key, location], index) => {
    const response = responses[index];
    if (!response?.current || !response?.hourly?.time) {
      throw new Error(`Open-Meteo response is incomplete for ${location.label || key}`);
    }
    const nextIndexes = futureHourlyIndexes(response.hourly.time, response.current.time, 6);
    const precipitation = nextIndexes.reduce((sum, i) => sum + finite(response.hourly.precipitation?.[i]), 0);
    const probabilities = nextIndexes.map(i => finite(response.hourly.precipitation_probability?.[i]));
    const visibilityValues = nextIndexes.map(i => finite(response.hourly.visibility?.[i], 10000));

    return [key, {
      label: location.label || key,
      latitude: response.latitude ?? location.lat,
      longitude: response.longitude ?? location.lon,
      temp: finite(response.current.temperature_2m),
      rain: finite(response.current.rain),
      precipitation: finite(response.current.precipitation),
      next6hRainMm: round(precipitation, 1),
      precipitationProbability: Math.max(0, ...probabilities),
      wind: finite(response.current.wind_speed_10m),
      gust: finite(response.current.wind_gusts_10m),
      humidity: finite(response.current.relative_humidity_2m),
      visibility: round(Math.min(...visibilityValues) / 1000, 1),
      weatherCode: response.current.weather_code ?? null,
      observedAt: withOffset(response.current.time, response.utc_offset_seconds),
      sourceCheckedAt: checkedAt,
      source: "Open-Meteo",
      sourceUrl: "https://open-meteo.com/"
    }];
  }));
}

export async function fetchOpenMeteo(locations, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = options.timeoutMs || 15000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(buildOpenMeteoUrl(locations, options.timezone), {
      headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Open-Meteo request failed with HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function futureHourlyIndexes(times, currentTime, count) {
  const first = Math.max(0, times.findIndex(time => time >= currentTime));
  return Array.from({ length: Math.min(count, times.length - first) }, (_, i) => first + i);
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, precision) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function withOffset(localIso, offsetSeconds = 0) {
  if (!localIso || /(?:Z|[+-]\d\d:\d\d)$/.test(localIso)) return localIso || null;
  const sign = offsetSeconds >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetSeconds);
  const hours = String(Math.floor(absolute / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((absolute % 3600) / 60)).padStart(2, "0");
  return `${localIso}:00${sign}${hours}:${minutes}`;
}
