var Menu = {
    STATES: { MENU: 'ESTADO_MENU', TIENDA: 'ESTADO_TIENDA', JUEGO: 'ESTADO_JUEGO', PAUSA: 'ESTADO_PAUSA', MUERTE: 'ESTADO_GAME_OVER' },
    currentState: '',
    previousState: '',
    currentSkin: '',
    user: null,
    currentSkinFilter: 'premium',
    skins: {},
    skinImages: {},
    shopItems: {
        mass: [
            { id: 'mass_1', name: 'Masa +50', price: 50, type: 'coins', icon: '⚖️', desc: 'Inicia con 50 más de masa' },
            { id: 'mass_2', name: 'Masa +150', price: 120, type: 'coins', icon: '⚖️', desc: 'Inicia con 150 más de masa' }
        ],
        speed: [
            { id: 'speed_1', name: 'Turbo', price: 80, type: 'coins', icon: '⚡', desc: '5% más de velocidad base' }
        ],
        potions: [
            { id: 'potion_1', name: 'Escudo', price: 3, type: 'dna', icon: '🧪', desc: 'Protección contra 1 virus' }
        ],
        coins: [
            { id: 'coins_pack_1', name: 'Mini Pack', price: 1, type: 'dna', icon: '💰', desc: 'Intercambia 1 ADN por 100 Monedas' }
        ],
        dna: [
            { id: 'dna_pack_1', name: 'ADN Pack', price: 500, type: 'coins', icon: '🧬', desc: 'Intercambia 500 Monedas por 2 ADN' }
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
        bind('closeProfile', () => this.switchState(this.STATES.MENU));
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
            { id: 'icon_cat_speed', type: 'lan' }, { id: 'icon_cat_potions', type: 'settings' },
            { id: 'icon_cat_coins', type: 'coin' }, { id: 'icon_cat_dna', type: 'dna' },
            { id: 'icon_split', type: 'split' }, { id: 'icon_eject', type: 'eject' },
            { id: 'icon_pause', type: 'pause' }, { id: 'icon_lb_toggle', type: 'lb_toggle' }
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
            else if (isPremium) { name = ["Galáctica", "Cibernética", "Fénix", "Ártico", "Sombra", "Oro", "Diamante", "Rubí", "Infinito", "Caos", "Nova", "Dragón", "Samurái", "Ninja", "Robot", "Alien", "Cósmico", "Titanio", "Obsidiana", "Relámpago", "Quásar", "Espectral", "Místico", "Supremo"][(num-1)%24] || "Premium " + num; if (num % 8 === 0) { rarity = 'LEGENDARIA'; price = 65; } else if (num % 3 === 0) { rarity = 'ÉPICA'; price = 40; } else { rarity = 'COMÚN'; price = 20; } }
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
            const owned = purchased.includes(key) || (s.price === 0 && !s.level && !s.exclusive) || (s.price === 0 && !s.exclusive && !locked);
            const card = document.createElement('div'); card.className = `skin-card ${isSelected ? 'active' : ''} rarity-${s.rarity.toLowerCase()}`;
            let btnTxt = isSelected ? "EQUIPADA" : (owned ? "SELECCIONAR" : (locked ? `NIVEL ${s.level}` : (s.exclusive ? "BLOQUEADO" : `💰 ${s.price}`)));
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
            card.onclick = () => { if (owned) { this.currentSkin = key; this.updateMenuUI(); this.renderSkinList(); } else if (locked || s.exclusive) alert(s.req || "Nivel insuficiente"); else this.buySkin(key); };
            grid.appendChild(card);
        });
    },

    filterSkins(f) { this.currentSkinFilter = f; document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.getAttribute('onclick').includes(f))); this.renderSkinList(); },

    buySkin(key) {
        const s = this.skins[key];
        if (!s) return;

        const cur = parseInt(localStorage.getItem('slipCoins') || 0);
        if (cur >= s.price) {
            if (confirm(`¿Comprar ${s.name}?`)) {
                // Sincronización Triple (Memoria, UI, Almacenamiento)
                const newBalance = cur - s.price;
                localStorage.setItem('slipCoins', newBalance);
                if (window.progression) window.progression.slipCoins = newBalance; // Si se usa en progression

                let p = JSON.parse(localStorage.getItem(`purchasedSkins_${this.user.id}`) || "[]");
                if (!p.includes(key)) p.push(key);
                localStorage.setItem(`purchasedSkins_${this.user.id}`, JSON.stringify(p));

                this.currentSkin = key;
                this.updateMenuUI();
                this.renderSkinList();
                this.updateShopCurrencies();
                this.syncCloud();
            }
        } else {
            alert("Slip Coins insuficientes para esta skin.");
        }
    },

    renderSlipPass() {
        const list = document.getElementById('passRewardsList');
        if (!list) return;
        const p = window.progression || { passLevel: 1, slipXP: 0, claimedRewards: [] };

        const lvlEl = document.getElementById('passLvlText'), xpText = document.getElementById('passXPText'), xpFill = document.getElementById('passXPFill'), pctText = document.getElementById('passPercentText');
        if (lvlEl) lvlEl.innerText = p.passLevel;
        if (xpText) xpText.innerText = `${p.slipXP} / 1000 XP`;
        const percent = Math.floor((p.slipXP / 1000) * 100);
        if (xpFill) xpFill.style.width = percent + '%';
        if (pctText) pctText.innerText = `${percent}% COMPLETADO`;

        const rewards = [];
        for (let i = 1; i <= 20; i++) {
            let reward = { lvl: i, name: `CRÉDITOS SLIP`, type: 'coins', value: 50, icon: '💰' };
            if (i % 5 === 0) {
                const seed = 1000 + (i * 7);
                reward = { lvl: i, name: `SKIN PROTOCOLO`, type: 'skin', value: `procedural_${seed}`, icon: '🎭' };
            } else if (i % 3 === 0) {
                reward = { lvl: i, name: `FRAGMENTO ADN`, type: 'dna', value: 5, icon: '🧬' };
            }
            rewards.push(reward);
        }

        list.innerHTML = rewards.map(r => {
            const locked = r.lvl > p.passLevel, claimed = (p.claimedRewards || []).includes(r.lvl);
            let btnTxt = locked ? "BLOQUEADO" : (claimed ? "RECLAMADO" : "RECLAMAR");
            let btnClass = locked || claimed ? "disabled" : "";
            return `<div class="pass-reward-card ${locked ? 'locked' : ''} ${claimed ? 'claimed' : ''}"><div class="pass-reward-lvl">NIVEL ${r.lvl}</div><div class="pass-reward-icon">${r.icon}</div><div class="pass-reward-name">${r.name}</div><button class="pass-claim-btn ${btnClass}" onclick="Menu.claimPassReward(${r.lvl})">${btnTxt}</button></div>`;
        }).join('');
    },

    claimPassReward(lvl) {
        const p = window.progression;
        if (!p || lvl > p.passLevel || (p.claimedRewards || []).includes(lvl)) return;
        if (!p.claimedRewards) p.claimedRewards = [];
        p.claimedRewards.push(lvl);
        if (lvl % 5 === 0) {
            const skinId = `procedural_${1000 + (lvl * 7)}`;
            let pur = JSON.parse(localStorage.getItem(`purchasedSkins_${this.user.id}`) || "[]");
            if (!pur.includes(skinId)) { pur.push(skinId); localStorage.setItem(`purchasedSkins_${this.user.id}`, JSON.stringify(pur)); }
        } else if (lvl % 3 === 0) { window.Engine.addDna(5); } else { window.Engine.addCoins(50); }
        window.Engine.saveProgression(); this.renderSlipPass(); this.updateMenuUI();
    },

    renderShopItems(cat) {
        const grid = (cat === 'coins' || cat === 'dna') ? document.getElementById('currencyGrid') : document.getElementById('itemsGrid');
        if (!grid) return;

        const items = this.shopItems[cat] || [];
        if (items.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #94a3b8; font-weight: 900;">PRÓXIMAMENTE</div>`;
            return;
        }

        grid.innerHTML = items.map(item => `
            <div class="skin-card">
                <div style="font-size:2.5rem; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));">${item.icon}</div>
                <div style="font-weight:900; font-size:0.75rem; color:#fff; text-transform:uppercase; text-align:center;">${item.name}</div>
                <div style="font-size:0.6rem; color:#94a3b8; margin:10px 0; height:32px; text-align:center; line-height:1.2;">${item.desc}</div>
                <button class="item-price-btn" style="background:#3b82f6;" onclick="Menu.buyItem('${cat}', '${item.id}')">
                    ${item.type === 'coins' ? '💰' : '🧬'} ${item.price}
                </button>
            </div>
        `).join('');
    },

    buyItem(cat, itemId) {
        const item = (this.shopItems[cat] || []).find(i => i.id === itemId);
        if (!item) return;
        const balance = parseInt(localStorage.getItem(item.type === 'coins' ? 'slipCoins' : 'slipDna') || 0);
        if (balance >= item.price) {
            // Cobrar
            if (item.type === 'coins') window.Engine.addCoins(-item.price);
            else window.Engine.addDna(-item.price);

            // Entregar Recompensa
            if (cat === 'coins') window.Engine.addCoins(100);
            else if (cat === 'dna') window.Engine.addDna(2);
            else if (cat === 'mass') {
                let m = parseInt(localStorage.getItem('slip_bonus_mass') || 0);
                localStorage.setItem('slip_bonus_mass', m + (item.id === 'mass_1' ? 50 : 150));
            }

            alert(`¡Comprado: ${item.name}!`);
            this.updateMenuUI();
            this.renderShopItems(cat);
        }
        else alert("Saldo insuficiente");
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
        } else if (['mass','speed','potions'].includes(cat)) {
            const v = document.getElementById('shopItemsView');
            if(v) v.classList.add('active');
            title.innerText = cat==='mass'?'Maza':(cat==='speed'?'Velocidad':'Pociones');
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
        if (hud) hud.style.display = (s === this.STATES.MENU) ? 'block' : 'none';

        this.renderAllIcons();
    },

    getScreenIdFromState(s) {
        const map = { [this.STATES.MENU]: 'menu', [this.STATES.TIENDA]: 'shopModal', [this.STATES.PAUSA]: 'pauseModal', [this.STATES.MUERTE]: 'gameOverScreen', 'ESTADO_PERFIL': 'profileModal', 'ESTADO_AJUSTES': 'settingsModal', 'ESTADO_LAN': 'lanModal', 'ESTADO_MISIONES': 'missionsModal', 'ESTADO_REGALO': 'dailyChest', 'ESTADO_GLOBAL': 'leaderboardModal', 'ESTADO_PASS': 'slipPassModal' };
        return map[s];
    },

    getStateFromScreenId(id) {
        const map = { 'menu': this.STATES.MENU, 'shopModal': this.STATES.TIENDA, 'pauseModal': this.STATES.PAUSA, 'gameOverScreen': this.STATES.MUERTE, 'profileModal': 'ESTADO_PERFIL', 'settingsModal': 'ESTADO_AJUSTES', 'lanModal': 'ESTADO_LAN', 'missionsModal': 'ESTADO_MISIONES', 'dailyChest': 'ESTADO_REGALO', 'leaderboardModal': 'ESTADO_GLOBAL', 'slipPassModal': 'ESTADO_PASS' };
        return map[id];
    },

    openProfile() {
        this.switchState('ESTADO_PERFIL');
        const p = window.progression || { passLevel: 1, slipXP: 0 };
        const modalTitle = document.querySelector('#profileModal .modal-title');
        if (modalTitle) modalTitle.innerHTML = `Mi Perfil <small style="font-size: 0.8rem; opacity: 0.6;">(Lvl ${p.passLevel})</small>`;
        document.getElementById('statMaxMass').innerText = Math.floor(localStorage.getItem('slip_max_mass') || 0);
        document.getElementById('statTotalGames').innerText = localStorage.getItem('slip_total_games') || 0;
        document.getElementById('statTotalEaten').innerText = localStorage.getItem('slip_total_eaten') || 0;
        document.getElementById('statCoins').innerText = localStorage.getItem('slipCoins') || 0;
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
