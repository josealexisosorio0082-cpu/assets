window.canvas = document.getElementById("gameCanvas");
if (!window.canvas) {
    console.warn("Canvas no encontrado, creando uno temporal...");
    window.canvas = document.createElement('canvas');
}
const canvas = window.canvas;
window.ctx = canvas.getContext("2d");
const ctx = window.ctx;

function resizeCanvas() {
    if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const quality = localStorage.getItem('game_quality') || 'high';
        // En calidad baja, podemos reducir el DPR para mejorar rendimiento en pantallas de alta resolución
        const activeDpr = quality === 'low' ? Math.min(1.5, dpr) : dpr;

        canvas.width = width * activeDpr;
        canvas.height = height * activeDpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        if (window.ctx) {
            window.ctx.setTransform(activeDpr, 0, 0, activeDpr, 0, 0);
            window.ctx.imageSmoothingEnabled = quality !== 'low';
            window.ctx.imageSmoothingQuality = quality === 'very_high' ? 'high' : 'medium';
        }
    }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

window.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 };
window.camera = { x: 2500, y: 2500, zoom: 1 };

var Engine = {
    isPaused: false,
    isStarted: false,
    startTime: 0,
    lastTime: 0,
    missions: [],
    leaderboardTimer: 0,
    quality: localStorage.getItem('game_quality') || 'high',
    controlMode: localStorage.getItem('slip_control_mode') || (('ontouchstart' in window) ? 'touch' : 'pc'),

    start: function() {
        console.log("Iniciando motor del juego...");
        this.isPaused = false;
        this.startTime = Date.now();

        // Incrementar total de partidas
        let totalGames = parseInt(localStorage.getItem('slip_total_games') || 0);
        localStorage.setItem('slip_total_games', totalGames + 1);

        // MÓDULO 4: Inicialización segura de estado
        this.initEconomy();

        if (this.isStarted) {
            this.resetPlayArea();
        } else {
            this.isStarted = true;
            HUD.init();
            Food.generate();
            Bots.generate(50);
            Virus.generate(15);
            Player.startGame();
            this.updateControlUI();

            // Iniciar el loop solo si no está ya corriendo
            gameLoop();
        }

        const ui = document.getElementById('gameplayUI');
        if (ui) {
            ui.style.display = 'block';
            ui.style.opacity = '1';
            ui.style.pointerEvents = 'none';
        }

        if (window.canvas) {
            window.canvas.style.display = 'block';
            window.canvas.style.zIndex = '1';
            window.canvas.style.pointerEvents = 'auto';
            resizeCanvas();
        }

        // Asegurar que la cámara esté sobre el jugador inmediatamente
        const center = Player.getCenter();
        window.camera.x = center.x - window.innerWidth / 2;
        window.camera.y = center.y - window.innerHeight / 2;
    },

    resetPlayArea() {
        // MÓDULO 4: REINICIO TOTAL DE ESTADO (Clean Slate)
        Player.cells = [];
        Player.isDead = false;
        Player.maxMass = 0;
        Player.killStreak = 0;

        Bots.items = [];
        Food.items = [];
        Virus.items = [];

        if (window.VisualEffects) {
            window.VisualEffects.particles = [];
            window.VisualEffects.victims = [];
            window.VisualEffects.shockwaves = [];
            window.VisualEffects.shakeDuration = 0;
        }

        Food.generate();
        Bots.generate(50);
        Virus.generate(15);

        Player.startGame();
        this.startTime = Date.now();
        this.lastTime = performance.now();

        if (window.Menu) window.Menu.updateMenuUI();
    },

    togglePause() {
        if (!Player.isPlaying()) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            window.Menu.switchState(window.Menu.STATES.PAUSA);
        } else {
            this.lastTime = performance.now();
            window.Menu.switchState(window.Menu.STATES.JUEGO);
        }
    },

    initEconomy() {
        this.loadProgression();
        if (window.Menu) window.Menu.updateMenuUI();
        this.checkDailyReward();
        this.generateMissions();
        this.setupReminders();
    },

    loadProgression() {
        try {
            const saved = localStorage.getItem('slip_progression_v2');
            if (saved) {
                this.progression = JSON.parse(saved);
            } else {
                this.progression = { rankPoints: 0, slipXP: 0, passLevel: 1, claimedRewards: [] };
            }
        } catch (e) {
            this.progression = { rankPoints: 0, slipXP: 0, passLevel: 1, claimedRewards: [] };
        }
        window.progression = this.progression;
    },

    saveProgression() {
        localStorage.setItem('slip_progression_v2', JSON.stringify(this.progression));
        window.progression = this.progression;
        if (window.Menu) window.Menu.updateMenuUI();
    },

    updateCoinDisplay() {
        if (window.Menu) window.Menu.updateShopCurrencies();
    },

    setControlMode(mode) {
        this.controlMode = mode;
        localStorage.setItem('slip_control_mode', mode);
        this.updateControlUI();
    },

    updateControlUI() {
        const touchUI = document.getElementById('touchControls');
        if (touchUI) {
            touchUI.style.display = (this.controlMode === 'touch') ? 'block' : 'none';
        }

        const cBtns = document.querySelectorAll('.c-btn');
        cBtns.forEach(btn => {
            if (btn.getAttribute('data-control') === this.controlMode) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    },

    checkDailyReward(manual = false) {
        let userId = 'guest';
        try {
            const userData = localStorage.getItem('slip_user_data');
            if (userData && userData !== "undefined") {
                const parsed = JSON.parse(userData);
                if (parsed && parsed.id) userId = parsed.id;
            }
        } catch (e) {}

        let lastClaim = null;
        try {
            lastClaim = localStorage.getItem(`lastClaimDate_${userId}`);
        } catch (e) {}

        const today = new Date().toDateString();

        if (lastClaim === today) {
            if (!manual) return;
            // Si ya reclamó y es manual, mostramos el estado de ya reclamado
            if (window.Menu) window.Menu.switchState('ESTADO_REGALO');
            const box = document.getElementById('chestBox');
            if (box) {
                box.style.display = 'none';
                document.getElementById('rewardClaimedArea').style.display = 'block';
                document.getElementById('rewardIcon').innerText = "✅";
                document.getElementById('rewardIcon').style.fontSize = '4rem';
                document.getElementById('rewardText').innerText = "YA RECLAMADO";
                document.getElementById('chestTitle').innerText = "¡HASTA MAÑANA!";
                document.getElementById('chestInstruction').innerText = "Vuelve en 24 horas";
            }
            return;
        }

        if (window.Menu) {
            window.Menu.switchState('ESTADO_REGALO');
        } else {
            const chest = document.getElementById('dailyChest');
            if (chest) {
                chest.style.display = 'flex';
                setTimeout(() => chest.classList.add('is-open'), 10);
            }
        }

        const box = document.getElementById('chestBox');
        if (box) {
            box.style.display = 'block';
            box.style.transform = "scale(1)";
            document.getElementById('rewardClaimedArea').style.display = 'none';
            document.getElementById('chestTitle').innerText = "¡REGALO DIARIO!";
            document.getElementById('chestInstruction').innerText = "Toca para reclamar";

            box.onclick = () => {
                box.style.transform = "scale(0)";
                setTimeout(() => {
                    box.style.display = 'none';
                    document.getElementById('rewardClaimedArea').style.display = 'block';

                    // --- LÓGICA DE RECOMPENSA VARIADA ---
                    const rand = Math.random() * 100;
                    let rewardIcon = '💰';
                    let rewardText = '';
                    let isSkin = false;

                    if (rand < 2) { // 2% PROBABILIDAD SKIN PREMIUM
                        const premiumSkins = (window.Menu && window.Menu.skins) ? Object.values(window.Menu.skins).filter(s => s.price > 0) : [];
                        if (premiumSkins.length > 0) {
                            const skin = premiumSkins[Math.floor(Math.random() * premiumSkins.length)];
                            rewardIcon = `<img src="${skin.url}" style="width:110px; height:110px; border-radius:50%; border:5px solid #facc15; box-shadow: 0 0 20px rgba(250,204,21,0.5);">`;
                            rewardText = skin.name;
                            isSkin = true;

                            // Entregar Skin
                            let purchased = [];
                            try {
                                const savedP = localStorage.getItem(`purchasedSkins_${userId}`);
                                if (savedP && savedP !== "undefined") purchased = JSON.parse(savedP);
                            } catch(e) {}

                            if (!purchased.includes(skin.id)) {
                                purchased.push(skin.id);
                                localStorage.setItem(`purchasedSkins_${userId}`, JSON.stringify(purchased));
                            }
                        } else { // Fallback si no hay skins cargadas aún
                            const coins = Math.floor(Math.random() * 3) + 1; // 1-3 Monedas
                            rewardIcon = '💰';
                            rewardText = `+${coins} SLIP COIN${coins > 1 ? 'S' : ''}`;
                            this.addCoins(coins);
                        }
                    } else if (rand < 32) { // 30% PROBABILIDAD ADN
                        const dna = Math.floor(Math.random() * 4) + 2; // 2-5 ADN
                        rewardIcon = '🧬';
                        rewardText = `+${dna} ADN`;
                        this.addDna(dna);
                    } else { // 68% PROBABILIDAD MONEDAS
                        const coins = Math.floor(Math.random() * 3) + 1; // 1-3 Monedas
                        rewardIcon = '💰';
                        rewardText = `+${coins} SLIP COIN${coins > 1 ? 'S' : ''}`;
                        this.addCoins(coins);
                    }

                    const iconEl = document.getElementById('rewardIcon');
                    iconEl.innerHTML = rewardIcon;
                    iconEl.style.fontSize = isSkin ? '1rem' : '4rem';

                    document.getElementById('rewardText').innerText = rewardText;
                    document.getElementById('chestTitle').innerText = "¡RECOMPENSA!";
                    document.getElementById('chestInstruction').innerText = "Vuelve mañana";

                    localStorage.setItem(`lastClaimDate_${userId}`, today);

                    if (window.AndroidBridge) {
                        window.AndroidBridge.sendLocalNotification("¡Regalo Reclamado!", `Has obtenido: ${rewardText}`);
                    }

                    setTimeout(() => {
                        if (window.Menu) window.Menu.switchState(window.Menu.STATES.MENU);
                    }, 3000);
                }, 300);
            };
        }
    },

    setupReminders() {
        setInterval(() => {
            if (window.AndroidBridge) {
                window.AndroidBridge.sendLocalNotification("¿Listo para jugar?", "Tus rivales te están esperando en el mapa.");
            }
        }, 1000 * 60 * 60 * 5);
    },

    setQuality(level) {
        this.quality = level;
        localStorage.setItem('game_quality', level);
        if (!window.CONFIG) window.CONFIG = {};
        if (!window.CONFIG.visuals) window.CONFIG.visuals = {};
        window.CONFIG.quality = level;

        if (level === 'low') {
            window.CONFIG.visualEffects.maxParticles = 5; // Mínimo absoluto
            window.CONFIG.visualEffects.organicPoints = 0;
            window.CONFIG.visuals.shadowBlur = 0;
            window.CONFIG.visuals.renderBorders = true;
            window.CONFIG.visuals.gridOpacity = 0.01;
            window.CONFIG.visuals.glowEffect = false;
            // Forzar desactivación de sombras en contexto
            if (window.ctx) {
                window.ctx.shadowBlur = 0;
                window.ctx.shadowColor = "transparent";
            }
        } else if (level === 'medium') {
            window.CONFIG.visualEffects.maxParticles = 40;
            window.CONFIG.visualEffects.organicPoints = 12;
            window.CONFIG.visuals.shadowBlur = 5;
            window.CONFIG.visuals.renderBorders = true;
            window.CONFIG.visuals.gridOpacity = 0.04;
            window.CONFIG.visuals.glowEffect = false;
        } else if (level === 'high') {
            window.CONFIG.visualEffects.maxParticles = 100;
            window.CONFIG.visualEffects.organicPoints = 24;
            window.CONFIG.visuals.shadowBlur = 15;
            window.CONFIG.visuals.renderBorders = true;
            window.CONFIG.visuals.gridOpacity = 0.07;
            window.CONFIG.visuals.glowEffect = false;
        } else if (level === 'very_high') {
            window.CONFIG.visualEffects.maxParticles = 200;
            window.CONFIG.visualEffects.organicPoints = 40;
            window.CONFIG.visuals.shadowBlur = 25;
            window.CONFIG.visuals.renderBorders = true;
            window.CONFIG.visuals.gridOpacity = 0.12;
            window.CONFIG.visuals.glowEffect = true;
        }

        // Aplicar cambios al canvas si es necesario
        resizeCanvas();

        if (window.VisualEffects && typeof window.VisualEffects.init === 'function') {
            window.VisualEffects.init();
        }
    },

    addCoins(amount) {
        let current = parseInt(localStorage.getItem('slipCoins') || 0);
        current += amount;
        localStorage.setItem('slipCoins', current);
        if (window.Menu) {
            window.Menu.updateMenuUI();
            window.Menu.syncCloud();
        }
    },

    addDna(amount) {
        let current = parseInt(localStorage.getItem('slipDna') || 0);
        current += amount;
        localStorage.setItem('slipDna', current);
        if (window.Menu) {
            window.Menu.updateMenuUI();
            window.Menu.syncCloud();
        }
    },

    generateMissions() {
        this.missions = [
            { id: 'food', text: 'Come 30 células', goal: 30, progress: 0, reward: 2, done: false },
            { id: 'bots', text: 'Consume 3 bots', goal: 3, progress: 0, reward: 2, done: false },
            { id: 'survive', text: 'Sobrevive 1 minuto', goal: 60, progress: 0, reward: 2, done: false }
        ];
        this.renderMissions();
    },

    trackMission(type, value = 1) {
        const m = this.missions.find(m => m.id === type);
        if (m && !m.done) {
            if (type === 'survive') m.progress = Math.floor((Date.now() - this.startTime) / 1000);
            else m.progress += value;
            if (m.progress >= m.goal) { m.done = true; this.addCoins(m.reward); }
            this.renderMissions();
        }
    },

    renderMissions() {
        const list = document.getElementById('missionsListContainer');
        if (list) {
            list.innerHTML = this.missions.map(m => `
                <div class="mission-card ${m.done ? 'is-done' : ''}">
                    <div class="mission-info">
                        <div class="mission-title">${m.text}</div>
                        <div class="mission-progress-bg">
                            <div class="mission-progress-fill" style="width: ${(m.progress/m.goal)*100}%"></div>
                        </div>
                    </div>
                    <div class="mission-reward">
                        <div class="reward-val">+${m.reward}</div>
                        <div class="reward-icon">💰</div>
                    </div>
                    ${m.done ? '<div class="mission-check">✅</div>' : ''}
                </div>
            `).join('');
        }
    },

    getXPThreshold(lvl) {
        if (lvl <= 5) return lvl * 800;
        if (lvl <= 10) return lvl * 2500;
        if (lvl <= 15) return lvl * 8000;
        return lvl * 20000;
    },

    updateXP(mass) {
        // MÓDULO 5: RECOMPENSA DE CONSOLACIÓN EN GAME OVER
        const maxMass = Math.floor(localStorage.getItem('slip_max_mass') || 0);
        const consolationCoins = Math.floor(mass / 50);
        this.addCoins(consolationCoins);

        // Módulo 2: Sistema de Experiencia (XP) del Pase
        const gainedXP = Math.floor(mass * 0.1);
        this.progression.slipXP += gainedXP;

        while (this.progression.slipXP >= 1000) {
            this.progression.slipXP -= 1000;
            this.progression.passLevel++;
            // Recompensa automática procedimental cada 5 niveles (Skin)
            if (this.progression.passLevel % 5 === 0) {
                const seed = 1000 + (this.progression.passLevel * 7);
                const skinId = `procedural_${seed}`;
                // Guardar como skin desbloqueada si no existe
                const userId = 'guest';
                let purchased = [];
                try {
                    const saved = localStorage.getItem(`purchasedSkins_${userId}`);
                    if (saved) purchased = JSON.parse(saved);
                } catch(e) {}
                if (!purchased.includes(skinId)) {
                    purchased.push(skinId);
                    localStorage.setItem(`purchasedSkins_${userId}`, JSON.stringify(purchased));
                }
            }
        }

        // Módulo 1: Puntos de Rango (RP)
        let gainedRP = 0;
        if (mass > 1500) gainedRP = 30;
        else if (mass >= 500) gainedRP = 15;
        else if (mass < 300) gainedRP = -12;

        this.progression.rankPoints = Math.max(0, this.progression.rankPoints + gainedRP);

        // Sistema de niveles original (para retrocompatibilidad de UI)
        let data = {lvl:1, xp:0};
        try {
            const saved = localStorage.getItem('slip_prog');
            if (saved && saved !== "undefined") data = JSON.parse(saved);
        } catch (e) {}

        let gainedOriginal = Math.floor(mass * 0.6), xpOriginal = data.xp + gainedOriginal, lvlOriginal = data.lvl;
        let leveledUp = false;
        while(xpOriginal >= this.getXPThreshold(lvlOriginal) && lvlOriginal < 20) {
            xpOriginal -= this.getXPThreshold(lvlOriginal);
            lvlOriginal++;
            leveledUp = true;
        }
        localStorage.setItem('slip_prog', JSON.stringify({lvl: lvlOriginal, xp: xpOriginal}));

        // Masa Máxima y Tiempo
        if (mass > (parseInt(localStorage.getItem('slip_max_mass') || 0))) {
            localStorage.setItem('slip_max_mass', Math.floor(mass));
        }
        const survived = Math.floor((Date.now() - this.startTime) / 1000);
        if (survived > (parseInt(localStorage.getItem('slip_max_survived') || 0))) {
            localStorage.setItem('slip_max_survived', survived);
        }

        this.saveProgression();

        if (leveledUp && window.Menu) window.Menu.showLevelUp(data.lvl, lvlOriginal);
        if (window.Menu) window.Menu.syncCloud();

        return {
            lvl: lvlOriginal,
            xp: xpOriginal,
            gained: gainedOriginal,
            threshold: this.getXPThreshold(lvlOriginal),
            up: leveledUp,
            gained_coins: Math.floor(mass / 50),
            rp_gained: gainedRP,
            pass_lvl: this.progression.passLevel
        };
    },

    update() {
        if (this.isPaused) return;

        // CACHÉ GLOBAL DE CÁLCULOS MATEMÁTICOS POR FRAME (REGLA DE ORO 1)
        window.GLOBAL_FRAME_TIME = Date.now();
        window.GLOBAL_SINE_PULSE = Math.sin(window.GLOBAL_FRAME_TIME * 0.005);

        if (joystick.stick) joystick.stick.style.transform = `translate(${joystick.currentX}px, ${joystick.currentY}px)`;

        const lerpSpeed = 0.12;
        window.mouse.x += (window.mouse.targetX - window.mouse.x) * lerpSpeed;
        window.mouse.y += (window.mouse.targetY - window.mouse.y) * lerpSpeed;

        if (!Player.isPlaying()) return;
        if (Player.isDead) {
            const stats = this.updateXP(Player.maxMass);
            if (window.Menu) window.Menu.showGameOver(Player.maxMass, stats);
            Player.gameState = "MENU";
            return;
        }

        // 1. Recolección de comida (Optimizado con paso de muestreo)
        const cells = Player.cells;
        const isLow = this.quality === 'low';

        for(let i = Food.items.length - 1; i >= 0; i--) {
            const f = Food.items[i];
            for(let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                const dx = cell.x - f.x, dy = cell.y - f.y;
                const distSq = dx*dx + dy*dy;
                if(distSq < cell.radius * cell.radius) {
                    cell.mass += (f.ejected ? 3 : 1);
                    cell.targetRadius = 30 * Math.sqrt(cell.mass / 30);

                    if(!isLow && window.VisualEffects) {
                        window.VisualEffects.spawnEatParticles(f.x, f.y, f.color);
                    }

                    f.isDying = true;
                    this.trackMission('food');
                    break;
                }
            }
        }

        Player.update(window.mouse);
        if (window.Multiplayer) window.Multiplayer.sendUpdate();

        // MÓDULO 2: Garbage Collection de Entidades (Limpieza inmediata)
        Food.update();
        Bots.update();
        Virus.update();

        this.leaderboardTimer++;
        if (this.leaderboardTimer >= 40) {
            Leaderboard.update();
            Leaderboard.render();
            this.leaderboardTimer = 0;
        }
        this.trackMission('survive');
        if(window.VisualEffects) window.VisualEffects.update();

        const center = Player.getCenter();
        const targetZoom = Math.max(0.2, 0.9 / (1 + Math.sqrt(Player.getMass() / 1500)));
        window.camera.zoom += (targetZoom - window.camera.zoom) * 0.05;

        // MÓDULO 3: CORRECCIÓN DE CÁMARA DESCENTRADA EN BORDES DE MAPA
        const viewW = window.innerWidth / window.camera.zoom;
        const viewH = window.innerHeight / window.camera.zoom;

        // Posición ideal de la cámara para centrar al jugador
        let targetX = center.x - viewW / 2;
        let targetY = center.y - viewH / 2;

        // Limitación estricta para no mostrar el "vacío" fuera del mapa
        // Si el mapa es más pequeño que el viewport (mucho zoom out), lo centramos
        if (viewW < World.width) {
            targetX = Math.max(0, Math.min(targetX, World.width - viewW));
        } else {
            targetX = (World.width - viewW) / 2;
        }

        if (viewH < World.height) {
            targetY = Math.max(0, Math.min(targetY, World.height - viewH));
        } else {
            targetY = (World.height - viewH) / 2;
        }

        // Interpolación LERP para un seguimiento suave y cinematográfico
        window.camera.x += (targetX - window.camera.x) * 0.1;
        window.camera.y += (targetY - window.camera.y) * 0.1;
    },

    render() {
        const dpr = window.devicePixelRatio || 1;
        const isLow = this.quality === 'low';

        // Optimización: clearRect es más rápido que fillRect para limpiar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.isStarted) {
            // Fondo estático (Blanco)
            ctx.save();
            ctx.scale(window.camera.zoom, window.camera.zoom);

            World.render(ctx, window.camera);

            if (Player.isPlaying() || Player.isDead) {
                if(!isLow && window.VisualEffects) window.VisualEffects.renderAmbient(ctx, window.camera);

                Food.render(ctx, window.camera);

                const actors = [];
                Player.cells.forEach(c => actors.push({ type: 'player', obj: c, r: c.radius }));

                const viewW = window.innerWidth / window.camera.zoom;
                const viewH = window.innerHeight / window.camera.zoom;
                const margin = 200;

                Bots.items.forEach(b => {
                    if (b.x > window.camera.x - margin && b.x < window.camera.x + viewW + margin &&
                        b.y > window.camera.y - margin && b.y < window.camera.y + viewH + margin) {
                        actors.push({ type: 'bot', obj: b, r: b.radius });
                    }
                });

                // Optimización: Solo ordenar si hay suficientes elementos
                if (actors.length > 1) actors.sort((a, b) => a.r - b.r);

                for (let i = 0; i < actors.length; i++) {
                    const a = actors[i];
                    if (a.type === 'player') Player.renderCell(ctx, window.camera, a.obj);
                    else Bots.renderCell(ctx, window.camera, a.obj);
                }

                if (window.Multiplayer) window.Multiplayer.render(ctx, window.camera);
                Virus.render(ctx, window.camera);

                if(!isLow && window.VisualEffects) window.VisualEffects.render(ctx, window.camera);
            }
            ctx.restore();
        }
        HUD.render();
    }
};

