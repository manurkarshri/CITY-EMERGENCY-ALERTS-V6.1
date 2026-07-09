import { loadConfig } from "../lib/config.js";
import { normalizeText } from "../lib/text.js";

export async function discoverRoutes(start = "", destination = "") {
  const cfg = await loadConfig("route-corridors.config.json");
  const s = normalizeText(start);
  const d = normalizeText(destination);

  const matches = (cfg.corridors || []).filter(route => {
    const fromMatch = (route.fromAliases || []).some(x => s.includes(normalizeText(x)) || normalizeText(x).includes(s));
    const toMatch = (route.toAliases || []).some(x => d.includes(normalizeText(x)) || normalizeText(x).includes(d));
    return fromMatch && toMatch;
  });

  if (matches.length) return matches.map(toRoute);

  return [{
    id: `area-${s || "start"}-${d || "destination"}`.replace(/\s+/g, "-"),
    label: `${start || "Start"} to ${destination || "Destination"}`,
    routeType: "area-based",
    via: [start, destination].filter(Boolean),
    operationalZones: [],
    distanceKm: null,
    baseTimeMin: null,
    mapsQuery: `${start} to ${destination}`.trim()
  }];
}

function toRoute(route) {
  return { ...route, routeType: "known-corridor" };
}
