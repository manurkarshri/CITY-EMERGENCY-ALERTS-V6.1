import { state } from "./state.js";
import { renderAll } from "../ui/render-all.js";
import { escapeHtml } from "../utils/format.js";
import { canonicalLocality } from "../utils/locality.js";
import { searchPlaces, tomTomConfigured } from "../services/tomtom.js";
import { fetchLocationWeather } from "../services/open-meteo-live.js";

export function setupLocationSelector() {
  const region = document.getElementById("regionSelect");
  const taluka = document.getElementById("talukaSelect");
  const locality = document.getElementById("localitySelect");
  const toggle = document.getElementById("locationToggle");
  const fields = document.getElementById("locationFields");
  if (!region || !taluka || !locality || !toggle || !fields) return;

  fields.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  const change = document.querySelector(".location-change");
  if (change) change.textContent = "Change";

  region.innerHTML = Object.entries(state.regions || {}).map(([key, value]) => `<option value="${key}">${escapeHtml(value.label || key)}</option>`).join("");
  region.value = state.selected.region;

  function refreshTalukas() {
    const entries = region.value === "pune_city" ? [["pune_city", state.talukas.pune_city]]
      : region.value === "pcmc" ? [["pcmc", state.talukas.pcmc]]
      : Object.entries(state.talukas || {});
    taluka.innerHTML = entries.filter(([, value]) => value).map(([key, value]) => `<option value="${key}">${escapeHtml(value.label || key)}</option>`).join("");
    if (!entries.some(([key]) => key === state.selected.taluka)) state.selected.taluka = entries[0]?.[0] || "";
    taluka.value = state.selected.taluka;
  }

  refreshTalukas();

  function refreshLocalities() {
    const items = state.talukas?.[taluka.value]?.localities || [];
    locality.innerHTML = `<option value="">All localities</option>` + items.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("");
    const canonical = canonicalLocality(state.selected.locality, state.localitiesConfig);
    if (items.includes(canonical)) {
      locality.value = canonical;
      state.selected.locality = canonical;
      localStorage.setItem("cea.locality", canonical);
    } else if (state.selected.locality) {
      state.selected.locality = "";
      localStorage.removeItem("cea.locality");
    }
  }

  refreshLocalities();

  toggle.addEventListener("click", () => {
    const open = fields.hidden;
    fields.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    const change = document.querySelector(".location-change");
    if (change) change.textContent = open ? "Done" : "Change";
  });

  region.addEventListener("change", () => {
    state.selected.region = region.value;
    localStorage.setItem("cea.region", region.value);
    refreshTalukas();
    localStorage.setItem("cea.taluka", state.selected.taluka);
    state.selected.locality = "";
    localStorage.removeItem("cea.locality");
    refreshLocalities();
    updateLocationSummary();
    renderAll();
    void refreshWeatherForSelection();
  });

  taluka.addEventListener("change", () => {
    state.selected.taluka = taluka.value;
    localStorage.setItem("cea.taluka", taluka.value);
    state.selected.locality = "";
    localStorage.removeItem("cea.locality");
    refreshLocalities();
    updateLocationSummary();
    renderAll();
    void refreshWeatherForSelection();
  });

  locality.addEventListener("change", () => {
    state.selected.locality = locality.value;
    localStorage.setItem("cea.locality", locality.value);
    updateLocationSummary();
    renderAll();
    void refreshWeatherForSelection();
  });

  updateLocationSummary();
  void refreshWeatherForSelection();
}

async function refreshWeatherForSelection() {
  const selectionKey = `${state.selected.region}|${state.selected.taluka}|${state.selected.locality}`;
  const targetKey = state.selected.taluka || state.selected.region;
  const label = state.selected.locality || state.talukas?.[state.selected.taluka]?.label || state.regions?.[state.selected.region]?.label || "Pune";
  try {
    const existing = state.environmental?.weatherIntelligence?.regions?.[targetKey];
    let position = Number.isFinite(Number(existing?.latitude)) ? { lat: existing.latitude, lon: existing.longitude } : null;
    if (state.selected.locality || !position) {
      if (!tomTomConfigured()) return;
      const place = (await searchPlaces(`${label}, Pune, Maharashtra`, { limit: 1 }))[0];
      position = place?.position || null;
    }
    if (!position) return;
    const weather = await fetchLocationWeather(position, label);
    if (selectionKey !== `${state.selected.region}|${state.selected.taluka}|${state.selected.locality}`) return;
    state.environmental.weatherIntelligence ||= { regions: {} };
    state.environmental.weatherIntelligence.regions ||= {};
    state.environmental.weatherIntelligence.regions[targetKey] = weather;
    state.environmental.weatherSource = {
      status: "current", sourceCheckedAt: weather.sourceCheckedAt, lastSuccessfulAt: weather.sourceCheckedAt,
      staleAfterMinutes: 60, attribution: { name: "Open-Meteo", url: "https://open-meteo.com/" }, error: null
    };
    renderAll();
  } catch (error) {
    console.warn("Selected-location weather refresh failed", error);
  }
}

function updateLocationSummary() {
  const region = document.getElementById("regionSelect");
  const taluka = document.getElementById("talukaSelect");
  const locality = document.getElementById("localitySelect");
  const summary = document.getElementById("locationSummaryText");
  if (!summary) return;
  summary.textContent = `📍 ${region?.selectedOptions?.[0]?.textContent || "Region"} · ${taluka?.selectedOptions?.[0]?.textContent || "Taluka"} · ${locality?.selectedOptions?.[0]?.textContent || "All localities"}`;
}
