/* =========================================================
   ACCESS.JS - Gestione Sicurezza e Registro Accessi
   ========================================================= */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbyUuvEa54vMsoT_BGXiwiVor4s6Sw1EjSktSwjUVyJ5etMiAGYIUoZhFvIGZaT9pBRL/exec";

document.addEventListener('DOMContentLoaded', async () => {
    const isLocalValid = localStorage.getItem('vibe_auth_valid') === 'true';
    const isSessionValid = sessionStorage.getItem('vibe_auth_valid') === 'true';

    if (isLocalValid || isSessionValid) {
        // Scarica i dati prima di nascondere la schermata di blocco
        await sincronizzaDatiGarage(); 
        document.getElementById('lockScreen').style.display = 'none';
        inizializzaProfilo();
    }

    // 2. Event Listener per il tasto login
    const btn = document.getElementById('btnUnlock');
    if (btn) btn.addEventListener('click', validaAccesso);

    // 3. Permetti l'invio anche con il tasto "Invio" sulla tastiera
    const inputs = [document.getElementById('userInput'), document.getElementById('passInput')];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') validaAccesso();
            });
        }
    });
});

// Funzione per estrarre info tecniche dal browser
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = "Sconosciuto";
    let device = "Computer";

    if (/mobile/i.test(ua)) device = "Smartphone";
    if (/tablet/i.test(ua)) device = "Tablet";

    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Browser";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    return { device, browser };
}

async function validaAccesso() {
    const user = document.getElementById('userInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();
    const btn = document.getElementById('btnUnlock');
    const erroreP = document.getElementById('lockError');
    const lockBox = document.querySelector('#lockScreen > div'); // Il contenitore bianco/scuro centrale
    const info = getDeviceInfo();
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!user || !pass) {
        mostraMessaggioErrore("Inserisci Username e Password");
        return;
    }

    // --- AVVIO CARICAMENTO ---
    btn.innerText = "VERIFICA IN CORSO... 🔄";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.cursor = "not-allowed";
    erroreP.style.display = 'none';

    try {
        const response = await fetch(URL_SCRIPT_GOOGLE, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'login', 
                username: user, 
                password: pass,
                device: info.device,
                browser: info.browser
            })
        });
        
        const result = await response.json();

        if (result.success) {
            // Gestione Sessione
            if (rememberMe) {
                localStorage.setItem('vibe_auth_valid', 'true');
                localStorage.setItem('utente_corrente', user);
            } else {
                sessionStorage.setItem('vibe_auth_valid', 'true');
                sessionStorage.setItem('utente_corrente', user);
                localStorage.removeItem('vibe_auth_valid');
            }
            await sincronizzaDatiGarage();
            inizializzaProfilo();
            document.getElementById('lockScreen').style.display = 'none';
        } else {
            // --- GESTIONE ERRORI SPECIFICI ---
            let messaggio = "❌ Credenziali errate";
            if (result.errorType === "password_errata") messaggio = "🔑 Password errata";
            if (result.errorType === "utente_non_trovato") messaggio = "👤 Utente non trovato";
            
            mostraMessaggioErrore(messaggio);
        }
    } catch (e) {
        console.error("Errore:", e);
        mostraMessaggioErrore("🌐 Problema di connessione al database");
    } finally {
        // Ripristino pulsante solo se il login non è andato a buon fine
        if (document.getElementById('lockScreen').style.display !== 'none') {
            btn.innerText = "ENTRA NEL GARAGE";
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    }

    // Funzione interna per gestire l'estetica dell'errore
    function mostraMessaggioErrore(msg) {
        erroreP.innerText = msg;
        erroreP.style.display = 'block';
        
        // Animazione Shake (vibrazione)
        if (lockBox) {
            lockBox.style.animation = 'none';
            lockBox.offsetHeight; // Trigger reflow
            lockBox.style.animation = 'shake 0.4s ease-in-out';
        }
    }
}

/* =========================================================
   GESTIONE PROFILO E LOGOUT
   ========================================================= */

function inizializzaProfilo() {
    // Recupera il nome dell'utente loggato (da localStorage o sessionStorage)
    const nome = localStorage.getItem('utente_corrente') || sessionStorage.getItem('utente_corrente') || "Camperista";
    
    // 1. Aggiorna il Nome e l'Iniziale nell'interfaccia
    const displayNome = document.getElementById('displayUserName');
    const displayAvatar = document.getElementById('userAvatar');
    
    if (displayNome) displayNome.innerText = nome;
    if (displayAvatar) displayAvatar.innerText = nome.charAt(0).toUpperCase();

  // 2. Configura il tasto Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.onclick = () => {
            if (confirm("Vuoi uscire dal Garage di Vibe Solar?")) {
                // --- PULIZIA TOTALE SESSIONE ---
                localStorage.removeItem('vibe_auth_valid');
                localStorage.removeItem('utente_corrente');
                sessionStorage.removeItem('vibe_auth_valid');
                sessionStorage.removeItem('utente_corrente');

                // --- PULIZIA DATI TECNICI CAMPER (Il "Deep Clean") ---
                localStorage.removeItem('vibe_camper_name');
                localStorage.removeItem('vibe_batt_ah');
                localStorage.removeItem('vibe_panel_wp');
                localStorage.removeItem('vibe_ps_ah'); // O vibe_ps_wh a seconda di come lo salvi
                localStorage.removeItem('vibe_ps_wh');
                localStorage.removeItem('vibe_panel_ps_wp');
                localStorage.removeItem('vibe_panel_tilt');
                
                // Ricarica la pagina per resettare lo stato Javascript e tornare al login
                location.reload();
            }
        };
    }
}
