const HUD = {
    isLeaderboardVisible: true, // Visible por defecto
    announcementTimer: null,

    init() {
        const toggle = document.getElementById('leaderboardToggle');
        // ... (resto del init)

        if (toggle) {
            // Usar touchstart para respuesta inmediata en móviles
            const handleToggle = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isLeaderboardVisible = !this.isLeaderboardVisible;
                this.updateLeaderboardVisibility();
            };

            toggle.addEventListener('touchstart', handleToggle, { passive: false });
            toggle.addEventListener('mousedown', handleToggle);
        }
    },

    updateLeaderboardVisibility() {
        const lb = document.getElementById('leaderboard');
        const toggle = document.getElementById('leaderboardToggle');

        if (lb && toggle) {
            const playing = Player.isPlaying();
            if (!playing) {
                lb.style.display = 'none';
                toggle.style.display = 'none';
                return;
            }

            toggle.style.display = 'flex';
            toggle.style.opacity = this.isLeaderboardVisible ? '1' : '0.6';

            if (this.isLeaderboardVisible) {
                lb.style.display = 'block';
            } else {
                lb.style.display = 'none';
            }
        }
    },

    renderScore() {
        const scoreEl = document.getElementById('scoreDisplay');
        if (!Player.isPlaying() || !scoreEl) return;
        const mass = Math.floor(Player.getMass());
        scoreEl.innerText = mass;

        // MÓDULO 3: Text-shadow neón que coincide con el color de la célula
        const playerColor = Player.cells[0] ? Player.cells[0].color : '#38bdf8';
        scoreEl.style.textShadow = `0 0 15px ${playerColor}`;
    },

    render() {
        const gameplayUI = document.getElementById('gameplayUI');
        const hudTop = document.getElementById('hudTopGroup');

        if (Player.isPlaying()) {
            if (gameplayUI) {
                gameplayUI.style.display = 'block';
                gameplayUI.style.pointerEvents = 'none'; // Importante para que el joystick/botones funcionen
            }
            if (hudTop) hudTop.style.display = 'none';
            this.renderScore();
            this.updateLeaderboardVisibility();
            Leaderboard.render();
        } else {
            if (gameplayUI) gameplayUI.style.display = 'none';
            // El HUD superior se maneja desde Menu.switchState para menús
        }
    },

    announceKill(streak) {
        let msg = "";
        let xp = 0;
        let color = "#fff";

        if (streak === 2) { msg = "¡DOBLE BAJA! 🔥"; xp = 10; color = "#f87171"; }
        else if (streak === 3) { msg = "¡TRIPLE BAJA! ⚡"; xp = 15; color = "#fbbf24"; }
        else if (streak === 5) { msg = "¡RACHA DE MUERTES! ⚡"; xp = 25; color = "#22c55e"; }
        else if (streak >= 10) { msg = "¡¡IMPARABLE!! 👑"; xp = 50; color = "#a855f7"; }
        else return;

        const container = document.getElementById('killAnnouncer');
        if (!container) return;

        container.innerHTML = `<div class="announcement" style="color: ${color}; text-shadow: 0 0 20px ${color}66;">
            ${msg}<br><small>+${xp} XP EXTRA</small>
        </div>`;
        container.classList.remove('hidden');

        if (this.announcementTimer) clearTimeout(this.announcementTimer);
        this.announcementTimer = setTimeout(() => {
            container.classList.add('hidden');
        }, 3000);

        if (window.Engine) {
            window.Engine.progression.slipXP += xp;
            window.Engine.saveProgression();
        }
    }
};

window.HUD = HUD;
