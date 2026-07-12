import { state, filteredEvents, relevantEvents } from "../core/state.js";
import { renderEventList } from "./events.js";
import { escapeHtml, relativeTime } from "../utils/format.js";
import { openTab } from "../core/navigation.js";
import { buildAlertMonitoringSummary } from "../intelligence/alert-monitoring.js";

export function renderAlerts() {
  const filtered = filteredEvents(state.alerts);
  const items = relevantEvents(state.alerts);
  const note = filtered.length || !items.length ? "" : `<p class="small">Showing broader district alerts because no locality-specific alert matched your current filter.</p>`;
  const sourceNote = state.intelligence?.sourceHealth?.events?.status === "unavailable" ? `<p class="small"><strong>Live alert sources are not connected yet.</strong> No generated or sample alert is being presented as current.</p>` : "";
  const panel = document.getElementById("tab-alerts");
  panel.innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Warnings</div>
      <h2>Alerts</h2>
      <p>Official emergency warnings, plus clearly labelled media-correlated alerts awaiting official confirmation.</p>
      ${note}
      ${sourceNote}
    </section>
  ` + (items.length ? renderEventList(items, "") : renderNoActiveAlerts());
  panel.querySelector("#alertOfficialSources")?.addEventListener("click", () => openTab("official"));
}

function renderNoActiveAlerts() {
  const monitoring = buildAlertMonitoringSummary(state);
  return `<section class="card alert-clear-state">
    <div class="section-kicker">Current Status</div>
    <h2>No active emergency alerts</h2>
    <p><strong>No active emergency alert was found for ${escapeHtml(monitoring.area)}.</strong></p>
    <p class="small">Connected official sources have not reported a current warning for this area.</p>
    <div class="health-strip">
      <span class="health-chip">${escapeHtml(monitoring.weather)}</span>
      <span class="health-chip">${escapeHtml(monitoring.water)}</span>
      <span class="health-chip">${escapeHtml(monitoring.official)}</span>
    </div>
    <details><summary>What is being monitored?</summary>
      <p class="small">Official weather warnings from IMD, public emergency alerts from NDMA SACHET, and relevant environmental intelligence are checked for Pune District.</p>
      <ul class="compact-list">${monitoring.sources.map(source => `<li><strong>${escapeHtml(source.name)}</strong> · ${escapeHtml(source.status)}${source.checkedAt ? ` · checked ${relativeTime(source.checkedAt)}` : ""}</li>`).join("")}</ul>
      <button class="secondary-btn" id="alertOfficialSources" type="button">View official verification sources</button>
    </details>
  </section>`;
}
