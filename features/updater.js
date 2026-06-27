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
            setTimeout(() => {
                this.showSuccessPopup();
                localStorage.removeItem("JUST_UPDATED");
            }, 2500);
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
            <div class="cyber-content animate-in">
                <div class="update-header neon-text">${window.Localization ? window.Localization.get('update_available') : 'NUEVA ACTUALIZACIÓN DISPONIBLE'}</div>
                <div class="changelog-container">
                    <div class="changelog-title">SISTEMA NEXUS - CAMBIOS</div>
                    <ul class="changelog-list">
                        <li><span style="color: #8b5cf6; margin-right: 5px;">•</span> ${cleanMessage}</li>
                    </ul>
                </div>
                <div class="action-row">
                    <button id="btnInstallUpdate" class="cyber-btn primary neon-glow">${window.Localization ? window.Localization.get('buy') : 'ACTUALIZAR'}</button>
                    <button id="btnLaterUpdate" class="cyber-btn danger">${window.Localization ? window.Localization.get('cancel') : 'OMITIR'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btnInstallUpdate').onclick = async () => {
            const content = modal.querySelector('.cyber-content');
            content.classList.add('updating');
            content.innerHTML = `
                <div class="update-header neon-text">${window.Localization ? window.Localization.get('installing_update') : 'INSTALANDO NÚCLEO...'}</div>
                <div class="neon-loader-container">
                    <div id="updateProgressBar" class="neon-loader-fill"></div>
                </div>
                <div id="updateStatusText" class="loader-status">INICIANDO DESCARGA...</div>
            `;

            try {
                await this.downloadAndApplyUpdate(remoteSHA);
                localStorage.setItem("LAST_DEPLOY_SHA", remoteSHA);
                localStorage.setItem("JUST_UPDATED", "true");
                setTimeout(() => window.location.reload(true), 1000);
            } catch (e) {
                console.error("[Updater] Error instalando:", e);
                document.getElementById('updateStatusText').innerText = "ERROR EN DESCARGA";
                document.getElementById('updateStatusText').style.color = "#ef4444";
                setTimeout(() => modal.remove(), 3000);
            }
        };

        document.getElementById('btnLaterUpdate').onclick = () => {
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 500);
        };
    },

    downloadAndApplyUpdate: async function(sha) {
        if (!window.AndroidBridge || !window.AndroidBridge.savePatchFile) {
            console.warn("[Updater] Bridge nativo no disponible para parches.");
            return;
        }

        const statusText = document.getElementById('updateStatusText');
        const progressBar = document.getElementById('updateProgressBar');

        // 1. Obtener la lista de archivos del commit
        // Usamos el tree recursivo del commit para obtener TODO el estado actual
        const treeUrl = `https://api.github.com/repos/josealexisosorio0082-cpu/assets/git/trees/${sha}?recursive=1`;
        const response = await fetch(treeUrl);
        const data = await response.json();

        if (!data.tree) throw new Error("No se pudo obtener el árbol de archivos");

        // 2. Filtrar solo archivos (no directorios) y que sean parte del juego
        const files = data.tree.filter(item => item.type === "blob");
        const total = files.length;
        let downloaded = 0;

        for (const file of files) {
            try {
                statusText.innerText = `DESCARGANDO: ${file.path.split('/').pop()}`;

                // Descargar contenido
                const fileUrl = `https://raw.githubusercontent.com/josealexisosorio0082-cpu/assets/${sha}/${file.path}`;
                const fileRes = await fetch(fileUrl);
                const content = await fileRes.text();

                // Guardar en el dispositivo
                window.AndroidBridge.savePatchFile(file.path, content);

                downloaded++;
                const percent = (downloaded / total) * 100;
                if (progressBar) progressBar.style.width = percent + '%';
            } catch (e) {
                console.warn(`[Updater] Error descargando ${file.path}:`, e);
            }
        }

        statusText.innerText = "SINCRONIZACIÓN COMPLETADA";
    },

    showSuccessPopup: function() {
        const popup = document.createElement('div');
        popup.className = 'success-popup-modern neon-border';
        popup.innerHTML = `
            <div class="success-icon">✓</div>
            <div class="success-text">${window.Localization ? window.Localization.get('update_installed') : 'Actualización Instalada'}</div>
            <div class="success-bar"></div>
        `;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 3000);
    },

    injectStyles: function() {
        if (document.getElementById('updater-styles')) return;
        const style = document.createElement('style');
        style.id = 'updater-styles';
        style.textContent = `
            .cyber-modal-full { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(2, 2, 5, 0.95); backdrop-filter: blur(15px); z-index: 10000; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
            .cyber-content { width: 85%; max-width: 380px; padding: 30px; border: 2px solid #8b5cf6; border-radius: 24px; background: #07070c; text-align: center; box-shadow: 0 0 50px rgba(139, 92, 246, 0.3); position: relative; overflow: hidden; }
            .cyber-content::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, transparent, #8b5cf6, transparent); animation: scanLine 2s linear infinite; }

            .animate-in { animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes scanLine { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

            .update-header { font-size: 1.1rem; font-weight: 950; color: #fff; margin-bottom: 25px; letter-spacing: 1.5px; line-height: 1.2; }
            .neon-text { text-shadow: 0 0 15px rgba(139, 92, 246, 0.8); }

            .changelog-container { background: rgba(139, 92, 246, 0.05); padding: 18px; border-radius: 16px; text-align: left; margin-bottom: 25px; border: 1px solid rgba(139, 92, 246, 0.15); }
            .changelog-title { font-size: 0.65rem; color: #8b5cf6; font-weight: 950; margin-bottom: 10px; opacity: 0.9; letter-spacing: 2px; }
            .changelog-list { list-style: none; padding: 0; margin: 0; color: #94a3b8; font-size: 0.8rem; line-height: 1.5; font-weight: 600; }

            .cyber-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-weight: 950; cursor: pointer; transition: 0.3s; font-size: 0.8rem; letter-spacing: 1px; }
            .cyber-btn.primary { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; margin-bottom: 10px; }
            .cyber-btn.neon-glow { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
            .cyber-btn.primary:active { transform: scale(0.96); box-shadow: 0 0 10px rgba(139, 92, 246, 0.8); }
            .cyber-btn.danger { background: transparent; color: #475569; }
            .cyber-btn.danger:hover { color: #94a3b8; }

            /* Loader Animado */
            .neon-loader-container { width: 100%; height: 8px; background: rgba(0,0,0,0.5); border-radius: 10px; overflow: hidden; margin: 20px 0; border: 1px solid rgba(139, 92, 246, 0.2); }
            .neon-loader-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #ec4899, #8b5cf6); box-shadow: 0 0 15px #8b5cf6; animation: fillProgress 3s forwards linear; }
            @keyframes fillProgress { to { width: 100%; } }
            .loader-status { font-size: 0.6rem; font-weight: 900; color: #8b5cf6; text-transform: uppercase; letter-spacing: 3px; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

            .success-popup-modern {
                position: fixed; top: 40px; left: 50%; transform: translateX(-50%);
                background: #07070c; padding: 14px 28px;
                border-radius: 50px; display: flex; align-items: center; gap: 14px;
                z-index: 20000; box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                animation: slideDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
            }
            .success-popup-modern.neon-border { border: 2px solid #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
            .success-icon { background: #22c55e; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; box-shadow: 0 0 10px #22c55e; }
            .success-text { color: #fff; font-weight: 950; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.5px; text-shadow: 0 0 10px rgba(255,255,255,0.2); }
            .success-bar { position: absolute; bottom: 0; left: 0; height: 3px; background: #22c55e; width: 100%; animation: shrinkBar 3s linear forwards; }

            @keyframes slideDown { from { top: -100px; transform: translateX(-50%) scale(0.5); opacity: 0; } to { top: 40px; transform: translateX(-50%) scale(1); opacity: 1; } }
            @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
            .fade-out { opacity: 0; transform: translateX(-50%) scale(0.9) !important; transition: 0.5s; pointer-events: none; }
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
