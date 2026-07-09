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
