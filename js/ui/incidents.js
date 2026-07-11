import { state, filteredEvents, relevantEvents } from "../core/state.js";
import { renderEventList } from "./events.js";
import { groupIncidentsForCitizens } from "../intelligence/incident-presentation.js";

export function renderIncidents() {
  const filtered = filteredEvents(state.incidents);
  const items = relevantEvents(state.incidents);
  const groups = groupIncidentsForCitizens(items);
  const incidentCount = groups.publicSafety.length + groups.travel.length + groups.other.length;
  const note = filtered.length || !items.length ? "" : `<p class="small">Showing broader district incidents because no locality-specific incident matched your current filter.</p>`;
  const sourceNote = state.intelligence?.sourceHealth?.events?.status === "unavailable" ? `<p class="small"><strong>Live incident sources are not connected yet.</strong> No generated or sample incident is being presented as current.</p>` : "";
  document.getElementById("tab-incidents").innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Disruptions</div>
      <h2>Incidents</h2>
      <p>Current safety and travel incidents, prioritised for your selected area.</p>
      ${note}
      ${sourceNote}
    </section>
  ` + renderIncidentGroups(groups, incidentCount);
}

function renderIncidentGroups(groups, incidentCount) {
  if (!incidentCount) return `<section class="card empty"><h2>No medium or major incident detected</h2><p>No qualifying public-safety or major travel incident was found in the connected official and trusted sources.</p>${groups.roadClosures.length ? `<p class="small">${groups.roadClosures.length} current road closure${groups.roadClosures.length === 1 ? " is" : "s are"} available under Journey.</p>` : ""}</section>`;
  return [
    section("Public safety incidents", "Accidents, fires, flooding, collapse and rescue.", groups.publicSafety),
    section("Major travel incidents", "Serious disruption and dangerous travel conditions. Road closures are in Journey.", groups.travel),
    section("Other important incidents", "Other current incidents with potential citizen impact.", groups.other)
  ].join("");
}
function section(title, description, items) {
  if (!items.length) return "";
  return `<section class="card incident-group-heading"><h2>${title}</h2><p class="small">${description}</p></section>${renderEventList(items, "")}`;
}
