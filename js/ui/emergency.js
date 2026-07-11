import { SAFETY_CHECKLISTS, checklistProgress, normalizeChecklistState, safetyChecklistKey } from "../utils/safety-checklists.js";

export function renderEmergency() {
  document.getElementById("tab-emergency").innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Immediate Help</div>
      <h2>Emergency Dial</h2>
      <div class="call-grid">
        <a class="call-btn emergency" href="tel:112">112<br><span class="small">Emergency</span></a>
        <a class="call-btn" href="tel:100">100<br><span class="small">Police</span></a>
        <a class="call-btn" href="tel:101">101<br><span class="small">Fire</span></a>
        <a class="call-btn" href="tel:108">108<br><span class="small">Ambulance</span></a>
      </div>
    </section>
    <section class="card">
      <h2>Nearby Emergency Services</h2>
      <div class="call-grid">
        <a class="call-btn" href="https://www.google.com/maps/search/hospital+near+me" target="_blank">Hospitals</a>
        <a class="call-btn" href="https://www.google.com/maps/search/police+station+near+me" target="_blank">Police Stations</a>
        <a class="call-btn" href="https://www.google.com/maps/search/fire+station+near+me" target="_blank">Fire Stations</a>
        <a class="call-btn" href="https://www.google.com/maps/search/disaster+management+office+near+me" target="_blank">Disaster Help</a>
      </div>
    </section>
    <section class="card">
      <h2>Share My Location</h2>
      <button class="primary-btn" id="shareLocationBtn">Share My Location</button>
      <p class="small">Your location is used only on your device for sharing. It is not stored on any server.</p>
    </section>
    <section class="card">
      <details class="safety-resources">
        <summary>Safety Resources</summary>
        <p class="small">Choose the situation and tick actions as you complete them. Progress stays only on this device.</p>
        <div class="safety-scenarios" role="group" aria-label="Choose an emergency safety checklist">
          ${SAFETY_CHECKLISTS.map((checklist, index) => `<button class="secondary-btn safety-scenario${index === 0 ? " active" : ""}" type="button" data-safety-scenario="${checklist.id}" aria-pressed="${index === 0}">${checklist.label}</button>`).join("")}
        </div>
        <div id="safetyChecklist" aria-live="polite"></div>
      </details>
    </section>
  `;
  document.getElementById("shareLocationBtn")?.addEventListener("click", shareLocation);
  bindSafetyChecklists();
}

function bindSafetyChecklists() {
  const container = document.getElementById("safetyChecklist");
  const buttons = [...document.querySelectorAll("[data-safety-scenario]")];
  if (!container || !buttons.length) return;

  const showChecklist = id => {
    const checklist = SAFETY_CHECKLISTS.find(item => item.id === id) || SAFETY_CHECKLISTS[0];
    const selected = readChecklistState(checklist);
    buttons.forEach(button => {
      const active = button.dataset.safetyScenario === checklist.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    container.innerHTML = `
      <div class="safety-checklist-heading"><h3>${checklist.label}</h3><span class="small" id="safetyProgress">${checklistProgress(selected, checklist.items.length)} completed</span></div>
      <ul class="safety-checklist">
        ${checklist.items.map((item, index) => `<li><label><input type="checkbox" data-safety-item="${index}" ${selected.includes(index) ? "checked" : ""}><span>${item}</span></label></li>`).join("")}
      </ul>
      <button class="secondary-btn safety-reset" type="button" ${selected.length ? "" : "disabled"}>Clear this checklist</button>
    `;
    container.querySelectorAll("[data-safety-item]").forEach(input => input.addEventListener("change", () => {
      const checked = [...container.querySelectorAll("[data-safety-item]:checked")].map(item => Number(item.dataset.safetyItem));
      saveChecklistState(checklist, checked);
      showChecklist(checklist.id);
    }));
    container.querySelector(".safety-reset")?.addEventListener("click", () => {
      saveChecklistState(checklist, []);
      showChecklist(checklist.id);
    });
  };

  buttons.forEach(button => button.addEventListener("click", () => showChecklist(button.dataset.safetyScenario)));
  showChecklist(SAFETY_CHECKLISTS[0].id);
}

function readChecklistState(checklist) {
  try {
    return normalizeChecklistState(JSON.parse(localStorage.getItem(safetyChecklistKey(checklist.id)) || "[]"), checklist.items.length);
  } catch {
    return [];
  }
}

function saveChecklistState(checklist, selected) {
  try {
    localStorage.setItem(safetyChecklistKey(checklist.id), JSON.stringify(normalizeChecklistState(selected, checklist.items.length)));
  } catch {
    // The checklist remains usable for this visit if browser storage is unavailable.
  }
}

function shareLocation() {
  if (!navigator.geolocation) { alert("Location sharing is not supported."); return; }
  navigator.geolocation.getCurrentPosition(async position => {
    const text = `My location: https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
    if (navigator.share) await navigator.share({ title: "My Location", text });
    else { await navigator.clipboard.writeText(text); alert("Location copied to clipboard."); }
  }, () => alert("Unable to access location. Please allow location permission."));
}
