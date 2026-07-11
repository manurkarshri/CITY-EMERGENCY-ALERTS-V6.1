import { state, filteredEvents } from "../core/state.js";
import { escapeHtml, escapeAttr, relativeTime } from "../utils/format.js";

export function renderSituation() {
  const panel = document.getElementById("tab-situation");
  const weatherRegions = state.environmental?.weatherIntelligence?.regions || state.intelligence?.situation?.weather?.regions || {};
  const weather = weatherRegions[state.selected.taluka] || weatherRegions[state.selected.region] || weatherRegions.pune_city || Object.values(weatherRegions)[0];
  const weatherSource = state.environmental?.weatherSource || {};
  const weatherStatus = effectiveWeatherStatus(weatherSource);
  const snapshot = state.intelligence?.situation?.snapshot || state.environmental?.story || "Situation information is being prepared.";

  panel.innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Current Weather</div>
      <h2>Weather Intelligence</h2>
      ${renderWeatherFreshness(weatherSource, weatherStatus)}
      ${weather && weatherStatus !== "unavailable" ? `
        <div class="grid">
          ${weatherMetric(`${weather.temp ?? "--"}°C`, "Temperature", temperatureGuidance(weather.temp))}
          ${weatherMetric(weather.rainRisk || "Minimal", "Rain Risk", rainGuidance(weather))}
          ${weatherMetric(`${weather.wind ?? "--"} km/h`, "Wind", windGuidance(weather.wind, weather.gust))}
          ${weatherMetric(`${weather.visibility ?? "--"} km`, "Visibility", visibilityGuidance(weather.visibility))}
        </div>
        <p>${escapeHtml((weather.advice || [])[0] || "No major weather issue indicated.")}</p>
        ${weatherSource.attribution?.url ? `<p class="small">Weather data: <a href="${escapeAttr(weatherSource.attribution.url)}" target="_blank" rel="noopener">${escapeHtml(weatherSource.attribution.name || "Open-Meteo")}</a></p>` : ""}
      ` : `<p class="empty">Weather intelligence is not available yet.</p>`}
    </section>

    <section class="card">
      <div class="section-kicker">Situation</div>
      <h2>Snapshot</h2>
      <p>${escapeHtml(snapshot)}</p>
      <details><summary>Why am I seeing this?</summary><p>${escapeHtml(explainSituation())}</p></details>
      <div class="health-strip">
        <span class="health-chip">${filteredEvents(state.alerts).length} alerts</span>
        <span class="health-chip">${filteredEvents(state.incidents).length} incidents</span>
        <span class="health-chip">${state.environmental?.riverIntelligence?.length || 0} river items</span>
      </div>
    </section>

    <section class="card">
      <div class="section-kicker">Updates</div>
      <h2>Since Your Last Visit</h2>
      <ul class="compact-list">${sinceLastVisit().map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>

    <section class="card">
      <h2>Updated</h2>
      <p><strong>Latest live data checked:</strong> ${relativeTime(latestLiveTimestamp())}</p>
      <p class="small">Core intelligence generated ${relativeTime(state.intelligence?.generatedAt || state.environmental?.generatedAt)}.</p>
      ${renderSourceHealth()}
    </section>
  `;
}

function weatherMetric(value, label, guidance) {
  return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(guidance)}</small></div>`;
}

export function temperatureGuidance(value) {
  const temp = Number(value);
  if (!Number.isFinite(temp)) return "Interpretation unavailable";
  if (temp >= 41) return "Dangerously hot - limit exposure";
  if (temp >= 38) return "Very hot - heat caution";
  if (temp >= 33) return "Hotter than comfortable";
  if (temp < 15) return "Cool for Pune conditions";
  return "Generally comfortable range";
}

export function rainGuidance(weather = {}) {
  const now = Number(weather.currentRain || 0) > 0 ? "Raining now" : "No measurable rain now";
  return `${now}; ${weather.rainRisk || "Minimal"} risk in next 6 hours`;
}

export function windGuidance(value, gustValue) {
  const wind = Number(value);
  if (!Number.isFinite(wind)) return "Interpretation unavailable";
  const level = wind >= 60 ? "Hazardous wind" : wind >= 40 ? "Strong - travel caution" : wind >= 20 ? "Breezy - two-wheelers take care" : "Light to moderate";
  const gust = Number(gustValue);
  return Number.isFinite(gust) && gust > wind + 5 ? `${level}; gusts ${gust} km/h` : level;
}

export function visibilityGuidance(value) {
  const km = Number(value);
  if (!Number.isFinite(km)) return "Interpretation unavailable";
  if (km <= 1) return "Very poor - unsafe driving risk";
  if (km <= 2) return "Poor - drive cautiously";
  if (km <= 5) return "Reduced visibility";
  if (km < 10) return "Fair visibility";
  return "Good visibility";
}

export function latestLiveTimestamp() {
  const values = [state.environmental?.weatherSource?.sourceCheckedAt, ...(state.sourceHealth?.sources || []).map(source => source.sourceCheckedAt), state.intelligence?.generatedAt].filter(Boolean);
  return values.sort((a, b) => new Date(b) - new Date(a))[0] || null;
}

function renderSourceHealth() {
  const sources = state.sourceHealth?.sources || [];
  if (!sources.length) return `<p class="small"><strong>Source status unavailable.</strong> No source checks have been recorded.</p>`;
  return `<div class="health-strip">${sources.map(source => {
    const label = source.status === "healthy" ? "current" : source.status;
    const timing = source.sourceCheckedAt ? ` · checked ${relativeTime(source.sourceCheckedAt)}` : " · not checked";
    return `<span class="health-chip">${escapeHtml(source.name)}: ${escapeHtml(label)}${escapeHtml(timing)}</span>`;
  }).join("")}</div>`;
}

function effectiveWeatherStatus(source) {
  if (!source.lastSuccessfulAt) return "unavailable";
  const age = Date.now() - new Date(source.lastSuccessfulAt).getTime();
  const staleAfter = Number(source.staleAfterMinutes || 90) * 60 * 1000;
  return source.status === "current" && age <= staleAfter ? "current" : "stale";
}

function renderWeatherFreshness(source, status) {
  if (status === "current") return `<p class="small">Current data · checked ${relativeTime(source.sourceCheckedAt)}</p>`;
  if (status === "stale") return `<p class="small"><strong>Weather data is stale.</strong> Last successful update ${relativeTime(source.lastSuccessfulAt)}. Latest check ${relativeTime(source.sourceCheckedAt)}.</p>`;
  return `<p class="small"><strong>Live weather is temporarily unavailable.</strong>${source.sourceCheckedAt ? ` Latest check ${relativeTime(source.sourceCheckedAt)}.` : ""}</p>`;
}

function sinceLastVisit() {
  const alerts = filteredEvents(state.alerts).length;
  const incidents = filteredEvents(state.incidents).length;
  const rivers = state.environmental?.riverIntelligence?.length || 0;
  const out = [];
  if (alerts) out.push(`${alerts} important alert${alerts === 1 ? "" : "s"} active.`);
  if (incidents) out.push(`${incidents} incident${incidents === 1 ? "" : "s"} available.`);
  if (rivers) out.push(`${rivers} river or dam intelligence item${rivers === 1 ? "" : "s"} processed.`);
  return out.length ? out : ["No major change detected in the current intelligence feed."];
}

function explainSituation() {
  const parts = [];
  if (state.environmental?.environmentalImpact?.citizenSummary) parts.push(state.environmental.environmentalImpact.citizenSummary);
  if ((state.alerts || []).length) parts.push("Alerts are ranked using severity, source confidence, freshness and locality relevance.");
  if ((state.environmental?.riverIntelligence || []).length) parts.push("River and dam conditions are included because they can affect downstream travel and safety.");
  if (state.live?.liveReadiness) parts.push("Official and trusted sources are configured for production user testing.");
  return parts.join(" ") || "This snapshot is generated from validated emergency intelligence data.";
}
