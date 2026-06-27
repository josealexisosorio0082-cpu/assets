/**
 * Slip Game - Slip Nexus Core (Updater & Retention Engine)
 * @author Alexis Osorio
 * @version 1.8.0 [BLINDAJE Y EXPERIENCIA PREMIUM]
 */

const COMMITS_URL = "https://api.github.com/repos/josealexisosorio0082-cpu/assets/commits?per_page=1";

const Updater = {
    isUpdateFound: false,
    isChecking: false,

    init: function() {
        console.log("[Updater] Iniciando Slip Nexus Core...");
        this.injectStyles();

        // Verificar si acabamos de actualizar para mostrar el pop-up de éxito
        if (localStorage.getItem("JUST_UPDATED") === "true") {
            this.showSuccessPopup();
            localStorage.removeItem("JUST_UPDATED");
        }

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
        this.checkUpdates(true);
    },

    checkUpdates: async function(isBackground = false) {
        if (this.isChecking) return;

        // Omitir en navegador PC local por CORS (a menos que usemos un proxy, pero para este caso no es necesario)
        if (!window.AndroidBridge && !location.protocol.startsWith('http')) {
            return;
        }

        this.isChecking = true;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
            const localSHA = localStorage.getItem("LAST_DEPLOY_SHA") || "initial";
            const antiCacheUrl = `${COMMITS_URL}&_nocache=${Date.now()}`;

            const response = await fetch(antiCacheUrl, {
                headers: {
                    "Cache-Control": "no-cache",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "SlipGame-App"
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`GitHub Status: ${response.status}`);

            const data = await response.json();
            if (!data || data.length === 0) return;

            const remoteSHA = data[0].sha;
            const commitMessage = data[0].commit.message;

            console.log(`[Updater] Local SHA: ${localSHA.substring(0,7)} | Remote SHA: ${remoteSHA.substring(0,7)}`);

            if (remoteSHA !== localSHA) {
                this.isUpdateFound = true;

                if (window.AndroidBridge && window.AndroidBridge.sendLocalNotification) {
                    window.AndroidBridge.sendLocalNotification("Actualización Disponible", "Toca para aplicar las nuevas mejoras.");
                }

                this.showUpdateModal(remoteSHA, commitMessage);
            }
        } catch (error) {
            console.error("[Updater] Error:", error.message);
        } finally {
            this.isChecking = false;
        }
    },

    showUpdateModal: function(remoteSHA, message) {
        if (document.getElementById('updateOverlay')) return;

        const modal = document.createElement('div');
        modal.id = 'updateOverlay';
        modal.className = 'cyber-modal-full';

        const cleanMessage = message.replace(/\[!\]/g, '').replace(/mandatory/gi, '').trim() || "Mejoras de rendimiento y estabilidad.";

        modal.innerHTML = `
            <div class="cyber-content">
                <div class="update-header">NUEVA VERSIÓN</div>
                <div class="changelog-container">
                    <div class="changelog-title">NOTAS DEL PARCHE</div>
                    <ul class="changelog-list">
                        <li>${cleanMessage}</li>
                    </ul>
                </div>
                <div class="action-row">
                    <button id="btnInstallUpdate" class="cyber-btn primary">ACTUALIZAR</button>
                    <button id="btnLaterUpdate" class="cyber-btn danger">LUEGO</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btnInstallUpdate').onclick = () => {
            localStorage.setItem("LAST_DEPLOY_SHA", remoteSHA);
            localStorage.setItem("JUST_UPDATED", "true");

            // Limpiar caché de WebView si es posible (se complementa con el cambio en Java)
            window.location.reload(true);
        };

        document.getElementById('btnLaterUpdate').onclick = () => {
            modal.remove();
        };
    },

    showSuccessPopup: function() {
        const popup = document.createElement('div');
        popup.className = 'success-popup-modern';
        popup.innerHTML = `
            <div class="success-icon">✓</div>
            <div class="success-text">Actualización Exitosa</div>
            <div class="success-bar"></div>
        `;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 2500);
    },

    injectStyles: function() {
        if (document.getElementById('updater-styles')) return;
        const style = document.createElement('style');
        style.id = 'updater-styles';
        style.textContent = `
            .cyber-modal-full { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 5, 10, 0.9); backdrop-filter: blur(10px); z-index: 10000; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
            .cyber-content { width: 80%; max-width: 350px; padding: 25px; border: 2px solid #8b5cf6; border-radius: 20px; background: #0a0a12; text-align: center; box-shadow: 0 0 30px rgba(139, 92, 246, 0.4); }
            .update-header { font-size: 1.2rem; font-weight: 950; color: #fff; margin-bottom: 20px; letter-spacing: 1px; }
            .changelog-container { background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 12px; text-align: left; margin-bottom: 20px; border: 1px solid rgba(139, 92, 246, 0.2); }
            .changelog-title { font-size: 0.6rem; color: #8b5cf6; font-weight: 900; margin-bottom: 5px; opacity: 0.8; }
            .changelog-list { list-style: none; padding: 0; margin: 0; color: #cbd5e1; font-size: 0.75rem; line-height: 1.4; }
            .cyber-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; transition: 0.2s; font-size: 0.75rem; }
            .cyber-btn.primary { background: #8b5cf6; color: #fff; margin-bottom: 8px; }
            .cyber-btn.danger { background: transparent; color: #64748b; }

            .success-popup-modern {
                position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
                background: #0f172a; border: 2px solid #22c55e; padding: 12px 25px;
                border-radius: 50px; display: flex; align-items: center; gap: 12px;
                z-index: 20000; box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(34, 197, 94, 0.3);
                animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
            }
            .success-icon { background: #22c55e; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; }
            .success-text { color: #fff; font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
            .success-bar { position: absolute; bottom: 0; left: 0; height: 3px; background: #22c55e; width: 100%; animation: shrinkBar 2.5s linear forwards; }

            @keyframes slideDown { from { top: -100px; opacity: 0; } to { top: 30px; opacity: 1; } }
            @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
            .fade-out { opacity: 0; transition: 0.5s; pointer-events: none; }
        `;
        document.head.appendChild(style);
    }
};

const NotificationEngine = {
    init: function() {
        // Mantenemos la lógica existente de notificaciones pero simplificada
        setInterval(() => this.checkChestStatus(), 60000);
    },
    checkChestStatus: function() {
        const nextChest = parseInt(localStorage.getItem("NEXT_CHEST_TIME") || 0);
        if (nextChest > 0 && Date.now() >= nextChest) {
            if (localStorage.getItem("CHEST_NOTIFIED") !== "true") {
                if (window.AndroidBridge && window.AndroidBridge.sendLocalNotification) {
                    window.AndroidBridge.sendLocalNotification("🎁 Recompensa Lista", "Tu cofre diario te está esperando.");
                }
                localStorage.setItem("CHEST_NOTIFIED", "true");
            }
        }
    }
};

Updater.init();
