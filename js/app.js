import { loadAllData } from "./core/state.js";
import { setupNavigation } from "./core/navigation.js";
import { setupLocationSelector } from "./core/location.js";
import { renderAll } from "./ui/render-all.js";

async function init() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(console.warn);
  await loadAllData();
  setupLocationSelector();
  setupNavigation();
  renderAll();
}
init();
