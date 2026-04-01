/* =========================================================
   ACCESS.JS - Gestione Sicurezza e Registro Accessi
   ========================================================= */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbz8CLRiXPgxaOBSAhUNPKBxQ0bplQbmVGAx5irCW-wDruhuKv04lcqimO9nJ2qQjazL/exec";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Controllo sessione esistente (localStorage O sessionStorage)
    const isLocalValid = localStorage.getItem('vibe_auth_valid') === 'true';
    const isSessionValid = sessionStorage.getItem('vibe_auth_valid') === 'true';

    if (isLocalValid || isSessionValid) {
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
    const errore = document.getElementById('lockError');
    const info = getDeviceInfo();
    
    // Recuperiamo lo stato della checkbox
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!user || !pass) return;

    btn.innerText = "VERIFICA IN CORSO...";
    btn.disabled = true;

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
            if (rememberMe) {
                // OPZIONE PERSISTENTE: Salva nel localStorage
                localStorage.setItem('vibe_auth_valid', 'true');
                localStorage.setItem('utente_corrente', user);
            } else {
                // OPZIONE TEMPORANEA: Salva nel sessionStorage
                sessionStorage.setItem('vibe_auth_valid', 'true');
                sessionStorage.setItem('utente_corrente', user);
                
                // Pulizia di sicurezza
                localStorage.removeItem('vibe_auth_valid');
            }
            inizializzaProfilo();
            // Nascondiamo il lockscreen
            document.getElementById('lockScreen').style.display = 'none';
        } else {
            errore.style.display = 'block';
            btn.innerText = "ENTRA NEL GARAGE";
            btn.disabled = false;
        }
    } catch (e) {
        console.error("Errore:", e);
        alert("Errore di connessione al database.");
        btn.disabled = false;
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
                // Cancella tutti i dati di sessione
                localStorage.removeItem('vibe_auth_valid');
                localStorage.removeItem('utente_corrente');
                sessionStorage.removeItem('vibe_auth_valid');
                sessionStorage.removeItem('utente_corrente');
                
                // Ricarica la pagina per tornare al login
                location.reload();
            }
        };
    }
}
