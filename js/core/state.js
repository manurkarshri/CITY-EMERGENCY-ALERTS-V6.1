import { loadJson } from "../services/api.js";
import { isCurrentEvent } from "../utils/freshness.js";
import { localityMatches } from "../utils/locality.js";

export const state = {
  selected: {
    region: localStorage.getItem("cea.region") || "pune_district",
    taluka: localStorage.getItem("cea.taluka") || "pune_city",
    locality: localStorage.getItem("cea.locality") || ""
  },
  intelligence: {},
  alerts: [],
  incidents: [],
  environmental: {},
  journey: { journeys: [] },
  live: {},
  build: {},
  sourceHealth: { sources: [] },
  regions: {},
  talukas: {},
  localitiesConfig: {},
  visitChanges: { firstVisit: true, baselineAt: null, items: [] }
};

const FILES = {
  intelligence: "data/intelligence.json",
  alerts: "data/alerts.json",
  incidents: "data/incidents.json",
  environmental: "data/environmental-context.json",
  journey: "data/journey-intelligence.json",
  live: "data/live-intelligence.json",
  build: "data/build-status.json",
  sourceHealth: "data/source-health.json",
  regions: "config/regions.config.json",
  talukas: "config/talukas.config.json",
  localities: "config/localities.config.json"
};

export async function loadAllData() {
  const [intelligence, alertsData, incidentsData, environmental, journey, live, build, sourceHealth, regions, talukas, localitiesConfig] = await Promise.all([
    loadJson(FILES.intelligence, {}),
    loadJson(FILES.alerts, { items: [] }),
    loadJson(FILES.incidents, { items: [] }),
    loadJson(FILES.environmental, {}),
    loadJson(FILES.journey, { journeys: [] }),
    loadJson(FILES.live, {}),
    loadJson(FILES.build, {}),
    loadJson(FILES.sourceHealth, { sources: [] }),
    loadJson(FILES.regions, {}),
    loadJson(FILES.talukas, {}),
    loadJson(FILES.localities, {})
  ]);
  state.intelligence = intelligence;
  state.alerts = sortEvents(alertsData.items || intelligence.alerts || []);
  state.incidents = sortEvents(incidentsData.items || intelligence.incidents || []);
  state.environmental = environmental;
  state.journey = journey;
  state.live = live;
  state.build = build;
  state.sourceHealth = sourceHealth;
  state.regions = regions;
  state.talukas = talukas;
  state.localitiesConfig = localitiesConfig;
}

export function filteredEvents(items) {
  const { taluka, locality } = state.selected;
  return sortEvents((items || []).filter(isCurrentEvent).filter(item => {
    const talukas = item.talukas || [];
    const localities = item.localities || [];
    const talukaMatch = !taluka || talukas.includes(taluka) || talukas.length === 0;
    const localityMatch = !locality || localities.some(item => localityMatches(item, locality, state.localitiesConfig)) || localities.length === 0;
    return talukaMatch && localityMatch;
  }));
}

export function relevantEvents(items) {
  const filtered = filteredEvents(items);
  return filtered.length ? filtered : sortEvents((items || []).filter(isCurrentEvent));
}

export function sortEvents(items) {
  const severityRank = { emergency: 4, warning: 3, watch: 2, advisory: 1 };
  return [...(items || [])].sort((a, b) => {
    const sev = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    if (sev) return sev;
    const conf = (b.confidenceScore || 0) - (a.confidenceScore || 0);
    if (conf) return conf;
    return new Date(b.lastUpdated || b.publishedAt || 0) - new Date(a.lastUpdated || a.publishedAt || 0);
  });
}