const joystick = {
    active:false, activeTouchId: null,
    currentX: 0, currentY: 0,
    stick: null,
    container: null
};

function handleTouchMove(e) {
    if (!joystick.active || !joystick.container || !window.canvas) return;
    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystick.activeTouchId) {
            touch = e.touches[i];
            break;
        }
    }
    if (!touch) return;

    // MÓDULO 1: CÁLCULO RELATIVO AL CANVAS REAL (Corrección de HUD 55px)
    const rect = joystick.container.getBoundingClientRect();
    const canvasRect = window.canvas.getBoundingClientRect();

    // Coordenadas del touch relativas al canvas
    const touchCanvasX = touch.clientX - canvasRect.left;
    const touchCanvasY = touch.clientY - canvasRect.top;

    // Centro del joystick relativo al canvas
    const centerCanvasX = (rect.left + rect.width / 2) - canvasRect.left;
    const centerCanvasY = (rect.top + rect.height / 2) - canvasRect.top;

    const dx = touchCanvasX - centerCanvasX;
    const dy = touchCanvasY - centerCanvasY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxDist);

    joystick.currentX = Math.cos(angle) * clampedDist;
    joystick.currentY = Math.sin(angle) * clampedDist;

    // Normalización de entrada para el jugador (Fijado a 150px de radio virtual)
    window.mouse.targetX = (window.innerWidth / 2) + (joystick.currentX / maxDist) * 150;
    window.mouse.targetY = (window.innerHeight / 2) + (joystick.currentY / maxDist) * 150;
}

