import { state } from "./state.js";
import { renderAll } from "../ui/render-all.js";
import { escapeHtml } from "../utils/format.js";
import { canonicalLocality } from "../utils/locality.js";

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
  });

  taluka.addEventListener("change", () => {
    state.selected.taluka = taluka.value;
    localStorage.setItem("cea.taluka", taluka.value);
    state.selected.locality = "";
    localStorage.removeItem("cea.locality");
    refreshLocalities();
    updateLocationSummary();
    renderAll();
  });

  locality.addEventListener("change", () => {
    state.selected.locality = locality.value;
    localStorage.setItem("cea.locality", locality.value);
    updateLocationSummary();
    renderAll();
  });

  updateLocationSummary();
}

function updateLocationSummary() {
  const region = document.getElementById("regionSelect");
  const taluka = document.getElementById("talukaSelect");
  const locality = document.getElementById("localitySelect");
  const summary = document.getElementById("locationSummaryText");
  if (!summary) return;
  summary.textContent = `📍 ${region?.selectedOptions?.[0]?.textContent || "Region"} · ${taluka?.selectedOptions?.[0]?.textContent || "Taluka"} · ${locality?.selectedOptions?.[0]?.textContent || "All localities"}`;
}
