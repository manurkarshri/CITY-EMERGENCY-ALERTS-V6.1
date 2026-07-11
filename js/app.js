import { loadAllData } from "./core/state.js";
import { setupNavigation } from "./core/navigation.js";
import { setupLocationSelector } from "./core/location.js";
import { renderAll } from "./ui/render-all.js";
import { state } from "./core/state.js";
import { fetchLivePuneTrafficIncidents } from "./services/tomtom-traffic-live.js";

async function init() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(console.warn);
  await loadAllData();
  setupLocationSelector();
  setupNavigation();
  renderAll();
  void refreshLiveTraffic();
}
init();

async function refreshLiveTraffic() {
  const sourceId = "tomtom_traffic";
  try {
    const result = await fetchLivePuneTrafficIncidents();
    state.incidents = mergeTraffic(state.incidents, result.items);
    updateTrafficHealth({ id: sourceId, name: "TomTom Traffic Incidents", type: "incidents", status: "healthy", sourceCheckedAt: result.checkedAt, lastSuccessfulAt: result.checkedAt, error: null });
  } catch (error) {
    updateTrafficHealth({ id: sourceId, name: "TomTom Traffic Incidents", type: "incidents", status: "unavailable", sourceCheckedAt: new Date().toISOString(), lastSuccessfulAt: null, error: error.message });
  }
  renderAll();
}

function mergeTraffic(existing, traffic) {
  const withoutPrevious = (existing || []).filter(item => !String(item.id).startsWith("tomtom-traffic-"));
  return [...withoutPrevious, ...traffic].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index);
}
function updateTrafficHealth(source) {
  state.sourceHealth.sources = [...(state.sourceHealth.sources || []).filter(item => item.id !== source.id), source];
}
