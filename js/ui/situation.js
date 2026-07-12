import { state, filteredEvents } from "../core/state.js";
import { escapeHtml, escapeAttr, relativeTime } from "../utils/format.js";
import { openTab } from "../core/navigation.js";
import { sourceStatus } from "../utils/freshness.js";

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

    ${renderRiverIntelligence()}

    <section class="card">
      <div class="section-kicker">Updates</div>
      <h2>Since Your Last Visit</h2>
      ${renderVisitChanges()}
    </section>

    <section class="card">
      <h2>Updated</h2>
      ${renderUpdateSummary()}
    </section>

    ${renderDisclaimer()}
  `;
  bindSituationActions(panel);
}

function renderRiverIntelligence() {
  const items = state.environmental?.riverIntelligence || [];
  const gauges = items.filter(item => item.kind === "river_gauge");
  const reservoirs = items.filter(item => item.kind === "reservoir");
  if (!items.length) return `<section class="card"><div class="section-kicker">Water Intelligence</div><h2>Rivers and Dams</h2><p class="empty">Current official river and dam readings are unavailable.</p></section>`;
  const attention = items.filter(item => ["watch", "warning", "emergency", "elevated", "high", "critical"].includes(item.severity) || ["elevated", "high", "critical"].includes(item.status)).length;
  const summary = attention ? `${attention} of ${items.length} official readings need attention` : `No Risk on ${items.length} official readings`;
  return `<section class="card"><div class="section-kicker">Water Intelligence</div><h2>Rivers and Dams</h2>
    <p><strong>${attention ? "River and dam conditions need attention" : "Rivers and dams normal"}:</strong> ${escapeHtml(summary)}</p>
    <details><summary>View ${items.length} official readings</summary>
      <p class="small">Official Maharashtra WRD readings. Reservoir storage is informational and does not by itself indicate a flood warning.</p>
      <ul class="compact-list">
        ${gauges.map(item => `<li><strong>${escapeHtml(item.station)}</strong> · ${escapeHtml(item.river)} · ${escapeHtml(item.status === "normal" ? "below alert level" : item.status)}${Number.isFinite(item.level) ? ` · ${escapeHtml(item.level)} m` : ""}</li>`).join("")}
        ${reservoirs.map(item => `<li><strong>${escapeHtml(item.damLabel)}</strong>${Number.isFinite(item.storagePercent) ? ` · ${escapeHtml(item.storagePercent)}% storage` : ""}${Number.isFinite(item.dischargeCumecs) ? ` · ${escapeHtml(item.dischargeCumecs)} cumecs reported discharge` : ""}</li>`).join("")}
      </ul>
    </details>
  </section>`;
}

function weatherMetric(value, label, guidance) {
  return `<div class="metric"><div class="metric-heading"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div><small>${escapeHtml(guidance)}</small></div>`;
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

function renderUpdateSummary() {
  const sources = state.sourceHealth?.sources || [];
  const unavailable = sources.filter(source => ["unavailable", "stale"].includes(sourceStatus(source))).length;
  const summary = unavailable ? `Data services checked ${relativeTime(latestLiveTimestamp())}; ${unavailable} source${unavailable === 1 ? "" : "s"} currently limited.` : `Data services operating normally · latest check ${relativeTime(latestLiveTimestamp())}.`;
  return `<p><strong>${escapeHtml(summary)}</strong></p><details><summary>View source and timing details</summary><p class="small">Sources update independently, so their individual check times can differ.</p><p class="small">Core intelligence generated ${relativeTime(state.intelligence?.generatedAt || state.environmental?.generatedAt)}.</p>${renderSourceHealth()}</details>`;
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

function renderVisitChanges() {
  const changes = state.visitChanges || { firstVisit: true, items: [] };
  if (changes.firstVisit) return `<p class="small">This visit establishes your baseline. New, updated or resolved alerts and incidents will appear here next time.</p>`;
  if (!changes.items.length) return `<p>No major alert or incident changes since your previous visit.</p>`;
  return `<ul class="compact-list">${changes.items.map(item => {
    const label = item.change === "new" ? "New" : item.change === "updated" ? "Updated" : "No longer active";
    if (item.change === "resolved" && item.link) return `<li><strong>${label}:</strong> <a href="${escapeAttr(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></li>`;
    if (item.change === "resolved") return `<li><strong>${label}:</strong> ${escapeHtml(item.title)}</li>`;
    return `<li><button type="button" class="visit-change" data-tab="${escapeAttr(item.tab)}" data-event-id="${escapeAttr(item.id)}"><strong>${label}:</strong> ${escapeHtml(item.title)}</button></li>`;
  }).join("")}</ul>`;
}

function bindSituationActions(panel) {
  panel.querySelectorAll(".visit-change").forEach(button => button.addEventListener("click", () => openTab(button.dataset.tab, button.dataset.eventId)));
  const openDisclaimer = panel.querySelector("#openDisclaimer");
  const disclaimer = panel.querySelector("#appDisclaimer");
  openDisclaimer?.addEventListener("click", () => {
    if (typeof disclaimer?.showModal === "function") disclaimer.showModal();
    else disclaimer?.setAttribute("open", "");
  });
}

function renderDisclaimer() {
  return `<section class="card disclaimer-banner">
    <div>
      <div class="section-kicker">About this intelligence</div>
      <h2>Data, trust and privacy</h2>
      <p class="small">How CITY EMERGENCY ALERTS handles source information and your device data.</p>
    </div>
    <button id="openDisclaimer" class="secondary-btn" type="button" aria-haspopup="dialog">Read disclaimer</button>
    <dialog id="appDisclaimer" class="disclaimer-dialog" aria-labelledby="disclaimerTitle">
      <form method="dialog" class="dialog-close"><button class="secondary-btn" type="submit" aria-label="Close disclaimer">Close</button></form>
      <div class="section-kicker">CITY EMERGENCY ALERTS</div>
      <h2 id="disclaimerTitle">About this intelligence</h2>
      <p>CITY EMERGENCY ALERTS is an independent public-safety information tool for Pune District. It is not an official government emergency-notification service and must not replace instructions issued by emergency authorities.</p>
      <h3>How information is handled</h3>
      <p>The app automatically processes currently available information from configured official sources, trusted news providers, weather and transport services, and other permitted data feeds. Information is displayed with its source, time, locality relevance and confidence where available.</p>
      <p>We do not create, report or independently verify emergency events ourselves. What the app shows depends on source availability, timeliness, accuracy and automated system processing.</p>
      <h3>How trust is assessed</h3>
      <p>Official emergency and government sources receive the highest priority. Reports from trusted media, including PTI and ANI, may appear as a <strong>Developing Incident</strong> when relevant to Pune District.</p>
      <p>A media report is not an official emergency instruction. Confidence increases only when the event is independently corroborated or confirmed by an official source. Republishes of the same PTI or ANI report are treated as one originating report, not multiple confirmations.</p>
      <p>Stale, unverified, duplicated, geographically unclear or Pune-irrelevant information may be excluded.</p>
      <h3>Your safety</h3>
      <p>Conditions can change quickly. Always follow official instructions from emergency services, police, district administration and disaster-management agencies. For immediate danger or a life-threatening emergency, call <strong>112</strong>.</p>
      <h3>Privacy and device data</h3>
      <p>This app has no backend server that collects or stores your personal information. Your selected region, locality, checklist progress and visit history are stored only in your browser on your device.</p>
      <p>If you choose current location or Journey Assistance, your browser requests permission. Route, search, traffic and weather requests are sent directly to the relevant service providers, such as TomTom and Open-Meteo. Precise location history is not stored by this app.</p>
      <p class="small"><strong>Last reviewed:</strong> July 2026 · Version 6.1</p>
    </dialog>
  </section>`;
}

function explainSituation() {
  const parts = [];
  if (state.environmental?.environmentalImpact?.citizenSummary) parts.push(state.environmental.environmentalImpact.citizenSummary);
  if ((state.alerts || []).length) parts.push("Alerts are ranked using severity, source confidence, freshness and locality relevance.");
  if ((state.environmental?.riverIntelligence || []).length) parts.push("River and dam conditions are included because they can affect downstream travel and safety.");
  if (state.live?.liveReadiness) parts.push("Official and trusted sources are configured for production user testing.");
  return parts.join(" ") || "This snapshot is generated from validated emergency intelligence data.";
}
