/* =========================================================
   SERVICE WORKER - Vibe Solar v3.2
   ========================================================= */

const CACHE_NAME = 'Vibe_Solar_v3.3.5'; // Incrementa v1, v2, v3 per forzare gli aggiornamenti
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
  // SE LA RICHIESTA È PER IL METEO, VAI DIRETTAMENTE SU INTERNET (NON TOCCARE CACHE)
  if (event.request.url.includes('api.open-meteo.com')) {
    return; // Questa riga dice al SW di non interferire con il meteo
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
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
    // 1. Creiamo l'elemento div
    const banner = document.createElement('div');
    
    // 2. Gli assegniamo la classe che hai appena scritto nel CSS
    banner.className = 'update-banner';
    
    // 3. Inseriamo il testo (puoi aggiungere un'emoji per renderlo più "Vibe")
    banner.innerHTML = `✨ Aggiornamento disponibile! Clicca qui 🚀`;
    
    // 4. Rendiamo il banner cliccabile per ricaricare la pagina
    banner.onclick = () => {
        window.location.reload();
    };

    // 5. Lo aggiungiamo al body
    document.body.appendChild(banner);
}
