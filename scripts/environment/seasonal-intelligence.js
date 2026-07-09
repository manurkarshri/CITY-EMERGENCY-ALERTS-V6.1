import { loadConfig } from "../lib/config.js";
export async function buildSeasonalIntelligence(date = new Date()) {
  const cfg = await loadConfig("season.config.json");
  const month = date.getMonth() + 1;
  let activeSeason = "normal";
  for (const [season, value] of Object.entries(cfg)) if ((value.months || []).includes(month)) { activeSeason = season; break; }
  return { generatedAt: new Date().toISOString(), activeSeason, priorityHazards: cfg[activeSeason]?.priority || [], advice: buildSeasonAdvice(activeSeason) };
}
function buildSeasonAdvice(season) {
  return { monsoon: "Monitor rainfall, dam releases, waterlogging and ghat conditions.", summer: "Monitor heatwave, fire risk, water shortage and power demand.", winter: "Monitor fog, low visibility, cold wave and air quality.", festival: "Monitor crowds, traffic diversions and parking restrictions.", normal: "Monitor current alerts and local incidents." }[season] || "Monitor current alerts and local incidents.";
}
