import { state } from "../core/state.js";
import { hierarchicalIncidentEvents } from "../intelligence/incident-relevance.js";
import { renderEventList } from "./events.js";
import { groupIncidentsForCitizens } from "../intelligence/incident-presentation.js";
import { escapeHtml } from "../utils/format.js";

export function renderIncidents() {
  const selection = hierarchicalIncidentEvents(state.incidents, state.selected, state.localitiesConfig);
  const items = selection.items;
  const groups = groupIncidentsForCitizens(items);
  const incidentCount = groups.publicSafety.length + groups.travel.length + groups.other.length;
  const note = fallbackNote(selection.level);
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

function fallbackNote(level) {
  const locality = state.selected.locality;
  const taluka = state.talukas?.[state.selected.taluka]?.label || "selected Taluka";
  if (level === "taluka" && locality) return `<p class="small"><strong>No current incident matched ${escapeHtml(locality)}.</strong> Showing current incidents from ${escapeHtml(taluka)} Taluka.</p>`;
  if (level === "district") {
    const checked = locality ? `${escapeHtml(locality)} or ${escapeHtml(taluka)} Taluka` : `${escapeHtml(taluka)} Taluka`;
    return `<p class="small"><strong>No current incident matched ${checked}.</strong> Showing current incidents from Pune District.</p>`;
  }
  return "";
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
