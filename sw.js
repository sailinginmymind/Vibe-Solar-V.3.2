/* =========================================================
   SERVICE WORKER - Vibe Solar v3.3.5
   ========================================================= */

const CACHE_NAME = 'Vibe_Solar_v3.3.5'; 
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './solar-engine.js',
  './weather-api.js',
  './manifest.json',
  './Assets/Images/LOGO192x192(1).png',
  './Assets/Images/LOGO512x512(1).png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // ECCEZIONI: Non gestire il meteo e non gestire la geocodifica (Nominatim)
  if (event.request.url.includes('api.open-meteo.com') || 
      event.request.url.includes('nominatim.openstreetmap.org')) {
    return; // Lascia che la richiesta vada diretta su internet senza passare dal SW
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
