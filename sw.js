const CACHE = "city-emergency-alerts-v6-1-20260713-15";
const APP_SHELL = [
  "./", "./index.html", "./manifest.json", "./config/runtime-config.js",
  "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png", "./assets/icons/favicon-32.png",
  "./css/base.css", "./css/layout.css", "./css/cards.css", "./css/forms.css", "./css/responsive.css",
  "./js/app.js", "./js/core/location.js", "./js/core/navigation.js", "./js/core/state.js", "./js/core/visit-history.js", "./js/core/connectivity.js",
  "./js/intelligence/alert-monitoring.js", "./js/intelligence/incident-presentation.js", "./js/intelligence/incident-relevance.js", "./js/intelligence/journey-analysis.js",
  "./js/services/api.js", "./js/services/open-meteo-live.js", "./js/services/tomtom.js", "./js/services/tomtom-traffic-live.js",
  "./js/ui/alerts.js", "./js/ui/emergency.js", "./js/ui/events.js", "./js/ui/incidents.js", "./js/ui/journey.js", "./js/ui/official.js", "./js/ui/render-all.js", "./js/ui/situation.js",
  "./js/utils/format.js", "./js/utils/freshness.js", "./js/utils/locality.js", "./js/utils/safety-checklists.js",
  "./data/intelligence.json", "./data/alerts.json", "./data/incidents.json", "./data/environmental-context.json", "./data/journey-intelligence.json", "./data/live-intelligence.json", "./data/build-status.json", "./data/source-health.json",
  "./config/regions.config.json", "./config/talukas.config.json", "./config/localities.config.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("city-emergency-alerts-") && key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const cacheRequest = normalizedRequest(request);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) await cache.put(cacheRequest, response.clone());
    return response;
  } catch {
    const cached = await cache.match(cacheRequest);
    if (cached) return cached;
    if (request.mode === "navigate") return (await cache.match("./index.html")) || (await cache.match("./"));
    return Response.error();
  }
}

function normalizedRequest(request) {
  const url = new URL(request.url);
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}
