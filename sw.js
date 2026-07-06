// sw.js — Service Worker for Tabletop PWA
// Strategy: cache-first for the app shell (HTML, icons),
// network-first for BGG API calls (we always want fresh game data).
//
// Why a service worker at all?
// Android only shows the "Add to Home Screen" install prompt if the site
// has a registered service worker. Without it, the PWA install prompt
// never appears regardless of whether you have a manifest.
//
// The CACHE_NAME version string is important: when you update the app,
// bump this string and the old cache gets deleted and replaced.
// If you don't bump it, users may get a stale cached version of index.html.

const CACHE_NAME = 'tabletop-v1';

// Files to cache immediately when the SW installs.
// These are the minimum needed to load the app offline.
const PRECACHE = [
  '/boardgames/',
  '/boardgames/index.html',
  '/boardgames/icons/icon-192.png',
  '/boardgames/icons/icon-512.png',
  '/boardgames/manifest.json',
];

// Install: precache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  // Take control immediately rather than waiting for old SW to be gone
  self.skipWaiting();
});

// Activate: delete old caches from previous versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch: cache-first for same-origin assets, network-only for BGG API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // BGG API and external resources — always go to the network.
  // Caching BGG responses would serve stale game data.
  if (url.hostname !== self.location.hostname) {
    return; // let the browser handle it normally
  }

  // Same-origin requests — cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Cache a clone (responses can only be consumed once)
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});
