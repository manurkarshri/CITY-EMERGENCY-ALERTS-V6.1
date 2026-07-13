import { state } from "../core/state.js";
import { escapeHtml, escapeAttr } from "../utils/format.js";
import { tomTomConfigured, searchPlaces, reverseGeocode, calculateRoutes, trafficIncidentsForRoutes, labelRoutesByMilestones } from "../services/tomtom.js";
import { fetchRouteWeather } from "../services/open-meteo-live.js";
import { analyseJourneyRoutes } from "../intelligence/journey-analysis.js";
import { isTomTomRoadClosure } from "../intelligence/incident-presentation.js";
import { relativeTime } from "../utils/format.js";

let selectedStart = null;
let selectedDestination = null;
let analysedRoutes = [];
let statusMessage = "";
let statusKind = "info";
let searchTimer = null;

export function renderJourney() {
  const panel = document.getElementById("tab-journey");
  panel.innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Route Safety</div>
      <h2>Journey Assistance</h2>
      <p>Compare traffic-aware routes using current traffic incidents, weather, alerts and environmental intelligence.</p>
      ${tomTomConfigured() ? "" : `<p class="journey-status warning"><strong>Journey routing is not configured in this deployment.</strong></p>`}
      <div class="form-row journey-form">
        <button class="secondary-btn" id="journeyCurrentLocation" type="button">Use My Current Location</button>
        ${locationField("journeyStart", "Start location", selectedStart)}
        ${locationField("journeyDestination", "Destination", selectedDestination)}
        <label for="journeyDeparture">Departure</label>
        <select id="journeyDeparture">
          <option value="now">Leave now</option>
          <option value="30">In 30 minutes</option>
          <option value="60">In 1 hour</option>
          <option value="custom">Choose date and time</option>
        </select>
        <input id="journeyCustomTime" type="datetime-local" hidden />
        <button class="primary-btn" id="journeyBtn" type="button" ${tomTomConfigured() ? "" : "disabled"}>Analyse Journey</button>
      </div>
      <p id="journeyStatus" class="journey-status ${escapeAttr(statusKind)}" role="status">${escapeHtml(statusMessage)}</p>
      <p class="small">Locations and routes are requested directly from TomTom. Precise location history is not stored.</p>
    </section>
    <div id="journeyResults">${renderResults()}</div>
    <div id="journeyRoadClosures">${renderRoadClosurePanel()}</div>
  `;
  bindJourneyControls();
}

function renderRoadClosurePanel() {
  const closures = (state.incidents || []).filter(isTomTomRoadClosure);
  if (!closures.length) return `<section class="card"><div class="section-kicker">Road Conditions</div><h2>Current Road Closures</h2><p class="small">No current road closure was reported by TomTom for the monitored Pune District area.</p></section>`;
  return `<section class="card"><div class="section-kicker">Road Conditions</div><h2>Current Road Closures</h2>
    <p><strong>${closures.length} closure${closures.length === 1 ? "" : "s"} currently reported.</strong> Analyse a journey to check which ones may affect your route.</p>
    <details><summary>View reported closures</summary><ul class="compact-list">${closures.slice(0, 15).map(closure => `<li><strong>${escapeHtml(closure.affectedArea || closure.title.replace(/^Traffic:\s*/i, ""))}</strong>${closure.lastVerifiedAt ? ` · verified ${relativeTime(closure.lastVerifiedAt)}` : ""}</li>`).join("")}</ul>${closures.length > 15 ? `<p class="small">Showing 15 highest-priority closures. Journey analysis checks the current route-specific feed.</p>` : ""}</details>
  </section>`;
}

function locationField(id, placeholder, selected) {
  return `<div class="autocomplete-field">
    <label for="${id}">${placeholder}</label>
    <input id="${id}" placeholder="${placeholder}" autocomplete="off" aria-autocomplete="list" aria-controls="${id}Suggestions" value="${escapeAttr(selected?.label || "")}" />
    <button class="clear-location" id="${id}Clear" type="button" aria-label="Clear ${placeholder}">×</button>
    <div id="${id}Suggestions" class="suggestions" role="listbox" hidden></div>
  </div>`;
}

function bindJourneyControls() {
  document.getElementById("journeyStart")?.addEventListener("input", event => handleLocationInput(event, "start"));
  document.getElementById("journeyDestination")?.addEventListener("input", event => handleLocationInput(event, "destination"));
  document.getElementById("journeyStartClear")?.addEventListener("click", () => clearLocation("start"));
  document.getElementById("journeyDestinationClear")?.addEventListener("click", () => clearLocation("destination"));
  document.getElementById("journeyCurrentLocation")?.addEventListener("click", useCurrentLocation);
  document.getElementById("journeyDeparture")?.addEventListener("change", event => {
    const custom = document.getElementById("journeyCustomTime");
    if (custom) custom.hidden = event.target.value !== "custom";
  });
  document.getElementById("journeyBtn")?.addEventListener("click", analyseJourney);
}

function clearLocation(type) {
  const id = type === "start" ? "journeyStart" : "journeyDestination";
  if (type === "start") selectedStart = null; else selectedDestination = null;
  const input = document.getElementById(id);
  if (input) { input.value = ""; input.focus(); }
  showSuggestions(document.getElementById(`${id}Suggestions`), []);
  analysedRoutes = [];
  renderResultsIntoPage();
  setStatus("");
}

function handleLocationInput(event, type) {
  const input = event.target;
  if (type === "start") selectedStart = null; else selectedDestination = null;
  clearTimeout(searchTimer);
  const container = document.getElementById(`${input.id}Suggestions`);
  if (input.value.trim().length < 2) { showSuggestions(container, []); return; }
  searchTimer = setTimeout(async () => {
    try {
      const results = await searchPlaces(input.value);
      showSuggestions(container, results, place => {
        if (type === "start") selectedStart = place; else selectedDestination = place;
        input.value = place.label;
        showSuggestions(container, []);
        setStatus("");
      });
    } catch (error) {
      showSuggestions(container, []);
      setStatus(`Location search unavailable: ${error.message}`, "error");
    }
  }, 300);
}

function showSuggestions(container, places, onSelect) {
  if (!container) return;
  container.innerHTML = places.map((place, index) => `<button type="button" role="option" data-index="${index}"><strong>${escapeHtml(place.label)}</strong><span>${escapeHtml(place.address || "")}</span></button>`).join("");
  container.hidden = !places.length;
  container.querySelectorAll("button").forEach(button => button.addEventListener("click", () => onSelect(places[Number(button.dataset.index)])));
}

async function useCurrentLocation() {
  if (!navigator.geolocation) { setStatus("Current location is not supported by this browser. Enter a start location instead.", "error"); return; }
  setStatus("Requesting your current location…");
  navigator.geolocation.getCurrentPosition(async position => {
    try {
      selectedStart = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      const input = document.getElementById("journeyStart");
      if (input) input.value = selectedStart.label;
      setStatus("Current location selected.", "success");
    } catch (error) { setStatus(`Location found, but its address could not be loaded: ${error.message}`, "error"); }
  }, () => setStatus("Location permission was denied or unavailable. Enter your start location manually.", "error"), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}

async function analyseJourney() {
  if (!selectedStart || !selectedDestination) { setStatus("Select both locations from the suggestions before analysing the journey.", "error"); return; }
  const button = document.getElementById("journeyBtn");
  if (button) { button.disabled = true; button.textContent = "Analysing…"; }
  analysedRoutes = [];
  renderResultsIntoPage();
  setStatus("Calculating traffic-aware routes…");
  try {
    let routes = await calculateRoutes(selectedStart.position, selectedDestination.position, { departAt: departureTime(), maxAlternatives: 2 });
    if (!routes.length) throw new Error("TomTom did not return a route for these locations.");
    routes = await labelRoutesByMilestones(routes);
    let trafficIncidents = [];
    let routeWeatherById = {};
    const warnings = [];
    try { trafficIncidents = await trafficIncidentsForRoutes(routes); }
    catch (error) { warnings.push("Traffic incidents could not be refreshed."); }
    try {
      const weatherResults = await Promise.all(routes.map(route => fetchRouteWeather(route.points || [])));
      routeWeatherById = Object.fromEntries(routes.map((route, index) => [route.id, weatherResults[index]]));
    }
    catch (error) { warnings.push("Route weather could not be refreshed; the latest scheduled weather was used."); }
    analysedRoutes = analyseJourneyRoutes(routes, { trafficIncidents, routeWeatherById, environmental: state.environmental, alerts: state.alerts, incidents: state.incidents });
    setStatus(`${analysedRoutes.length} route${analysedRoutes.length === 1 ? "" : "s"} analysed with fresh traffic incidents and route weather.${warnings.length ? ` ${warnings.join(" ")}` : ""}`, warnings.length ? "warning" : "success");
    renderResultsIntoPage();
  } catch (error) {
    setStatus(`Journey analysis unavailable: ${error.message} No suitability score has been fabricated.`, "error");
  } finally {
    if (button) { button.disabled = false; button.textContent = "Analyse Journey"; }
  }
}

function departureTime() {
  const value = document.getElementById("journeyDeparture")?.value || "now";
  if (value === "now") return "now";
  if (value === "custom") {
    const custom = document.getElementById("journeyCustomTime")?.value;
    if (!custom || new Date(custom).getTime() <= Date.now()) throw new Error("Choose a future departure time.");
    return new Date(custom).toISOString();
  }
  return new Date(Date.now() + Number(value) * 60000).toISOString();
}

function renderResults() {
  if (!analysedRoutes.length) return "";
  return `<section class="card"><div class="section-kicker">Route Comparison</div><h2>${analysedRoutes.length} route${analysedRoutes.length === 1 ? "" : "s"} compared</h2><p class="small">Every route has a separate Journey Suitability Index.</p></section>${analysedRoutes.map(renderRoute).join("")}`;
}

function renderRoute(route) {
  const score = route.journeySuitability;
  const duration = Math.round(route.travelTimeSeconds / 60);
  const delay = Math.round(route.trafficDelaySeconds / 60);
  const distance = (route.distanceMeters / 1000).toFixed(1);
  const navigationUrl = buildNavigationUrl(route);
  return `<article class="card route-card ${route.recommended ? "recommended" : ""}">
    <div class="section-kicker">${route.recommended ? "Recommended" : `Route ${route.rank}`}</div>
    <h2>${escapeHtml(route.label)}</h2>
    ${(route.comparisonLabels || []).length ? `<div class="route-comparison-labels">${route.comparisonLabels.map(label => `<span>${escapeHtml(label)}</span>`).join("")}</div>` : ""}
    <div class="grid journey-metrics">
      <div class="metric"><strong>${score.score}/100</strong><span>Journey Suitability</span></div>
      <div class="metric"><strong>${escapeHtml(score.label)}</strong><span>Recommendation</span></div>
      <div class="metric"><strong>${duration} min</strong><span>Estimated travel time (with current traffic)</span></div>
      <div class="metric"><strong>${delay} min</strong><span>Traffic delay</span></div>
      <div class="metric"><strong>${distance} km</strong><span>Distance</span></div>
      <div class="metric"><strong>${route.routeTrafficIncidents.length}</strong><span>Route incidents</span></div>
    </div>
    <p><strong>${escapeHtml(score.recommendation)}</strong></p>
    <ul class="compact-list">${score.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
    <a class="primary-btn navigation-link" href="${escapeAttr(navigationUrl)}" target="_blank" rel="noopener">Navigate this route</a>
  </article>`;
}

function renderResultsIntoPage() { const results = document.getElementById("journeyResults"); if (results) results.innerHTML = renderResults(); }
function setStatus(message, kind = "info") { statusMessage = message; statusKind = kind; const element = document.getElementById("journeyStatus"); if (element) { element.textContent = message; element.className = `journey-status ${kind}`; } }
function buildNavigationUrl(route) {
  const params = new URLSearchParams({ api: "1", origin: `${route.start.lat},${route.start.lon}`, destination: `${route.destination.lat},${route.destination.lon}`, travelmode: "driving" });
  const points = route.points || [];
  if (points.length >= 4) {
    const waypoints = [0.25, 0.5, 0.75].map(fraction => points[Math.min(points.length - 2, Math.max(1, Math.floor(points.length * fraction)))]).map(point => `${point.latitude},${point.longitude}`);
    params.set("waypoints", waypoints.join("|"));
  }
  return `https://www.google.com/maps/dir/?${params}`;
}
