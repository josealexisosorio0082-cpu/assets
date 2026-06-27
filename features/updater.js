/**
 * Slip Game - Slip Nexus Core (Updater & Retention Engine)
 * @author Alexis Osorio
 * @version 1.7.0 [BLINDAJE DEFINITIVO]
 */

const COMMITS_URL = "https://api.github.com/repos/josealexisosorio0082-cpu/Slip_Game/commits?per_page=1";

const Updater = {
    isUpdateFound: false,
    isChecking: false,

    init: function() {
        console.log("[Updater] Iniciando Slip Nexus Core (GitHub Engine)...");
        this.injectStyles();
        this.checkUpdates();
        NotificationEngine.init();

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.handleReentry();
            }
        });
    },

    handleReentry: function() {
        if (this.isUpdateFound || this.isChecking) return;
        this.showStatusToast("SINCRONIZANDO NÚCLEO...");
        setTimeout(() => this.checkUpdates(true), 2000);
    },

    checkUpdates: async function(isBackground = false) {
        if (this.isChecking) return;

        // DETECCIÓN DE ENTORNO LOCAL (NAVEGADOR PC)
        // El navegador bloquea peticiones de file:// a GitHub por CORS
        if (!window.AndroidBridge && !location.protocol.startsWith('http')) {
            console.log("[Updater] Entorno de navegador local detectado. Omitiendo verificación de GitHub (CORS).");
            return;
        }

        this.isChecking = true;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn("[Updater] Tiempo de espera agotado (Timeout).");
            controller.abort();
        }, 10000); // Aumentado a 10 segundos para mayor fiabilidad

        try {
            const localTimestamp = parseInt(localStorage.getItem("LAST_DEPLOY_TIMESTAMP") || "0");

            // ELIMINACIÓN DE CACHÉ DE PETICIÓN (ANTI-STALLING)
            const antiCacheUrl = `${COMMITS_URL}&_nocache=${Date.now()}`;

            console.log(`[Updater] Verificando: ${antiCacheUrl}`);

            // Si no hay bridge, estamos en navegador y podría fallar por CORS
            const response = await fetch(antiCacheUrl, {
                headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
                signal: controller.signal
            }).catch(err => {
                if (!window.AndroidBridge) throw new Error("BLOQUEO DE NAVEGADOR (CORS)");
                throw err;
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 403) {
                    const resetTime = response.headers.get('x-ratelimit-reset');
                    const waitMin = resetTime ? Math.ceil((new Date(resetTime * 1000) - Date.now()) / 60000) : '60';
                    throw new Error(`Límite de GitHub alcanzado. Reintenta en ${waitMin} min.`);
                }
                throw new Error(`Error de Servidor: ${response.status}`);
            }

            const data = await response.json();
            if (!data || data.length === 0) {
                console.warn("[Updater] No se recibieron datos del repositorio.");
                return;
            }

            const remoteDate = data[0].commit.committer.date;
            const commitMessage = data[0].commit.message;

            // CONVERSIÓN DE FECHAS A NÚMEROS (PARSEO OBLIGATORIO)
            const remoteTimestamp = new Date(remoteDate).getTime();

            // CONSOLE.LOGS DE DIAGNÓSTICO
            console.log(`[Nexus Debug] Local TS: ${localTimestamp} | Remote TS: ${remoteTimestamp}`);

            // COMPARACIÓN NUMÉRICA IMPERMEABLE
            if (remoteTimestamp > localTimestamp) {
                console.log("[Updater] Nueva implementación detectada en el repositorio.");
                this.isUpdateFound = true;

                // NOTIFICACIÓN NATIVA (SI ESTÁ EN SEGUNDO PLANO O APPBRIDGE DISPONIBLE)
                if (window.AndroidBridge && window.AndroidBridge.sendLocalNotification) {
                    window.AndroidBridge.sendLocalNotification(
                        "⚠️ ACTUALIZACIÓN DISPONIBLE",
                        "Nueva versión crítica detectada. Toca para instalar mejoras ahora."
                    );
                }

                this.showUpdateModal(remoteTimestamp, commitMessage);
            } else {
                console.log("[Updater] El sistema ya está en la última versión.");
            }
        } catch (error) {
            console.error("[Updater] Error detallado:", error.message);

            let userMsg = "ERROR DE CONEXIÓN";
            if (error.name === 'AbortError') {
                userMsg = "TIEMPO AGOTADO (RED LENTA)";
            } else if (error.message.includes("Límite")) {
                userMsg = error.message.toUpperCase();
            } else if (error.message.includes("Error de Servidor")) {
                userMsg = "GITHUB OFFLINE O ERROR 500";
            } else if (error.message === "Failed to fetch" || error.message.includes("network")) {
                userMsg = "SIN ACCESO A INTERNET";
            } else {
                userMsg = `FALLO: ${error.message.toUpperCase()}`;
            }

            // Notificación visual específica
            if (!isBackground) {
                this.showStatusToast(userMsg);
            }
        } finally {
            this.isChecking = false;
        }
    },

    showUpdateModal: function(remoteTimestamp, message) {
        if (window.Engine) {
            window.Engine.isPaused = true;
            // Detener el loop visual si es posible
            if (window.canvas) window.canvas.style.pointerEvents = 'none';
        }

        if (document.getElementById('updateOverlay')) return;

        const modal = document.createElement('div');
        modal.id = 'updateOverlay';
        modal.className = 'cyber-modal-full';

        const dateObj = new Date(remoteTimestamp);
        const displayDate = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();

        modal.innerHTML = `
            <div class="cyber-content">
                <div class="glitch-header" data-text="ACTUALIZACIÓN CRÍTICA">ACTUALIZACIÓN CRÍTICA</div>
                <div class="sub-header">// DEPLOY_DATE: ${displayDate}</div>
                <div class="changelog-container">
                    <div class="changelog-title">NEXUS_STREAM_DATA</div>
                    <ul class="changelog-list">
                        <li>${message}</li>
                    </ul>
                </div>
                <div class="action-row">
                    <button id="btnInstallUpdate" class="cyber-btn primary">INSTALAR MEJORAS</button>
                    <button id="btnAbortUpdate" class="cyber-btn danger">SALIR</button>
                </div>
            </div>
        `;

        // ASEGURAR QUE NADA MÁS SE PUEDA TOCAR
        modal.onclick = (e) => e.stopPropagation();

        document.body.appendChild(modal);

        document.getElementById('btnInstallUpdate').onclick = () => {
            localStorage.setItem("LAST_DEPLOY_TIMESTAMP", remoteTimestamp);
            // Si estamos en la app nativa, esto recargará el asset
            window.location.reload(true);
        };

        document.getElementById('btnAbortUpdate').onclick = () => {
            if (window.AndroidBridge && window.AndroidBridge.exitApp) {
                window.AndroidBridge.exitApp();
            } else if (navigator.app && navigator.app.exitApp) {
                navigator.app.exitApp();
            } else {
                window.close();
            }
        };
    },

    showStatusToast: function(text) {
        const existing = document.querySelector('.update-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'update-toast status-sync';
        toast.innerHTML = `<div class="toast-text">${text}</div>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }, 50);
    },

    injectStyles: function() {
        if (document.getElementById('updater-styles')) return;
        const style = document.createElement('style');
        style.id = 'updater-styles';
        style.textContent = `
            .cyber-modal-full { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 10, 18, 0.98); backdrop-filter: blur(25px); z-index: 1000000; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
            .cyber-content { width: 85%; max-width: 450px; padding: 35px; border: 2px solid #8b5cf6; box-shadow: 0 0 60px rgba(139, 92, 246, 0.4); background: #0a0a12; text-align: center; }
            .glitch-header { font-size: 1.5rem; font-weight: 950; color: #fff; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 5px; text-shadow: 2px 0 #ff0055, -2px 0 #00fff2; }
            .sub-header { font-size: 0.7rem; color: #8b5cf6; font-weight: 900; margin-bottom: 25px; opacity: 0.8; }
            .changelog-container { background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); padding: 20px; text-align: left; margin-bottom: 25px; }
            .changelog-title { font-size: 0.6rem; color: #8b5cf6; font-weight: 900; margin-bottom: 10px; opacity: 0.6; letter-spacing: 2px; }
            .changelog-list { list-style: none; padding: 0; margin: 0; }
            .changelog-list li { font-size: 0.8rem; color: #e2e8f0; margin-bottom: 8px; padding-left: 15px; position: relative; }
            .changelog-list li::before { content: '>'; position: absolute; left: 0; color: #8b5cf6; }
            .action-row { display: flex; gap: 15px; }
            .cyber-btn { flex: 1; padding: 15px; border: none; font-weight: 950; text-transform: uppercase; cursor: pointer; border-radius: 4px; font-size: 0.75rem; transition: 0.3s; }
            .cyber-btn.primary { background: #8b5cf6; color: #fff; box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
            .cyber-btn.danger { background: transparent; color: #ef4444; border: 1px solid #ef4444; }
            .update-toast { position: fixed; top: -100px; left: 50%; transform: translateX(-50%); background: rgba(10, 10, 18, 0.95); border: 2px solid #8b5cf6; padding: 15px 30px; border-radius: 12px; z-index: 1000001; transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
            .update-toast.show { top: 30px; }
            .toast-text { color: #fff; font-weight: 950; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; text-align: center; }
        `;
        document.head.appendChild(style);
    }
};

/**
 * MOTOR DE NOTIFICACIONES LOCALES (PRESERVADO)
 */
const NotificationEngine = {
    inactivityTimers: [],

    init: function() {
        if (!("Notification" in window)) return;

        try {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        } catch (e) { console.error("Error pidiendo permisos:", e); }

        this.startBackgroundThread();
        this.setupRetentionListeners();
    },

    startBackgroundThread: function() {
        // Verificación de cofre cada minuto
        setInterval(() => {
            this.checkChestStatus();
        }, 60000);

        // Verificación de actualizaciones cada 15 minutos en segundo plano si es posible
        setInterval(() => {
            Updater.checkUpdates(true);
        }, 900000);
    },

    checkChestStatus: function() {
        try {
            const nextChest = parseInt(localStorage.getItem("NEXT_CHEST_TIME") || 0);
            if (nextChest > 0 && Date.now() >= nextChest) {
                if (localStorage.getItem("CHEST_NOTIFIED") !== "true") {
                    this.dispatch(
                        "🎁 [CONEXIÓN ESTABLE] // COFRE DE DATOS LISTO",
                        "Tu recompensa gratuita de Slip Coins ha sido regenerada. Entra a reclamarla, Overlord."
                    );
                    localStorage.setItem("CHEST_NOTIFIED", "true");
                }
            }
        } catch (e) {}
    },

    setupRetentionListeners: function() {
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                const retentionAlerts = [
                    {
                        t: 600000,
                        title: "📡 [SEÑAL ENTRANTE] // INTRUSIÓN EN TU SECTOR",
                        msg: "Varios usuarios acaban de entrar a tu zona de extracción. Regresa antes de que limpien el servidor y se lleven tus Slip Coins."
                    },
                    {
                        t: 7200000,
                        title: "🔋 [NEXUS CORE] // CONEXIÓN RESTABLECIDA",
                        msg: "La actividad en el servidor está al máximo. Hay rivales reclamando el top del ranking ahora mismo, Overlord. Entra a reclamar lo tuyo."
                    },
                    {
                        t: 28800000,
                        title: "⚠️ [ALERTA DE RANGO] // AMENAZA DE DERROTA",
                        msg: "Tu posición en el servidor está siendo comprometida por usuarios de élite. Regresa a la batalla y defiende tu estatus."
                    }
                ];

                retentionAlerts.forEach(alert => {
                    this.inactivityTimers.push(setTimeout(() => {
                        this.dispatch(alert.title, alert.msg);
                    }, alert.t));
                });
            } else {
                this.inactivityTimers.forEach(timer => clearTimeout(timer));
                this.inactivityTimers = [];
                localStorage.removeItem("CHEST_NOTIFIED");
            }
        });
    },

    dispatch: function(title, message) {
        if (document.visibilityState === "visible") {
            const toastMsg = title.includes("COFRE") ? "¡COFRE DE ÉLITE DISPONIBLE EN EL MENÚ!" : message;
            Updater.showStatusToast(toastMsg);

            if (window.AudioManager && window.AudioManager.playSplit) {
                window.AudioManager.playSplit();
            }
        } else {
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification(title, {
                        body: message,
                        icon: 'ui/images/skins gratis/Free (1).png'
                    });
                } catch (e) {
                    console.warn("Fallo al disparar notificación nativa:", e);
                }
            }
        }
    }
};

window.Updater = Updater;
window.NotificationEngine = NotificationEngine;

if (document.readyState === "complete" || document.readyState === "interactive") {
    Updater.init();
} else {
    window.addEventListener("DOMContentLoaded", () => Updater.init());
}
