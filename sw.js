/* =========================================================
   SERVICE WORKER - Vibe Solar v3.2
   ========================================================= */

const CACHE_NAME = 'Vibe_Solar_v3.3.4'; // Incrementa v1, v2, v3 per forzare gli aggiornamenti
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

// --- GESTIONE AGGIORNAMENTO APP (BANNER) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                // Quando il nuovo SW è installato ma in attesa
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    mostraBannerAggiornamento();
                }
            });
        });
    });
}

function mostraBannerAggiornamento() {
    // Creiamo il banner dinamicamente via JS per non toccare l'HTML
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
        <div style="background: var(--accento); color: #0f172a; padding: 15px; position: fixed; bottom: 85px; left: 5%; width: 90%; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10001; animation: slideUp 0.5s ease-out;">
            <span style="font-weight: 800; font-size: 14px;">✨ NUOVA VERSIONE DISPONIBILE!</span>
            <button onclick="window.location.reload()" style="background: #0f172a; color: white; border: none; padding: 8px 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">AGGIORNA</button>
        </div>
    `;
    document.body.appendChild(banner);
}
