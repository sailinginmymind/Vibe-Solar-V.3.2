/* =========================================================
   SERVICE WORKER - Vibe Solar v3.2
   ========================================================= */

const CACHE_NAME = 'Vibe_Solar_v3.3.1'; // Incrementa v1, v2, v3 per forzare gli aggiornamenti
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

// 1. INSTALLAZIONE: Salva i file nella cache
self.addEventListener('install', (event) => {
  // Forza l'attivazione immediata del nuovo Service Worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Archiviazione asset in cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ATTIVAZIONE: Elimina le vecchie cache inutilizzate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Eliminazione vecchia cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Prende il controllo immediato delle pagine aperte
  return self.clients.claim();
});

// 3. FETCH: Serve i file dalla cache o da internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se il file è in cache, lo restituisce; altrimenti lo scarica
      return response || fetch(event.request);
    })
  );
});
