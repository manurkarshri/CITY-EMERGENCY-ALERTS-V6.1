import { state, filteredEvents, relevantEvents } from "../core/state.js";
import { renderEventList } from "./events.js";

export function renderIncidents() {
  const filtered = filteredEvents(state.incidents);
  const items = relevantEvents(state.incidents);
  const note = filtered.length || !items.length ? "" : `<p class="small">Showing broader district incidents because no locality-specific incident matched your current filter.</p>`;
  document.getElementById("tab-incidents").innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Disruptions</div>
      <h2>Incidents</h2>
      <p>Ongoing disruptions that may affect citizens, services or travel.</p>
      ${note}
    </section>
  ` + renderEventList(items, "No active incidents available.");
}
