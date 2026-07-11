export function setupNavigation() {
  document.querySelectorAll(".tabs button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(`tab-${button.dataset.tab}`).classList.add("active");
    });
  });
}

export function openTab(tab, eventId = "") {
  const button = document.querySelector(`.tabs button[data-tab="${tab}"]`);
  const panel = document.getElementById(`tab-${tab}`);
  if (!button || !panel) return false;
  document.querySelectorAll(".tabs button").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  panel.classList.add("active");
  if (eventId) {
    const card = document.getElementById(`event-${eventId}`);
    if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.focus({ preventScroll: true }); }
  }
  return true;
}
