import { state } from "./state.js";
import { renderAll } from "../ui/render-all.js";
import { escapeHtml } from "../utils/format.js";

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

  taluka.innerHTML = Object.entries(state.talukas || {}).map(([key, value]) => `<option value="${key}">${escapeHtml(value.label || key)}</option>`).join("");
  taluka.value = state.selected.taluka;

  function refreshLocalities() {
    const items = state.talukas?.[taluka.value]?.localities || [];
    locality.innerHTML = `<option value="">All localities</option>` + items.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("");
    if (items.includes(state.selected.locality)) locality.value = state.selected.locality;
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