function initControls() {
    try {
        joystick.stick = document.getElementById('joystickStick');
        joystick.container = document.getElementById('joystickContainer');
        const gameplayUI = document.getElementById('gameplayUI');

        if (gameplayUI) {
            gameplayUI.addEventListener('touchstart', function(e) {
                if (Engine.isPaused || Engine.controlMode !== 'touch') return;
                // MÓDULO 3: Tracking de Touch ID para fijación de joystick
                const touch = e.touches[e.touches.length - 1];
                if (touch.clientX < window.innerWidth * 0.5) {
                    joystick.active = true;
                    joystick.activeTouchId = touch.identifier;
                    joystick.container.style.left = (touch.clientX - 65) + 'px';
                    joystick.container.style.top = (touch.clientY - 65) + 'px';
                    joystick.container.style.bottom = 'auto';
                    handleTouchMove(e);
                }
            }, { passive: false });

            gameplayUI.style.pointerEvents = 'auto';
        }

        window.addEventListener('touchmove', function(e) {
            if (joystick.active) {
                e.preventDefault();
                handleTouchMove(e);
            }
        }, { passive: false });

        window.addEventListener('touchend', function(e) {
            // MÓDULO 1: PARADA INSTANTÁNEA (Anti-Drift)
            let stillActive = false;
            for(let i=0; i<e.touches.length; i++) {
                if(e.touches[i].identifier === joystick.activeTouchId) stillActive = true;
            }
            if(!stillActive) {
                joystick.active = false;
                joystick.activeTouchId = null;
                joystick.currentX = 0;
                joystick.currentY = 0;
                window.mouse.targetX = window.innerWidth / 2;
                window.mouse.targetY = window.innerHeight / 2;

                // Forzar frenado en Player
                if (window.Player && window.Player.cells) {
                    window.Player.cells.forEach(c => { c.vx = 0; c.vy = 0; });
                }
            }
        });

        var btnSplit = document.getElementById('btnSplit');
        if (btnSplit) btnSplit.addEventListener('touchstart', function(e) { if (!Engine.isPaused) { e.preventDefault(); Player.split(); } });

        var btnEject = document.getElementById('btnEject');
        if (btnEject) btnEject.addEventListener('touchstart', function(e) { if (!Engine.isPaused) { e.preventDefault(); Player.ejectMass(); } });

        var pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.onclick = function(e) { e.stopPropagation(); Engine.togglePause(); };

        var resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) resumeBtn.onclick = function() { Engine.togglePause(); };

        var quitBtn = document.getElementById('quitBtn');
        if (quitBtn) quitBtn.onclick = function() { location.reload(); };

        var exitToMenuBtn = document.getElementById('exitToMenuBtn');
        if (exitToMenuBtn) exitToMenuBtn.onclick = function() { location.reload(); };

        window.addEventListener('mousemove', function(e) {
            if (Engine.controlMode === 'pc' && !Engine.isPaused && Engine.isStarted) {
                window.mouse.targetX = e.clientX;
                window.mouse.targetY = e.clientY;
            }
        });

        window.addEventListener('keydown', function(e) {
            if (Engine.controlMode === 'pc' && !Engine.isPaused && Engine.isStarted) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    Player.split();
                } else if (e.key.toLowerCase() === 'w') {
                    e.preventDefault();
                    Player.ejectMass();
                }
            }
        });
    } catch (e) {
        console.error("Error al inicializar controles:", e);
    }
}

