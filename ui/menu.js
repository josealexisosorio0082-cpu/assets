var Menu = {
    STATES: { MENU: 'ESTADO_MENU', TIENDA: 'ESTADO_TIENDA', JUEGO: 'ESTADO_JUEGO', PAUSA: 'ESTADO_PAUSA', MUERTE: 'ESTADO_GAME_OVER', PERFIL: 'ESTADO_PERFIL' },
    currentState: '',
    previousState: '',
    currentSkin: '',
    user: null,
    currentSkinFilter: 'premium',
    skins: {},
    skinImages: {},
    shopItems: {
        mass: [
            { id: 'mass_1', name: 'Masa +20', price: 150, type: 'coins', icon: '⚖️', desc: 'Inicia con 20 más de masa (Solo esta partida)', reward: { type: 'bonus_mass', value: 20, temporary: true } },
            { id: 'mass_2', name: 'Masa +50', price: 400, type: 'coins', icon: '⚖️', desc: 'Inicia con 50 más de masa (Solo esta partida)', reward: { type: 'bonus_mass', value: 50, temporary: true } },
            { id: 'mass_3', name: 'Masa +100', price: 1200, type: 'coins', icon: '⚖️', desc: 'Inicia con 100 más de masa (Solo esta partida)', reward: { type: 'bonus_mass', value: 100, temporary: true } }
        ],
        speed: [
            { id: 'speed_1', name: 'Turbo', price: 250, type: 'coins', icon: '⚡', desc: '2% más de velocidad (Solo esta partida)', reward: { type: 'bonus_speed', value: 0.02, temporary: true } },
            { id: 'speed_2', name: 'Súper Turbo', price: 600, type: 'coins', icon: '⚡', desc: '5% más de velocidad (Solo esta partida)', reward: { type: 'bonus_speed', value: 0.05, temporary: true } }
        ],
        emotes: [
            { id: 'emote_smile', name: 'Sonrisa', price: 0, type: 'coins', icon: '😊', desc: '¡Emote gratis para todos!', reward: { type: 'unlock_emote', value: '😊' } },
            { id: 'emote_laugh', name: 'Risa', price: 500, type: 'coins', icon: '😂', desc: 'Para cuando ganes', reward: { type: 'unlock_emote', value: '😂' } },
            { id: 'emote_cool', name: 'Genial', price: 800, type: 'coins', icon: '😎', desc: 'Estilo puro', reward: { type: 'unlock_emote', value: '😎' } },
            { id: 'emote_angry', name: 'Enojo', price: 1200, type: 'coins', icon: '😡', desc: '¡No me comas!', reward: { type: 'unlock_emote', value: '😡' } }
        ],
        potions: [
            { id: 'potion_1', name: 'Escudo', price: 3, type: 'dna', icon: '🧪', desc: 'Protección contra 1 virus', reward: { type: 'shield', value: 1 } },
            { id: 'potion_2', name: 'Mega Escudo', price: 10, type: 'dna', icon: '🧪', desc: 'Protección contra 5 virus', reward: { type: 'shield', value: 5 } }
        ],
        coins: [
            { id: 'coins_usd_1', name: 'Bolsa de Créditos', price: 4.99, type: 'usd', icon: '💰', desc: '5,000 Slip Coins - ¡Ideal para empezar!', reward: { type: 'coins', value: 5000 }, tag: 'POPULAR' },
            { id: 'coins_usd_2', name: 'Maletín Plasma', price: 9.99, type: 'usd', icon: '💼', desc: '12,000 Slip Coins - Mejor valor por tu dinero', reward: { type: 'coins', value: 12000 }, tag: 'OFERTA' },
            { id: 'coins_usd_3', name: 'Bóveda Galáctica', price: 24.99, type: 'usd', icon: '🏦', desc: '35,000 Slip Coins - ¡Desbloquea casi todo!', reward: { type: 'coins', value: 35000 }, tag: 'RECOMENDADO' },
            { id: 'coins_usd_4', name: 'Cargamento Infinito', price: 49.99, type: 'usd', icon: '🚢', desc: '80,000 Slip Coins - Sin límites, sin esperas', reward: { type: 'coins', value: 80000 }, tag: 'VIP' },
            { id: 'coins_usd_5', name: 'Protocolo Fundador', price: 99.99, type: 'usd', icon: '👑', desc: '200,000 Slip Coins - Domina el servidor hoy', reward: { type: 'coins', value: 200000 }, tag: 'BEST VALUE' }
        ],
        dna: [
            { id: 'dna_usd_1', name: 'Jeringa Premium', price: 2.99, type: 'usd', icon: '🧪', desc: '10 ADN Premium', reward: { type: 'dna', value: 10 } },
            { id: 'dna_usd_2', name: 'Caja de Cultivo', price: 14.99, type: 'usd', icon: '🧬', desc: '60 ADN Premium - ¡Ahorra un 20%!', reward: { type: 'dna', value: 60 }, tag: 'HOT' },
            { id: 'dna_pack_1', name: 'Laboratorio Local', price: 2000, type: 'coins', icon: '🧬', desc: 'Intercambia 2000 Monedas por 2 ADN', reward: { type: 'dna', value: 2 } },
            { id: 'dna_pack_2', name: 'Modo Fuego', price: 50, type: 'dna', icon: '🔥', desc: 'Efecto Visual Permanente', reward: { type: 'unlock_effect', value: 'fire' } },
            { id: 'dna_pack_3', name: 'Modo Hielo', price: 50, type: 'dna', icon: '❄️', desc: 'Efecto Visual Permanente', reward: { type: 'unlock_effect', value: 'ice' } },
            { id: 'dna_pack_4', name: 'Aura Plasma', price: 80, type: 'dna', icon: '⚛️', desc: 'Efecto Visual Permanente', reward: { type: 'unlock_effect', value: 'plasma' } }
        ]
    },

    init: function() {
        window.Menu = this;
        console.log("Slip Game: Inicializando Menú...");

        const screens = ['menu', 'shopModal', 'pauseModal', 'gameOverScreen', 'profileModal', 'settingsModal', 'lanModal', 'missionsModal', 'dailyChest', 'levelUpModal', 'leaderboardModal', 'slipPassModal'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.classList.remove('is-open');
                el.style.display = 'none';
            }
        });

        // Asegurar que el usuario tenga el emote gratis inicial
        const userId = this.user ? this.user.id : 'guest';
        let emotes = JSON.parse(localStorage.getItem(`unlockedEmotes_${userId}`) || "[]");
        if (emotes.length === 0) {
            emotes.push("😊");
            localStorage.setItem(`unlockedEmotes_${userId}`, JSON.stringify(emotes));
        }

        // Eventos con addEventListener para evitar conflictos
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = (e) => { e.stopPropagation(); fn(e); };
        };

        bind('playButton', () => this.startGame());
        bind('shopBtn', () => this.switchState(this.STATES.TIENDA));
        bind('closeShop', () => {
            const mainView = document.getElementById('shopMainView');
            if (mainView && mainView.classList.contains('active')) {
                this.switchState(this.STATES.MENU);
            } else {
                this.openShopMain();
            }
        });

        bind('resumeBtn', () => { if(window.Engine) window.Engine.togglePause(); });
        bind('quitBtn', () => location.reload());
        bind('restartButton', () => this.startGame());
        bind('exitToMenuBtn', () => location.reload());

        bind('editNameBtn', () => this.openProfile());
        bind('closeProfile', () => {
            console.log("Slip Game: Cerrando Perfil...");
            this.switchState(this.STATES.MENU);
        });
        bind('goToSkinsFromProfile', () => this.switchState(this.STATES.TIENDA));

        bind('settingsBtn', () => this.switchState('ESTADO_AJUSTES'));
        bind('closeSettings', () => {
            if (this.previousState === this.STATES.PAUSA) this.switchState(this.STATES.PAUSA);
            else this.switchState(this.STATES.MENU);
        });

        bind('missionsBtn', () => {
            this.switchState('ESTADO_MISIONES');
            if (window.Engine) window.Engine.renderMissions();
        });
        bind('closeMissions', () => this.switchState(this.STATES.MENU));

        bind('lanBtn', () => this.switchState('ESTADO_LAN'));
        bind('closeLan', () => this.switchState(this.STATES.MENU));

        bind('freeCoinsBtn', () => { if (window.Engine) window.Engine.checkDailyReward(true); });
        bind('closeChest', () => this.switchState(this.STATES.MENU));
        bind('chestBox', () => {
            const userId = this.user ? this.user.id : 'guest';
            localStorage.setItem(`lastClaimDate_${userId}`, new Date().toDateString());
            if (window.Engine) window.Engine.addCoins(100);
            const box = document.getElementById('chestBox');
            if (box) {
                box.style.transform = 'scale(1.5) rotate(10deg)';
                setTimeout(() => {
                    box.style.display = 'none';
                    document.getElementById('rewardClaimedArea').style.display = 'block';
                    document.getElementById('chestInstruction').innerText = "¡VUELVE MAÑANA!";
                }, 400);
            }
        });

        bind('globalLbBtn', () => this.switchState('ESTADO_GLOBAL'));
        bind('closeLeaderboard', () => this.switchState(this.STATES.MENU));

        bind('slipPassBtn', () => this.switchState('ESTADO_PASS'));
        bind('closePass', () => this.switchState(this.STATES.MENU));

        // Ajustes de Calidad y Control
        document.querySelectorAll('.g-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const q = btn.getAttribute('data-quality');
                if (window.Engine) window.Engine.setQuality(q);
                this.updateQualityButtons();
            };
        });

        document.querySelectorAll('.c-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const mode = btn.getAttribute('data-control');
                if (window.Engine) window.Engine.setControlMode(mode);
                this.updateQualityButtons();
            };
        });

        bind('createRoomBtn', () => {
            if (window.Multiplayer) {
                window.Multiplayer.createRoom();
                const opt = document.getElementById('lanInitialOptions'), lobby = document.getElementById('lanLobbyView');
                if (opt) opt.style.display = 'none';
                if (lobby) lobby.style.display = 'block';
                const codeDisp = document.getElementById('roomCodeDisplay');
                const code = (window.AndroidBridge && window.AndroidBridge.getRoomCode) ? window.AndroidBridge.getRoomCode() : "123456";
                if (codeDisp) codeDisp.innerText = code;
            }
        });

        bind('joinRoomBtn', () => { if (window.Multiplayer) window.Multiplayer.joinRoom(); });
        bind('startLanGameBtn', () => this.startGame());

        bind('closeLevelUp', (e) => {
            const modal = document.getElementById('levelUpModal');
            if (modal) {
                modal.classList.remove('is-open');
                setTimeout(() => { modal.style.display = 'none'; this.switchState(this.STATES.MENU); }, 300);
            }
        });

        bind('alertConfirmBtn', () => {
            const modal = document.getElementById('alertModal');
            if (modal) {
                modal.classList.remove('is-open');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
            if (this._alertCallback) this._alertCallback();
        });

        bind('alertSecondaryBtn', () => {
            const modal = document.getElementById('alertModal');
            if (modal) {
                modal.classList.remove('is-open');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
            if (this._alertSecondaryCallback) this._alertSecondaryCallback();
        });

        bind('btnEmote', () => this.toggleEmotePicker());

        const updateName = (e) => {
            const val = e.target.value.trim();
            if (val && this.user) {
                this.user.name = val;
                this.updateMenuUI();
                const pName = document.getElementById('playerName'), pInput = document.getElementById('profileNameInput');
                if (pName) pName.value = val;
                if (pInput) pInput.value = val;
                localStorage.setItem('slip_user_data', JSON.stringify(this.user));
                if (this.user.id === 'guest') localStorage.setItem('guest_name', val);
                this.syncCloud();
            }
        };
        const pInput = document.getElementById('profileNameInput'), pName = document.getElementById('playerName');
        if (pInput) pInput.onchange = updateName;
        if (pName) pName.onchange = updateName;

        this.checkAuthSession();

        // Cerrar modales al tocar el fondo
        document.querySelectorAll('.ui-screen').forEach(screen => {
            screen.addEventListener('click', (e) => {
                if (e.target === screen) {
                    const id = screen.id;
                    if (id !== 'menu' && id !== 'loadingOverlay' && id !== 'gameOverScreen') {
                        this.switchState(this.STATES.MENU);
                    }
                }
            });
        });

        this.loadDynamicSkins();
        this.renderAllIcons();
        this.updateMenuUI();
    },

    renderAllIcons() {
        console.log("Slip Game: Renderizando iconos...");
        const icons = [
            { id: 'icon_free', type: 'free' }, { id: 'icon_global', type: 'global' },
            { id: 'icon_missions', type: 'missions' }, { id: 'icon_pass', type: 'pass' },
            { id: 'icon_settings', type: 'settings' }, { id: 'icon_lan', type: 'lan' },
            { id: 'icon_dna_hud', type: 'dna' }, { id: 'icon_coin_hud', type: 'coin' },
            { id: 'icon_dna_shop', type: 'dna' }, { id: 'icon_coin_shop', type: 'coin' },
            { id: 'icon_cat_skins', type: 'free' }, { id: 'icon_cat_mass', type: 'missions' },
            { id: 'icon_cat_speed', type: 'lan' }, { id: 'icon_cat_emotes', type: 'emote' }, { id: 'icon_cat_potions', type: 'settings' },
            { id: 'icon_cat_coins', type: 'coin' }, { id: 'icon_cat_dna', type: 'dna' },
            { id: 'icon_split', type: 'split' }, { id: 'icon_eject', type: 'eject' },
            { id: 'icon_pause', type: 'pause' }, { id: 'icon_lb_toggle', type: 'lb_toggle' },
            { id: 'icon_emote', type: 'emote' }
        ];

        if (!window.VisualEffects) {
            console.warn("VisualEffects no disponible para renderAllIcons, reintentando...");
            setTimeout(() => this.renderAllIcons(), 100);
            return;
        }

        icons.forEach(icon => {
            const el = document.getElementById(icon.id);
            if (!el) return;

            try {
                const canvas = document.createElement('canvas');
                const isHud = icon.id.includes('hud') || icon.id.includes('shop');
                const size = isHud ? 20 : 28;

                canvas.width = size * 2; canvas.height = size * 2;
                canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);

                if (icon.type === 'coin') window.VisualEffects.drawSlipCoin(ctx, size/2, size/2, size * 0.45);
                else if (icon.type === 'dna') window.VisualEffects.drawDNA(ctx, size/2, size/2, size * 0.45);
                else window.VisualEffects.drawUIIcon(ctx, size/2, size/2, size * 0.45, icon.type);

                el.innerHTML = '';
                el.appendChild(canvas);
            } catch (e) {
                console.error("Error renderizando icono " + icon.id, e);
            }
        });
    },

    loadDynamicSkins() {
        const free = ["Free (1).png", "Free (3).jpg", "Free (4).jpg"];
        const level = ["Por Nivel (1).png", "Por Nivel (2).png", "Por Nivel (3).png", "Por Nivel (4).png", "Por Nivel (5).png"];
        const premium = Array.from({length: 24}, (_, i) => (i + 1 <= 12 ? `Premium (${i+1}).png` : `Premium (${i+1}).jpg`));
        let files = [];
        if (window.AndroidBridge && window.AndroidBridge.getSkinImages) {
            try { const res = window.AndroidBridge.getSkinImages(); if (res) files = res.split(','); } catch(e) {}
        }
        if (files.length === 0) {
            free.forEach(s => files.push(`skins gratis/${s}`));
            level.forEach(s => files.push(`skins por nivel/${s}`));
            premium.forEach(s => files.push(`skins por slip coins 15-70/${s}`));
        }
        const exclusives = ["Exclusive (1).png", "Exclusive (2).png", "Cyber Micky.png"];
        exclusives.forEach(ex => files.push(`skins exclusivas/${ex}`));
        this.processSkinFiles(files);
    },

    processSkinFiles(files) {
        files.forEach(file => {
            if (!file || !file.includes('.') || this.skins[file]) return;
            let path = file, low = file.toLowerCase();
            if (!file.includes('/')) {
                if (low.includes('free')) path = `skins gratis/${file}`;
                else if (low.includes('nivel')) path = `skins por nivel/${file}`;
                else if (low.includes('premium')) path = `skins por slip coins 15-70/${file}`;
                else if (low.includes('exclusiva')) path = `skins exclusivas/${file}`;
            }
            const isFree = path.includes('gratis') || path.includes('free'), isLevel = path.includes('nivel') || path.includes('level');
            const isPremium = path.includes('premium') || path.includes('coins'), isExcl = path.includes('exclusiva') || path.includes('Exclusive');
            const num = (path.match(/\((\d+)\)/) || [0, 1])[1];
            let name = "Skin " + num, price = 0, lvl = 0, excl = false, req = "", rarity = 'COMÚN';
            if (isFree) { name = ["Nebulosa", "Atómica", "Plasma", "Vórtice", "Estelar"][num-1] || "Libre " + num; }
            else if (isLevel) { name = ["Explorador", "Guerrero", "Veterano", "Maestro", "Leyenda", "Supremo"][num-1] || "Rango " + num; lvl = parseInt(num); rarity = lvl > 4 ? 'LEGENDARIA' : 'ÉPICA'; }
            else if (isPremium) {
                name = ["Galáctica", "Cibernética", "Fénix", "Ártico", "Sombra", "Oro", "Diamante", "Rubí", "Infinito", "Caos", "Nova", "Dragón", "Samurái", "Ninja", "Robot", "Alien", "Cósmico", "Titanio", "Obsidiana", "Relámpago", "Quásar", "Espectral", "Místico", "Supremo"][(num-1)%24] || "Premium " + num;
                if (num % 6 === 0) {
                    rarity = 'LEGENDARIA';
                    price = 8500 + (num % 5) * 500; // 8,500 - 10,500
                } else if (num % 2 === 0) {
                    rarity = 'ÉPICA';
                    price = 3200 + (num % 8) * 200; // 3,200 - 4,600
                } else {
                    rarity = 'COMÚN';
                    price = 1200 + (num % 4) * 150; // 1,200 - 1,650
                }
            }
            else if (isExcl) { excl = true; rarity = 'EXCLUSIVE'; if (path.includes('(1)')) { name = "Fénix Oscuro"; req = "Nivel 10 del Pase"; path = `procedural_1100`; } else if (path.includes('(2)')) { name = "Súper Nova"; req = "Nivel 30 del Pase"; path = `procedural_1200`; } else if (path.includes('Micky')) { name = "Cyber Micky"; req = "50 victorias LAN"; } }
            const url = path.startsWith('procedural_') ? "" : `ui/images/${path}`;
            this.skins[path] = { id: path, name: name.toUpperCase(), url: url, price: price, level: lvl, exclusive: excl, req: req, rarity: rarity };
            if (url) { const img = new Image(); img.src = url; this.skinImages[path] = img; }
        });
        const savedSkin = localStorage.getItem('selectedSkin');
        if (savedSkin && this.skins[savedSkin]) this.currentSkin = savedSkin;
        else if (Object.keys(this.skins).length > 0) this.currentSkin = Object.keys(this.skins)[0];
        this.updateMenuUI();
        this.renderSkinList();
    },

    updateQualityButtons() {
        const q = localStorage.getItem('game_quality') || 'high', ctrl = localStorage.getItem('slip_control_mode') || 'touch';
        document.querySelectorAll('.g-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-quality') === q));
        document.querySelectorAll('.c-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-control') === ctrl));
    },

    renderGlobalLeaderboard() {
        const list = document.getElementById('globalLbList'); if (!list) return;
        const data = [{ name: "👑 PRO_SLIDER", mass: 25400 }, { name: "⚡ GHOST_X", mass: 18200 }, { name: "🔥 NEBULOS", mass: 15600 }, { name: "💎 ALEX_O", mass: 12400 }, { name: "🌀 VORTEX", mass: 9800 }];
        list.innerHTML = data.map((d, i) => `<div style="display:flex; justify-content:space-between; width:100%; padding:12px 20px; border-bottom:1.5px solid #f1f5f9; font-weight:900;"><span style="color:#64748b;">#${i+1} ${d.name}</span><span style="color:#3b82f6;">${d.mass}</span></div>`).join('') + `<div style="padding:15px; font-size:10px; color:#94a3b8;">SE ACTUALIZA CADA HORA</div>`;
    },

    renderSkinList() {
        const grid = document.getElementById('skinGrid'); if (!grid) return; grid.innerHTML = '';
        const userId = this.user ? this.user.id : 'guest';
        let purchased = JSON.parse(localStorage.getItem(`purchasedSkins_${userId}`) || "[]"), prog = JSON.parse(localStorage.getItem('slip_prog') || "{\"lvl\":1}");
        const filtered = Object.keys(this.skins).filter(k => {
            const s = this.skins[k], low = k.toLowerCase();
            if (this.currentSkinFilter === 'premium') return (low.includes('premium') || low.includes('coins')) && !s.exclusive;
            if (this.currentSkinFilter === 'level') return (low.includes('nivel') || low.includes('level')) && !s.exclusive;
            if (this.currentSkinFilter === 'free') return (low.includes('gratis') || low.includes('free')) && !s.exclusive;
            if (this.currentSkinFilter === 'exclusive') return s.exclusive;
            return false;
        });
        filtered.forEach(key => {
            const s = this.skins[key], isSelected = this.currentSkin === key, locked = s.level > prog.lvl;
            const isFree = (s.price === 0 && !s.level && !s.exclusive) || (s.price === 0 && !s.exclusive && !locked);
            const owned = purchased.includes(key) || isFree;
            const card = document.createElement('div'); card.className = `skin-card ${isSelected ? 'active' : ''} rarity-${s.rarity.toLowerCase()}`;

            let btnTxt = isSelected ? "EQUIPADA" : (owned ? "SELECCIONAR" : (locked ? `NIVEL ${s.level}` : (s.exclusive ? "BLOQUEADO" : `💰 ${s.price}`)));
            if (isFree && !purchased.includes(key) && !isSelected) btnTxt = "OBTENER";

            let btnCol = isSelected ? "#22c55e" : (owned ? "#3b82f6" : (locked ? "#475569" : (s.exclusive ? "#475569" : "#f59e0b")));

            card.innerHTML = `
                <div class="rarity-tag ${s.rarity.toLowerCase()}">${s.rarity}</div>
                <div class="skin-img-container" style="width:90px; height:90px; border-radius:50%; overflow:hidden; border:3px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; margin-bottom:12px; background:rgba(0,0,0,0.3); position:relative;">
                    ${key.startsWith('procedural_') ? `<canvas id="cv_${key}" width="90" height="90" style="width:100%; height:100%;"></canvas>` : `<img src="${s.url}" style="width:100%; height:100%; object-fit:cover;">`}
                    ${locked ? `<div class="skin-lock-overlay">🔒</div>` : ''}
                </div>
                <div style="font-weight:900; font-size:0.7rem; color:#fff; text-transform:uppercase; margin-bottom:10px; text-align:center;">${s.name}</div>
                <button class="item-price-btn" style="background:${btnCol};">${btnTxt}</button>
            `;
            if (key.startsWith('procedural_')) setTimeout(() => { const cv = document.getElementById(`cv_${key}`); if(cv) window.VisualEffects.drawProceduralSkin(cv.getContext('2d'), 45, 45, 40, parseInt(key.split('_')[1])); }, 0);

            card.onclick = () => {
                if (isSelected) return;
                if (owned) {
                    if (isFree && !purchased.includes(key)) {
                        this.unlockFreeSkin(key);
                    } else {
                        this.currentSkin = key;
                        this.updateMenuUI();
                        this.renderSkinList();
                    }
                } else if (locked || s.exclusive) {
                    this.showAlert("PROTOCOLO BLOQUEADO", s.req || `Alcanza el nivel ${s.level} para desbloquear este aspecto.`, "🔒");
                } else {
                    this.buySkin(key);
                }
            };
            grid.appendChild(card);
        });
    },

    unlockFreeSkin(key) {
        const s = this.skins[key];
        const userId = this.user ? this.user.id : 'guest';
        let p = JSON.parse(localStorage.getItem(`purchasedSkins_${userId}`) || "[]");
        if (!p.includes(key)) p.push(key);
        localStorage.setItem(`purchasedSkins_${userId}`, JSON.stringify(p));

        this.showAlert("SKIN OBTENIDA", `¡Has desbloqueado el aspecto ${s.name} exitosamente!`, "✨", () => {
            this.currentSkin = key;
            this.updateMenuUI();
            this.renderSkinList();
        });
    },

    filterSkins(f) { this.currentSkinFilter = f; document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.getAttribute('onclick').includes(f))); this.renderSkinList(); },

    showAlert(title, message, icon = "⚠️", onConfirm = null, onSecondary = null, confirmText = "ACEPTAR", secondaryText = "CANCELAR") {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertTitle');
        const msgEl = document.getElementById('alertMessage');
        const iconEl = document.getElementById('alertIcon');
        const confirmBtn = document.getElementById('alertConfirmBtn');
        const secondaryBtn = document.getElementById('alertSecondaryBtn');

        if (!modal) return;

        titleEl.innerText = title;
        msgEl.innerText = message;
        iconEl.innerText = icon;
        confirmBtn.innerText = confirmText;

        if (onSecondary) {
            secondaryBtn.style.display = 'block';
            secondaryBtn.innerText = secondaryText;
            document.getElementById('alertActions').style.gridTemplateColumns = '1fr 1fr';
        } else {
            secondaryBtn.style.display = 'none';
            document.getElementById('alertActions').style.gridTemplateColumns = '1fr';
        }

        this._alertCallback = onConfirm;
        this._alertSecondaryCallback = onSecondary;

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('is-open'), 50);
    },

    buySkin(key) {
        const s = this.skins[key];
        if (!s) return;

        const cur = parseInt(localStorage.getItem('slipCoins') || 0);
        if (cur >= s.price) {
            this.showAlert("CONFIRMAR COMPRA", `¿Deseas adquirir ${s.name} por ${s.price} Slip Coins?`, "💰", () => {
                const newBalance = cur - s.price;
                localStorage.setItem('slipCoins', newBalance);
                if (window.progression) window.progression.slipCoins = newBalance;

                let p = JSON.parse(localStorage.getItem(`purchasedSkins_${this.user.id}`) || "[]");
                if (!p.includes(key)) p.push(key);
                localStorage.setItem(`purchasedSkins_${this.user.id}`, JSON.stringify(p));

                this.currentSkin = key;
                this.updateMenuUI();
                this.renderSkinList();
                this.updateShopCurrencies();
                this.syncCloud();

                this.showAlert("¡COMPRA EXITOSA!", `Aspecto ${s.name} equipado.`, "✨");
            }, () => {}, "COMPRAR", "CANCELAR");
        } else {
            this.showAlert("SALDO INSUFICIENTE", `Te faltan ${s.price - cur} Slip Coins para este aspecto. ¿Quieres conseguir más ahora?`, "💎", () => {
                this.openShopCategory('coins');
            }, () => {}, "IR A LA TIENDA", "LUEGO");
        }
    },

    renderSlipPass() {
        const list = document.getElementById('passRewardsList');
        if (!list) return;
        const p = window.progression || { passLevel: 1, slipXP: 0, claimedRewards: [], passPurchased: false };

        const lvlEl = document.getElementById('passLvlText'), xpText = document.getElementById('passXPText'), xpFill = document.getElementById('passXPFill'), pctText = document.getElementById('passPercentText');
        if (lvlEl) lvlEl.innerText = p.passLevel;
        if (xpText) xpText.innerText = `${p.slipXP} / 1000 XP`;
        const percent = Math.floor((p.slipXP / 1000) * 100);
        if (xpFill) xpFill.style.width = percent + '%';
        if (pctText) pctText.innerText = `${percent}% COMPLETADO`;

        // Botón de compra del pase si no lo tiene
        let buySection = '';
        if (!p.passPurchased) {
            buySection = `
                <div style="grid-column: 1/-1; background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 20px; border-radius: 20px; margin-bottom: 20px; text-align: center; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);">
                    <div style="font-weight: 950; color: #fff; font-size: 1.2rem; margin-bottom: 5px;">SLIP PASS ELITE</div>
                    <div style="font-size: 0.75rem; color: #fff; opacity: 0.9; margin-bottom: 15px;">¡Desbloquea todas las recompensas premium y skins exclusivas!</div>
                    <button onclick="Menu.buySlipPass()" class="item-price-btn" style="background: #fff; color: #8b5cf6; width: auto; padding: 12px 30px; margin: 0 auto; display: block; font-size: 0.9rem;">
                        💰 4,500 SLIP COINS
                    </button>
                </div>
            `;
        }

        const rewards = [];
        for (let i = 1; i <= 20; i++) {
            let reward = { lvl: i, name: `CRÉDITOS SLIP`, type: 'coins', value: 250, icon: '💰' };
            if (i === 10) reward = { lvl: i, name: `EMOTE CORONA`, type: 'emote', value: '👑', icon: '👑' };
            else if (i === 15) reward = { lvl: i, name: `EMOTE FUEGO`, type: 'emote', value: '🔥', icon: '🔥' };
            else if (i === 20) reward = { lvl: i, name: `EMOTE DIAMANTE`, type: 'emote', value: '💎', icon: '💎' };
            else if (i % 5 === 0) {
                const seed = 1000 + (i * 7);
                reward = { lvl: i, name: `SKIN PROTOCOLO`, type: 'skin', value: `procedural_${seed}`, icon: '🎭' };
            } else if (i % 3 === 0) {
                reward = { lvl: i, name: `PAQUETE ADN`, type: 'dna', value: 15, icon: '🧬' };
            }
            rewards.push(reward);
        }

        list.innerHTML = buySection + rewards.map(r => {
            const locked = r.lvl > p.passLevel, claimed = (p.claimedRewards || []).includes(r.lvl);
            const isPremium = r.lvl % 2 === 0; // Por ejemplo, niveles pares son premium
            const premiumLocked = isPremium && !p.passPurchased;

            let btnTxt = locked ? "BLOQUEADO" : (premiumLocked ? "ELITE REQ" : (claimed ? "RECLAMADO" : "RECLAMAR"));
            let btnClass = (locked || claimed || premiumLocked) ? "disabled" : "";
            let premiumStyle = isPremium ? 'border: 1.5px solid #facc15; background: rgba(250, 204, 21, 0.05);' : '';

            return `
                <div class="pass-reward-card ${locked ? 'locked' : ''} ${claimed ? 'claimed' : ''}" style="${premiumStyle}">
                    ${isPremium ? '<div style="position:absolute; top:5px; right:5px; font-size:10px; color:#facc15; font-weight:950;">ELITE</div>' : ''}
                    <div class="pass-reward-lvl">NIVEL ${r.lvl}</div>
                    <div class="pass-reward-icon">${r.icon}</div>
                    <div class="pass-reward-name">${r.name}</div>
                    <button class="pass-claim-btn ${btnClass}" onclick="Menu.claimPassReward(${r.lvl})">${btnTxt}</button>
                </div>
            `;
        }).join('');
    },

    buySlipPass() {
        const p = window.progression;
        const cost = 4500;
        const cur = parseInt(localStorage.getItem('slipCoins') || 0);

        if (cur >= cost) {
            if (confirm(`¿Comprar Slip Pass Elite por ${cost} Monedas?`)) {
                window.Engine.addCoins(-cost);
                p.passPurchased = true;
                window.Engine.saveProgression();
                this.renderSlipPass();
                alert("¡Slip Pass Elite activado! Ya puedes reclamar recompensas exclusivas.");
            }
        } else {
            alert("No tienes suficientes monedas. ¡Visita la tienda para conseguir más!");
            this.switchState(this.STATES.TIENDA);
        }
    },

    claimPassReward(lvl) {
        const p = window.progression;
        if (!p || lvl > p.passLevel || (p.claimedRewards || []).includes(lvl)) return;

        const isPremium = lvl % 2 === 0;
        if (isPremium && !p.passPurchased) {
            alert("Este nivel requiere el Slip Pass Elite.");
            return;
        }

        if (!p.claimedRewards) p.claimedRewards = [];
        p.claimedRewards.push(lvl);

        if (lvl === 10) this.unlockEmote("👑");
        else if (lvl === 15) this.unlockEmote("🔥");
        else if (lvl === 20) this.unlockEmote("💎");
        else if (lvl % 5 === 0) {
            const skinId = `procedural_${1000 + (lvl * 7)}`;
            let pur = JSON.parse(localStorage.getItem(`purchasedSkins_${this.user.id}`) || "[]");
            if (!pur.includes(skinId)) { pur.push(skinId); localStorage.setItem(`purchasedSkins_${this.user.id}`, JSON.stringify(pur)); }
        } else if (lvl % 3 === 0) { window.Engine.addDna(15); } else { window.Engine.addCoins(250); }
        window.Engine.saveProgression(); this.renderSlipPass(); this.updateMenuUI();
    },

    unlockEmote(emote) {
        const userId = this.user ? this.user.id : 'guest';
        let emotes = JSON.parse(localStorage.getItem(`unlockedEmotes_${userId}`) || "[]");
        if (!emotes.includes(emote)) {
            emotes.push(emote);
            localStorage.setItem(`unlockedEmotes_${userId}`, JSON.stringify(emotes));
            alert("¡Nuevo Emote desbloqueado: " + emote + "!");
        }
    },

    toggleEmotePicker() {
        const container = document.getElementById('emoteContainer');
        if (!container) return;
        if (container.style.display === 'flex') {
            container.style.display = 'none';
        } else {
            container.style.display = 'flex';
            this.renderEmotePicker();
        }
    },

    renderEmotePicker() {
        const list = document.getElementById('emoteList');
        if (!list) return;
        const userId = this.user ? this.user.id : 'guest';
        const emotes = JSON.parse(localStorage.getItem(`unlockedEmotes_${userId}`) || "[]");
        list.innerHTML = emotes.map(e => `
            <div onclick="Menu.useEmote('${e}')" style="font-size: 2rem; cursor: pointer; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 10px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                ${e}
            </div>
        `).join('');
    },

    useEmote(emote) {
        if (window.Player) {
            window.Player.activeEmote = { text: emote, time: 180 }; // ~3 segundos a 60fps
            document.getElementById('emoteContainer').style.display = 'none';
        }
    },

    renderShopItems(cat) {
        const grid = (cat === 'coins' || cat === 'dna') ? document.getElementById('currencyGrid') : document.getElementById('itemsGrid');
        if (!grid) return;

        const items = this.shopItems[cat] || [];
        if (items.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #94a3b8; font-weight: 900;">PRÓXIMAMENTE</div>`;
            return;
        }

        grid.innerHTML = (cat === 'coins' ? `
            <div style="grid-column: 1/-1; background: linear-gradient(90deg, #facc1522, transparent); padding: 15px; border-left: 4px solid #facc15; margin-bottom: 10px; border-radius: 0 15px 15px 0;">
                <div style="font-weight: 950; color: #facc15; font-size: 0.9rem; letter-spacing: 1px;">¿CANSADO DE FARMEAR?</div>
                <div style="font-size: 0.7rem; color: #fff; opacity: 0.8; margin-top: 5px; font-weight: 700;">Salta el progreso lento y desbloquea todo el contenido Premium al instante.</div>
            </div>
        ` : '') + items.map(item => {
            let btnContent = `${item.type === 'coins' ? '💰' : (item.type === 'dna' ? '🧬' : 'USD ')} ${item.price}`;
            let btnColor = '#3b82f6';

            if (item.type === 'usd') {
                btnContent = `COMPRAR $${item.price}`;
                btnColor = 'linear-gradient(135deg, #22c55e, #16a34a)';
            }

            return `
            <div class="skin-card" style="overflow: visible;">
                ${item.tag ? `<div style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: #fff; font-size: 0.6rem; font-weight: 950; padding: 4px 8px; border-radius: 8px; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.3); animation: pulse 2s infinite;">${item.tag}</div>` : ''}
                <div style="font-size:2.5rem; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));">${item.icon}</div>
                <div style="font-weight:900; font-size:0.75rem; color:#fff; text-transform:uppercase; text-align:center;">${item.name}</div>
                <div style="font-size:0.6rem; color:#94a3b8; margin:10px 0; height:32px; text-align:center; line-height:1.2;">${item.desc}</div>
                <button class="item-price-btn" style="background:${btnColor}; border:none; box-shadow: 0 4px 15px rgba(0,0,0,0.2);" onclick="Menu.buyItem('${cat}', '${item.id}')">
                    ${btnContent}
                </button>
            </div>
        `}).join('');
    },

    buyItem(cat, itemId) {
        const item = (this.shopItems[cat] || []).find(i => i.id === itemId);
        if (!item) return;

        if (item.type === 'usd') {
            this.showAlert("COMPRA PREMIUM", `¿Deseas adquirir ${item.name} por $${item.price}?`, "💎", () => {
                // MÓDULO DE PAGO REAL (Simulado)
                if (window.AndroidBridge && window.AndroidBridge.processPurchase) {
                    window.AndroidBridge.processPurchase(item.id, item.price);
                } else {
                    console.log(`Procesando pago externo de $${item.price} para ${item.id}...`);
                    // Simular éxito inmediato para el usuario
                    const r = item.reward;
                    if (r.type === 'coins') window.Engine.addCoins(r.value);
                    else if (r.type === 'dna') window.Engine.addDna(r.value);
                    this.showAlert("PAGO COMPLETADO", `¡Has recibido ${r.value} ${r.type.toUpperCase()}!`, "✅");
                }
                this.updateMenuUI();
            }, () => {}, "COMPRAR", "CANCELAR");
            return;
        }

        const balance = parseInt(localStorage.getItem(item.type === 'coins' ? 'slipCoins' : 'slipDna') || 0);
        if (balance >= item.price) {
            let confirmTitle = "CONFIRMAR COMPRA";
            let confirmMsg = `¿Deseas comprar ${item.name} por ${item.price} ${item.type === 'coins' ? 'Monedas' : 'ADN'}?`;
            let confirmBtn = "ADQUIRIR";

            if (item.price === 0) {
                confirmTitle = "OBJETO GRATUITO";
                confirmMsg = `¿Deseas obtener ${item.name} gratis?`;
                confirmBtn = "OBTENER";
            }

            this.showAlert(confirmTitle, confirmMsg, item.icon, () => {
                // Cobrar
                if (item.type === 'coins') window.Engine.addCoins(-item.price);
                else window.Engine.addDna(-item.price);

                // Entregar Recompensa
                const r = item.reward;
                if (r) {
                    if (r.type === 'coins') window.Engine.addCoins(r.value);
                    else if (r.type === 'dna') window.Engine.addDna(r.value);
                    else if (r.type === 'bonus_mass') {
                        let key = r.temporary ? 'slip_temp_mass' : 'slip_bonus_mass';
                        let m = parseInt(localStorage.getItem(key) || 0);
                        localStorage.setItem(key, m + r.value);
                    } else if (r.type === 'bonus_speed') {
                        let key = r.temporary ? 'slip_temp_speed' : 'slip_bonus_speed';
                        let s = parseFloat(localStorage.getItem(key) || 0);
                        localStorage.setItem(key, s + r.value);
                    } else if (r.type === 'shield') {
                        let s = parseInt(localStorage.getItem('slip_shields') || 0);
                        localStorage.setItem('slip_shields', s + r.value);
                    } else if (r.type === 'unlock_effect') {
                        let effects = JSON.parse(localStorage.getItem('slip_unlocked_effects') || "[]");
                        if (!effects.includes(r.value)) effects.push(r.value);
                        localStorage.setItem('slip_unlocked_effects', JSON.stringify(effects));
                    } else if (r.type === 'unlock_emote') {
                        this.unlockEmote(r.value);
                    }
                }

                this.showAlert("¡ITEM ADQUIRIDO!", `${item.name} ha sido añadido a tu inventario.`, "✅");
                this.updateMenuUI();
                this.renderShopItems(cat);
            }, () => {}, confirmBtn, "CANCELAR");
        }
        else {
            const missing = item.price - balance;
            const currencyName = item.type === 'coins' ? 'Slip Coins' : 'ADN';
            this.showAlert("SALDO INSUFICIENTE", `Te faltan ${missing} ${currencyName}. ¿Quieres ir al Market a recargar y obtener ventajas exclusivas?`, "💰", () => {
                this.openShopCategory(item.type === 'coins' ? 'coins' : 'dna');
            }, () => {}, "RECARGAR AHORA", "LUEGO");
        }
    },

    drawSkinTexture(ctx, x, y, r, skinKey, isBot = false) {
        if (!skinKey) return;
        if (skinKey.startsWith('procedural_')) {
            const seed = parseInt(skinKey.split('_')[1]) || 1000;
            if (window.VisualEffects) window.VisualEffects.drawProceduralSkin(ctx, x, y, r, seed);
            return;
        }
        const img = this.skinImages[skinKey];
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
        } else {
            ctx.fillStyle = isBot ? "#ff6666" : "#4a90e2";
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
    },

    openShopMain() {
        document.querySelectorAll('.shop-content-view').forEach(v => v.classList.remove('active'));
        const m = document.getElementById('shopMainView');
        if(m) m.classList.add('active');
        document.getElementById('shopTitleText').innerText = "MARKET";
        this.updateShopCurrencies();
    },

    openShopCategory(cat) {
        document.querySelectorAll('.shop-content-view').forEach(v => v.classList.remove('active'));
        const title = document.getElementById('shopTitleText');
        if (cat === 'skins') {
            const v = document.getElementById('shopSkinsView');
            if(v) v.classList.add('active');
            title.innerText = "Skins";
            this.renderSkinList();
        } else if (['coins','dna'].includes(cat)) {
            const v = document.getElementById('shopCurrencyView');
            if(v) v.classList.add('active');
            title.innerText = cat === 'coins' ? "Dinero" : "Laboratorio";
            this.renderShopItems(cat);
        } else if (['mass','speed','potions','emotes'].includes(cat)) {
            const v = document.getElementById('shopItemsView');
            if(v) v.classList.add('active');
            title.innerText = cat==='mass'?'Maza':(cat==='speed'?'Velocidad':(cat==='emotes'?'Emotes':'Pociones'));
            this.renderShopItems(cat);
        }
    },

    updateShopCurrencies() {
        const c = localStorage.getItem('slipCoins') || 0, d = localStorage.getItem('slipDna') || 0;
        document.getElementById('dnaCount').innerText = d; document.getElementById('coinCount').innerText = c;
        const sd = document.getElementById('shopDnaCount'), sc = document.getElementById('shopCoinCount');
        if(sd) sd.innerText = d; if(sc) sc.innerText = c;
    },

    switchState(s) {
        if (this.currentState === s) return;
        this.previousState = this.currentState;
        this.currentState = s;

        const screens = ['menu', 'shopModal', 'pauseModal', 'gameOverScreen', 'profileModal', 'settingsModal', 'lanModal', 'missionsModal', 'dailyChest', 'levelUpModal', 'leaderboardModal', 'slipPassModal'];
        const target = this.getScreenIdFromState(s);
        const isModal = ['shopModal', 'profileModal', 'settingsModal', 'lanModal', 'missionsModal', 'dailyChest', 'levelUpModal', 'leaderboardModal', 'slipPassModal'].includes(target);

        // Determinar si debemos mostrar el fondo del menú
        const showMenuBg = (s === this.STATES.MENU) || (isModal && (this.previousState === this.STATES.MENU || this.previousState.startsWith('ESTADO_')));

        screens.forEach(id => {
            const el = document.getElementById(id); if (!el) return;
            if (id === target) {
                el.style.display = 'flex';
                // Pequeño delay para que la transición de opacidad funcione
                requestAnimationFrame(() => el.classList.add('is-open'));
            } else if (id === 'menu' && showMenuBg) {
                el.style.display = 'flex';
                el.classList.add('is-open');
            } else {
                if (!(id === 'menu' && showMenuBg)) {
                    el.classList.remove('is-open');
                    // Solo ocultar después de que la transición termine
                    setTimeout(() => {
                        if (this.currentState !== this.getStateFromScreenId(id) && !el.classList.contains('is-open')) {
                            el.style.display = 'none';
                        }
                    }, 300);
                }
            }
        });

        if (s === this.STATES.TIENDA) this.openShopMain();
        if (s === this.STATES.MENU) this.updateMenuUI();
        if (s === 'ESTADO_GLOBAL') this.renderGlobalLeaderboard();
        if (s === 'ESTADO_PASS') this.renderSlipPass();
        if (s === 'ESTADO_AJUSTES') this.updateQualityButtons();

        const inGame = (s === this.STATES.JUEGO || s === this.STATES.PAUSA);
        const gameUI = document.getElementById('gameplayUI');
        if (gameUI) {
            gameUI.style.display = inGame ? 'block' : 'none';
            requestAnimationFrame(() => gameUI.style.opacity = inGame ? '1' : '0');
        }

        const hud = document.getElementById('hudTopGroup');
        const isMenuOrModal = (s === this.STATES.MENU) || isModal;
        if (hud) hud.style.display = isMenuOrModal ? 'block' : 'none';

        this.renderAllIcons();
    },

    getScreenIdFromState(s) {
        const map = { [this.STATES.MENU]: 'menu', [this.STATES.TIENDA]: 'shopModal', [this.STATES.PAUSA]: 'pauseModal', [this.STATES.MUERTE]: 'gameOverScreen', [this.STATES.PERFIL]: 'profileModal', 'ESTADO_AJUSTES': 'settingsModal', 'ESTADO_LAN': 'lanModal', 'ESTADO_MISIONES': 'missionsModal', 'ESTADO_REGALO': 'dailyChest', 'ESTADO_GLOBAL': 'leaderboardModal', 'ESTADO_PASS': 'slipPassModal' };
        return map[s];
    },

    getStateFromScreenId(id) {
        const map = { 'menu': this.STATES.MENU, 'shopModal': this.STATES.TIENDA, 'pauseModal': this.STATES.PAUSA, 'gameOverScreen': this.STATES.MUERTE, 'profileModal': this.STATES.PERFIL, 'settingsModal': 'ESTADO_AJUSTES', 'lanModal': 'ESTADO_LAN', 'missionsModal': 'ESTADO_MISIONES', 'dailyChest': 'ESTADO_REGALO', 'leaderboardModal': 'ESTADO_GLOBAL', 'slipPassModal': 'ESTADO_PASS' };
        return map[id];
    },

    openProfile() {
        this.switchState(this.STATES.PERFIL);
        const p = window.progression || { passLevel: 1, slipXP: 0 };
        const modalTitle = document.querySelector('#profileModal .modal-title');
        if (modalTitle) modalTitle.innerHTML = `Mi Perfil <small style="font-size: 0.8rem; opacity: 0.6;">(Lvl ${p.passLevel})</small>`;

        // Actualización de estadísticas con valores reales
        const getStat = (key) => localStorage.getItem(key) || 0;
        document.getElementById('statMaxMass').innerText = Math.floor(getStat('slip_max_mass'));
        document.getElementById('statTotalGames').innerText = getStat('slip_total_games');
        document.getElementById('statTotalEaten').innerText = getStat('slip_total_eaten');
        document.getElementById('statMaxSurvived').innerText = (getStat('slip_max_survived') || 0) + "s";
        document.getElementById('statCoins').innerText = getStat('slipCoins');

        const inp = document.getElementById('profileNameInput'); if (inp && this.user) inp.value = this.user.name;
        this.syncSkinImages();
    },

    checkAuthSession() {
        if (!localStorage.getItem('slip_app_initialized')) {
            localStorage.clear();
            localStorage.setItem('slip_app_initialized', 'true');
        }

        // MÓDULO 3: RECONSTRUCCIÓN DE INTEGRIDAD (Anti-Crash LocalStorage)
        try {
            const saved = localStorage.getItem('slip_user_data');
            if (saved && saved !== "undefined") this.user = JSON.parse(saved);
        } catch (e) { console.error("Error al cargar user_data", e); this.user = null; }

        if (!this.user || !this.user.name) {
            this.user = { id: 'guest', name: localStorage.getItem('guest_name') || "Invitado", picture: "ui/images/skins gratis/Free (1).png" };
        }

        // Validación de skins compradas
        const userId = this.user.id || 'guest';
        try {
            const pSkins = localStorage.getItem(`purchasedSkins_${userId}`);
            if (!pSkins || pSkins === "undefined" || pSkins === "null") {
                localStorage.setItem(`purchasedSkins_${userId}`, JSON.stringify(["skins gratis/Free (1).png"]));
            }
        } catch(e) {
            localStorage.setItem(`purchasedSkins_${userId}`, JSON.stringify(["skins gratis/Free (1).png"]));
        }

        document.getElementById('userNameDisplay').innerText = this.user.name;
        document.getElementById('playerName').value = this.user.name;
        const loading = document.getElementById('loadingOverlay'), bar = document.getElementById('loadingBarFill');
        if (loading) {
            let progress = 0;
            const timer = setInterval(() => {
                progress += 5; bar.style.width = progress + '%';
                if (progress >= 100) { clearInterval(timer); setTimeout(() => { loading.classList.remove('is-open'); setTimeout(() => { loading.style.display = 'none'; if (!this.currentState) this.switchState(this.STATES.MENU); }, 500); }, 200); }
            }, 50);
        }
    },

    updateMenuUI() {
        console.log("Slip Game: Actualizando UI del Menú...");
        let data = JSON.parse(localStorage.getItem('slip_prog') || "{\"lvl\":1, \"xp\":0}");
        const p = window.progression || { passLevel: data.lvl, slipXP: data.xp, rankPoints: 0 };
        const rank = this.getRankInfo(p.rankPoints || 0);

        const rBadge = document.getElementById('rankBadge'), rName = document.getElementById('rankNameDisplay');
        if (rBadge) {
            rBadge.className = `rank-emblem ${rank.class}`;
            rBadge.innerHTML = `<span class="rank-tag-text">${rank.tag}</span>`;
            rBadge.style.borderColor = rank.color;
            rBadge.style.boxShadow = `0 0 15px ${rank.color}44`;
        }

        if (rName) {
            rName.innerHTML = `<span style="color:${rank.color}; filter: drop-shadow(0 0 5px ${rank.color}66);">${rank.name}</span>`;
        }

        const uNameDisp = document.getElementById('userNameDisplay');
        if (uNameDisp) uNameDisp.innerHTML = `${this.user.name} <span style="font-size: 0.65rem; color: #94a3b8; opacity: 0.7;">Lvl ${p.passLevel}</span>`;

        const bar = document.getElementById('profileXPFill');
        if (bar) bar.style.width = `${Math.min(100, (p.slipXP / 1000) * 100)}%`;

        this.updateShopCurrencies();
        this.syncSkinImages();
    },

    syncSkinImages() {
        if (!this.currentSkin) return;
        const s = this.skins[this.currentSkin] || { id: this.currentSkin, url: 'ui/images/skins gratis/Free (1).png' };
        let finalUrl = s.url;
        if (this.currentSkin.startsWith('procedural_')) {
            const seed = parseInt(this.currentSkin.split('_')[1]) || 1000, cv = document.createElement('canvas'); cv.width = 150; cv.height = 150;
            if (window.VisualEffects) { window.VisualEffects.drawProceduralSkin(cv.getContext('2d'), 75, 75, 60, seed); finalUrl = cv.toDataURL(); }
        }
        ['userAvatar', 'profileAvatarLarge'].forEach(id => { const el = document.getElementById(id); if (el) el.src = finalUrl; });
        if (this.user) { this.user.picture = finalUrl; localStorage.setItem('slip_user_data', JSON.stringify(this.user)); }
        localStorage.setItem('selectedSkin', this.currentSkin);
    },

    showLevelUp(oldL, newL) {
        document.getElementById('lvlOld').innerText = oldL; document.getElementById('lvlNew').innerText = newL;
        const modal = document.getElementById('levelUpModal'); if (modal) { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('is-open'), 50); }
    },

    syncCloud() { if (this.user && window.AndroidBridge) window.AndroidBridge.saveToCloud(JSON.stringify({ name: this.user.name, coins: localStorage.getItem('slipCoins') })); },

    startGame() {
        const name = document.getElementById('playerName').value.trim() || this.user.name;
        Player.name = name; Player.skinKey = this.currentSkin;
        if (this.user.id === 'guest') localStorage.setItem('guest_name', name);
        this.switchState(this.STATES.JUEGO); if (window.Engine) window.Engine.start();
    },

    getRankInfo(rp) {
        if (rp >= 5000) return { name: "OVERLORD", class: "god", tag: "Ω", color: "#facc15" };
        if (rp >= 2500) return { name: "TITÁN", class: "titan", tag: "T", color: "#a855f7" };
        if (rp >= 1200) return { name: "PREDADOR", class: "predator", tag: "P", color: "#ef4444" };
        if (rp >= 400) return { name: "CYBORG", class: "cyborg", tag: "C", color: "#3b82f6" };
        return { name: "VIRUS", class: "virus", tag: "V", color: "#94a3b8" };
    },

    showGameOver(mass, stats) {
        this.switchState(this.STATES.MUERTE);
        document.getElementById('finalMass').innerText = Math.floor(mass);
        document.getElementById('coinsGained').innerText = `+${stats.gained_coins || 0}`;
        document.getElementById('lvlDisplay').innerText = `⭐ Nivel ${stats.lvl}`;
        document.getElementById('xpGainedText').innerText = `+${stats.gained} XP`;
        document.getElementById('xpBarFill').style.width = `${(stats.xp / stats.threshold) * 100}%`;
    }
};

window.Menu = Menu;
