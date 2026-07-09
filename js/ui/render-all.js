import { state } from "../core/state.js";
import { relativeTime } from "../utils/format.js";
import { renderSituation } from "./situation.js";
import { renderAlerts } from "./alerts.js";
import { renderIncidents } from "./incidents.js";
import { renderJourney } from "./journey.js";
import { renderOfficial } from "./official.js";
import { renderEmergency } from "./emergency.js";

export function renderAll() {
  renderSituation();
  renderAlerts();
  renderIncidents();
  renderJourney();
  renderOfficial();
  renderEmergency();
  const footer = document.getElementById("footerUpdated");
  if (footer) footer.textContent = `Updated: ${relativeTime(state.build?.build?.buildTime || state.intelligence?.generatedAt)}`;
}
