/**
 * WEATHER-API.JS - Vibe Solar v3.0 (Versione Corretta)
 */

window.timezoneOffsetSeconds = null;

// Variabile di controllo per evitare chiamate API multiple contemporanee
let isFetchingWeather = false;

const WeatherAPI = {

    /**
     * Richiede le coordinate GPS al browser.
     * Aumentato il timeout e aggiunta gestione errori più robusta.
     */
    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject({ code: 0, message: 'GPS non supportato dal browser' });
                return;
            }
            const options = {
                enableHighAccuracy: false,
                timeout:            20000, // Aumentato a 20 secondi per evitare il "Timeout expired"
                maximumAge:         30000, // Accetta una posizione vecchia di 30 secondi per velocizzare
            };
            navigator.geolocation.getCurrentPosition(
                pos  => resolve(pos.coords),
                err  => {
                    console.warn('Errore GPS:', err.message);
                    reject(err);
                },
                options
            );
        });
    },

    /**
     * Recupera le previsioni meteo da Open-Meteo.
     * Include protezione contro richieste multiple e gestione errori di rete.
     */
    async fetchForecast(lat, lng, date, updateInputs = false) {
        // 1. Protezione anti-loop: se c'è già una chiamata in corso, esci subito
        if (isFetchingWeather) {
            console.warn("Chiamata meteo già in corso. Richiesta ignorata per evitare blocchi IP.");
            return null;
        }

        // Verifica che le coordinate siano valide (evita TypeError: Failed to fetch)
        if (!lat || !lng) {
            console.error("Coordinate non valide fornite all'API");
            return null;
        }

        isFetchingWeather = true;

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
             `&hourly=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,shortwave_radiation` + 
             `&daily=sunrise,sunset` +
             `&timezone=auto` +
             `&start_date=${date}&end_date=${date}`;
            
            console.log("Richiesta API Meteo:", url);

            const response = await fetch(url);
            
            if (!response.ok) {
                // Se il server risponde con errore (es. Too many requests)
                const errorData = await response.json();
                throw new Error(errorData.reason || "Errore Server");
            }

            const data = await response.json();

            if (data.utc_offset_seconds !== undefined) {
                window.timezoneOffsetSeconds = data.utc_offset_seconds;
                if (updateInputs) {
                    updateDashboardClock(true);
                }
            }

            return data;

        } catch (err) {
            console.error('Errore API Meteo (Open-Meteo):', err.message);
            // Se vedi "Too many concurrent requests", questo alert ti avvisa
            if (err.message.includes("concurrent")) {
                alert("Troppe richieste al server meteo. Attendi 1 minuto e riprova.");
            }
            return null;
        } finally {
            // Sblocca la possibilità di fare nuove chiamate dopo 2 secondi
            setTimeout(() => { isFetchingWeather = false; }, 2000);
        }
    }
};

/**
 * Gestione Orologio e fuso orario
 */
function updateDashboardClock(forza = false) {
    const clockElement = document.getElementById('display-hour-center');
    const inputTime    = document.getElementById('input-time');
    const inputDate    = document.getElementById('input-date');
    if (!clockElement) return;

    const oraLocale = new Date();
    let timeToUse   = oraLocale;

    if (window.timezoneOffsetSeconds !== null) {
        const utcTimeMs = oraLocale.getTime() + (oraLocale.getTimezoneOffset() * 60000);
        timeToUse = new Date(utcTimeMs + (window.timezoneOffsetSeconds * 1000));
    }

    const h = timeToUse.getHours().toString().padStart(2, '0');
    const m = timeToUse.getMinutes().toString().padStart(2, '0');

    clockElement.innerText = `${h}:${m}`;

    if (forza || (inputTime && !inputTime.value)) {
        if (inputTime) inputTime.value = `${h}:${m}`;
    }

    if (forza || (inputDate && !inputDate.value)) {
        if (inputDate) {
            const yyyy = timeToUse.getFullYear();
            const mm   = (timeToUse.getMonth() + 1).toString().padStart(2, '0');
            const dd   = timeToUse.getDate().toString().padStart(2, '0');
            inputDate.value = `${yyyy}-${mm}-${dd}`;
        }
    }
}
