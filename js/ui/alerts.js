import { state, filteredEvents, relevantEvents } from "../core/state.js";
import { renderEventList } from "./events.js";

export function renderAlerts() {
  const filtered = filteredEvents(state.alerts);
  const items = relevantEvents(state.alerts);
  const note = filtered.length || !items.length ? "" : `<p class="small">Showing broader district alerts because no locality-specific alert matched your current filter.</p>`;
  const sourceNote = state.intelligence?.sourceHealth?.events?.status === "unavailable" ? `<p class="small"><strong>Live alert sources are not connected yet.</strong> No generated or sample alert is being presented as current.</p>` : "";
  document.getElementById("tab-alerts").innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Warnings</div>
      <h2>Alerts</h2>
      <p>Official emergency warnings requiring immediate awareness or action. Traffic disruptions and developing media reports remain under Incidents unless officially confirmed.</p>
      ${note}
      ${sourceNote}
    </section>
  ` + renderEventList(items, "No current official emergency alert was found in the connected sources.");
}
