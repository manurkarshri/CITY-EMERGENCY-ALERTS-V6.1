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
          <div class="metric"><strong>${weather.temp ?? "--"}°C</strong><span>Temperature</span></div>
          <div class="metric"><strong>${weather.rainRisk || "Normal"}</strong><span>Rain Risk</span></div>
          <div class="metric"><strong>${weather.wind ?? "--"} km/h</strong><span>Wind</span></div>
          <div class="metric"><strong>${weather.visibility ?? "--"} km</strong><span>Visibility</span></div>
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
      <p>${relativeTime(state.build?.build?.buildTime || state.intelligence?.generatedAt || state.environmental?.generatedAt)}</p>
    </section>
  `;
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
  const journeys = state.journey?.journeys?.length || 0;
  const out = [];
  if (alerts) out.push(`${alerts} important alert${alerts === 1 ? "" : "s"} active.`);
  if (incidents) out.push(`${incidents} incident${incidents === 1 ? "" : "s"} available.`);
  if (rivers) out.push(`${rivers} river or dam intelligence item${rivers === 1 ? "" : "s"} processed.`);
  if (journeys) out.push(`${journeys} journey assessment${journeys === 1 ? "" : "s"} available.`);
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