window.Engine = Engine;

function startEverything() {
    console.log("Iniciando startEverything...");
    try {
        var loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.innerText = "Iniciando motor...";

        // MÓDULO 3: Cargar progresión antes de inicializar la UI para evitar parpadeo de Rango
        if (Engine.loadProgression) Engine.loadProgression();

        initControls();
        Engine.updateControlUI();

        if (window.Menu && typeof window.Menu.init === 'function') {
            window.Menu.init();
        }

        if (Engine.initEconomy) Engine.initEconomy();

        console.log("Inicialización exitosa");
    } catch (e) {
        console.error("Error crítico durante la inicialización:", e);
        var loading = document.getElementById('loadingOverlay');
        if (loading) {
            var text = document.getElementById('loadingText');
            if (text) text.innerText = "Error en carga";
            setTimeout(function() {
                loading.style.display = 'none';
                loading.classList.remove('is-open');
                if (window.Menu && window.Menu.switchState) {
                    window.Menu.switchState(window.Menu.STATES.MENU);
                }
            }, 1000);
        }
    }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(startEverything, 10);
} else {
    window.addEventListener("DOMContentLoaded", () => setTimeout(startEverything, 10));
}

function gameLoop() {
    try {
        Engine.update();
        Engine.render();
        if (Engine.isStarted) requestAnimationFrame(gameLoop);
    } catch (e) {
        console.error("Error en gameLoop:", e);
        requestAnimationFrame(gameLoop);
    }
}
