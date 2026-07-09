const CACHE = "city-emergency-alerts-v6-1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/layout.css",
  "./css/cards.css",
  "./css/forms.css",
  "./css/responsive.css",
  "./js/app.js",
  "./data/intelligence.json",
  "./data/alerts.json",
  "./data/incidents.json",
  "./data/environmental-context.json",
  "./data/journey-intelligence.json",
  "./data/live-intelligence.json",
  "./data/build-status.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match("./index.html"))));
});
