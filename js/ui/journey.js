import { state } from "../core/state.js";
import { escapeHtml, escapeAttr } from "../utils/format.js";

let manualJourney = null;
let lastStart = localStorage.getItem("cea.journey.start") || "Kharadi";
let lastDestination = localStorage.getItem("cea.journey.destination") || "Hinjawadi";

export function renderJourney() {
  const panel = document.getElementById("tab-journey");
  const journeys = state.journey?.journeys || [];
  const best = manualJourney || journeys[0]?.bestRoute;

  panel.innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Route Safety</div>
      <h2>Journey</h2>
      <p>Check route suitability based on current alerts, incidents, weather and environmental intelligence.</p>
      <div class="form-row">
        <input id="journeyStart" placeholder="Start location" value="${escapeHtml(lastStart)}" />
        <input id="journeyDestination" placeholder="Destination" value="${escapeHtml(lastDestination)}" />
        <select id="journeyDeparture"><option>Leave Now</option><option>Choose Time</option></select>
        <button class="primary-btn" id="journeyBtn">Analyse Journey</button>
      </div>
      <p class="small">Version 6.1 provides app-side journey scoring and Google Maps handoff. Live traffic API routing can be added once a supported API key/source is available.</p>
    </section>
    ${best ? renderBestRoute(best) : `<section class="card empty">Journey intelligence has not generated route assessments yet.</section>`}
    ${journeys.length ? renderKnownJourneys(journeys) : ""}
  `;
  document.getElementById("journeyBtn")?.addEventListener("click", analyseTypedJourney);
}

function analyseTypedJourney() {
  const start = document.getElementById("journeyStart")?.value?.trim() || "Start";
  const destination = document.getElementById("journeyDestination")?.value?.trim() || "Destination";
  lastStart = start;
  lastDestination = destination;
  localStorage.setItem("cea.journey.start", start);
  localStorage.setItem("cea.journey.destination", destination);

  const known = findKnownJourney(start, destination);
  manualJourney = known?.bestRoute ? { ...known.bestRoute, label: `${start} to ${destination}`, start, destination } : createManualRoute(start, destination);
  renderJourney();
}

function findKnownJourney(start, destination) {
  const s = start.toLowerCase();
  const d = destination.toLowerCase();
  return (state.journey?.journeys || []).find(j => {
    const js = (j.start || "").toLowerCase();
    const jd = (j.destination || "").toLowerCase();
    return js.includes(s) || s.includes(js) || jd.includes(d) || d.includes(jd);
  });
}

function createManualRoute(start, destination) {
  const alerts = (state.alerts || []).length;
  const incidents = (state.incidents || []).length;
  const river = (state.environmental?.riverIntelligence || []).length;
  const weatherRegions = Object.values(state.environmental?.weatherIntelligence?.regions || {});
  const highWeather = weatherRegions.filter(w => ["High", "Medium"].includes(w.rainRisk)).length;
  const penalty = Math.min(45, alerts * 8 + incidents * 6 + river * 5 + highWeather * 5);
  const score = Math.max(40, 100 - penalty);
  const label = score >= 85 ? "Good to Go" : score >= 65 ? "Proceed with Caution" : "Replan if Possible";
  const delay = score >= 85 ? 5 : score >= 65 ? 15 : 30;

  return {
    label: `${start} to ${destination}`,
    start,
    destination,
    journeySuitability: { score, label, recommendation: `${label}. Assessment is based on current alerts, incidents, weather and environmental intelligence.` },
    estimatedTimeMin: null,
    estimatedDelayMin: delay,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(start + " to " + destination)}`,
    explanation: `${start} to ${destination}: Journey suitability is ${label} (${score}/100). Estimated delay may be around ${delay} minutes. Open in Maps to review live route and traffic options.`
  };
}

function renderBestRoute(route) {
  return `
    <section class="card route-card recommended">
      <div class="section-kicker">Recommended</div>
      <h2>Best Route</h2>
      <h3>${escapeHtml(route.label)}</h3>
      <div class="grid">
        <div class="metric"><strong>${route.journeySuitability?.score ?? "--"}/100</strong><span>Journey Suitability</span></div>
        <div class="metric"><strong>${escapeHtml(route.journeySuitability?.label || "Unknown")}</strong><span>Recommendation</span></div>
        <div class="metric"><strong>${route.estimatedTimeMin ?? "Maps"} ${route.estimatedTimeMin ? "min" : ""}</strong><span>Estimated Time</span></div>
        <div class="metric"><strong>${route.estimatedDelayMin ?? "--"} min</strong><span>Estimated Delay</span></div>
      </div>
      <p>${escapeHtml(route.explanation || route.journeySuitability?.recommendation || "")}</p>
      <a class="primary-btn" href="${escapeAttr(route.googleMapsUrl || "#")}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">Open in Google Maps</a>
    </section>
  `;
}

function renderKnownJourneys(journeys) {
  return `<section class="card"><h2>Configured Journey Examples</h2><p class="small">Generated route assessments from the current intelligence pipeline.</p>${journeys.map(renderJourneyComparison).join("")}</section>`;
}

function renderJourneyComparison(journey) {
  return `<details><summary>${escapeHtml(journey.start)} → ${escapeHtml(journey.destination)}</summary>${(journey.routes || []).map(route => `<div class="metric" style="margin-top:8px"><strong>${escapeHtml(route.label)}</strong><span>${route.journeySuitability?.score ?? "--"}/100 · ${escapeHtml(route.journeySuitability?.label || "")} · ${route.estimatedTimeMin ?? "--"} min</span></div>`).join("")}</details>`;
}
