const Player = {
    name: "Jugador", skinKey: "skins gratis/Free (1).png", isDead: false, gameState: "MENU",
    cells: [], maxMass: 0, level: 1,
    killStreak: 0, lastKillTime: 0, equippedAura: localStorage.getItem('slip_equipped_aura') || null,
    activeEmote: null, bonusSpeed: 0,

    getMass() { return this.cells.reduce((sum, c) => sum + c.mass, 0); },
    getCenter() {
        if (this.cells.length === 0) return { x: 2500, y: 2500 };
        let sx = 0, sy = 0;
        for (const c of this.cells) { sx += c.x; sy += c.y; }
        return { x: sx / this.cells.length, y: sy / this.cells.length };
    },
    isPlaying() { return this.gameState === "PLAYING"; },

    startGame() {
        let data = {lvl:1, xp:0};
        try {
            const saved = localStorage.getItem('slip_prog');
            if (saved && saved !== "undefined") data = JSON.parse(saved);
        } catch (e) {}

        this.level = data.lvl;
        this.gameState = "PLAYING"; this.isDead = false;

        // Cargar Masa Extra de la Tienda
        const permMass = parseInt(localStorage.getItem('slip_bonus_mass') || 0);
        const tempMass = parseInt(localStorage.getItem('slip_temp_mass') || 0);
        localStorage.setItem('slip_temp_mass', 0); // Consumir para esta partida
        const startMass = 30 + permMass + tempMass;
        const startRadius = 30 * Math.sqrt(startMass / 30);

        // Cargar Velocidad Extra
        const permSpeed = parseFloat(localStorage.getItem('slip_bonus_speed') || 0);
        const tempSpeed = parseFloat(localStorage.getItem('slip_temp_speed') || 0);
        localStorage.setItem('slip_temp_speed', 0); // Consumir
        this.bonusSpeed = permSpeed + tempSpeed;

        this.cells = [{
            x: 2500, y: 2500, mass: startMass, radius: startRadius, visualRadius: startRadius, targetRadius: startRadius,
            vx: 0, vy: 0, mergeTimer: 0,
            points: this.initSpringPoints(startRadius),
            seed: Math.random() * 100
        }];
        this.maxMass = startMass;
        if (window.Engine) window.Engine.startTime = Date.now();
    },

    initSpringPoints(radius) {
        const pts = [];
        const numPoints = (window.CONFIG && window.CONFIG.visualEffects) ? window.CONFIG.visualEffects.organicPoints : 16;
        if (numPoints <= 0) return []; // Calidad baja: sin resortes
        for(let i=0; i<numPoints; i++) {
            const angle = (i/numPoints) * Math.PI * 2;
            pts.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, vx: 0, vy: 0 });
        }
        return pts;
    },

    updateSprings(cell) {
        const pts = cell.points;
        if (!pts || pts.length === 0) return;
        const k = 0.12, damp = 0.88;
        // Reducimos el factor de inercia (0.25 -> 0.1) para que la skin no se "despegue" tanto del centro
        const inertia = 0.1;
        for(let i=0; i<pts.length; i++) {
            const p = pts[i], angle = (i/pts.length) * Math.PI * 2;
            const tx = Math.cos(angle) * cell.visualRadius, ty = Math.sin(angle) * cell.visualRadius;
            p.vx += (tx - p.x) * k - cell.vx * inertia;
            p.vy += (ty - p.y) * k - cell.vy * inertia;
            p.vx *= damp; p.vy *= damp;
            p.x += p.vx; p.y += p.vy;
        }
    },

    split() {
        if (!this.isPlaying() || this.cells.length >= 16) return;
        const newCells = [];
        const mx = window.mouse.targetX - window.innerWidth/2, my = window.mouse.targetY - window.innerHeight/2;
        const d = Math.hypot(mx, my) || 1;
        const dx = mx / d, dy = my / d;

        for (const cell of this.cells) {
            if (cell.mass < 35 || (newCells.length + this.cells.length) >= 16) {
                newCells.push(cell); continue;
            }
            const newMass = cell.mass / 2;
            cell.mass = newMass;
            cell.targetRadius = 30 * Math.sqrt(cell.mass / 30);
            cell.radius = cell.targetRadius; // Ajuste inmediato de colisión
            cell.mergeTimer = 15;

            newCells.push(cell);
            newCells.push({
                x: cell.x + dx * cell.radius,
                y: cell.y + dy * cell.radius,
                mass: newMass, radius: cell.targetRadius,
                visualRadius: 0, // Empezar desde 0 para efecto visual de crecimiento
                targetRadius: cell.targetRadius,
                vx: dx * 32, vy: dy * 32,
                mergeTimer: 20, seed: Math.random() * 100,
                points: this.initSpringPoints(cell.targetRadius)
            });
            if (window.VisualEffects) {
                window.VisualEffects.createExplosion(cell.x, cell.y, "#fff", 8);
                // MÓDULO 4: Onda de Impacto (Shockwave)
                if (window.VisualEffects.createShockwave) window.VisualEffects.createShockwave(cell.x, cell.y);
            }
        }
        this.cells = newCells;
    },

    ejectMass() {
        if (!this.isPlaying()) return;
        const mx = window.mouse.targetX - window.innerWidth/2, my = window.mouse.targetY - window.innerHeight/2;
        const d = Math.hypot(mx, my) || 1;
        const dx = mx / d, dy = my / d;
        for (const cell of this.cells) {
            if (cell.mass < 35) continue;
            cell.mass -= 8;
            cell.targetRadius = 30 * Math.sqrt(cell.mass / 30);
            Food.addEjectedMass(cell.x + dx * (cell.radius + 10), cell.y + dy * (cell.radius + 10), dx*18, dy*18, cell, 8);
        }
    },

    onEatenBy(attacker) {
        if (this.isDead) return;
        this.cells = [];
        this.isDead = true;
        if (window.VisualEffects) {
            window.VisualEffects.createExplosion(attacker.x, attacker.y, "#ff4444", 15);
        }
    },

    update(mouse) {
        if (this.isDead) return;
        const damping = 0.94;
        const worldWidth = window.World ? window.World.width : 5000;
        const worldHeight = window.World ? window.World.height : 5000;

        // 1. Movimiento y actualización de cada celda
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            const dx = mouse.x - window.innerWidth/2, dy = mouse.y - window.innerHeight/2;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;

            const speedLimit = (18 / Math.sqrt(cell.mass)) + 0.35 + this.bonusSpeed;

            const accel = 0.22 + (this.bonusSpeed * 0.5);
            cell.vx += (dx / dist) * accel;
            cell.vy += (dy / dist) * accel;
            cell.vx *= damping; cell.vy *= damping;

            const curSpeed = Math.sqrt(cell.vx*cell.vx + cell.vy*cell.vy);
            if(curSpeed > speedLimit) {
                const f = speedLimit / curSpeed;
                cell.vx *= f; cell.vy *= f;
            }

            cell.x += cell.vx; cell.y += cell.vy;
            cell.radius += (cell.targetRadius - cell.radius) * 0.1;
            cell.visualRadius += (cell.radius - cell.visualRadius) * 0.1;
            this.updateSprings(cell);

            if (cell.mergeTimer > 0) cell.mergeTimer -= 0.016;

            // 2. Colisiones internas (entre celdas del propio jugador) - Única "Pared" Física
            for (let j = i + 1; j < this.cells.length; j++) {
                const other = this.cells[j];
                const dX = cell.x - other.x, dY = cell.y - other.y;
                const d2 = dX*dX + dY*dY;
                const minD = cell.radius + other.radius;

                if (d2 < minD * minD) {
                    const d = Math.sqrt(d2) || 0.1;
                    if (cell.mergeTimer <= 0 && other.mergeTimer <= 0) {
                        // Unirse
                        cell.mass += other.mass;
                        cell.targetRadius = 30 * Math.sqrt(cell.mass / 30);
                        this.cells.splice(j, 1); j--;
                        if (window.VisualEffects) window.VisualEffects.createExplosion(cell.x, cell.y, "#fff", 5);
                    } else {
                        // Empuje físico firme ("Pared") solo entre células propias
                        const overlap = (minD - d);
                        const nx = dX / d, ny = dY / d;
                        const force = Math.min(overlap * 0.25, 10); // Limitar fuerza para evitar saltos locos
                        cell.vx += nx * force; cell.vy += ny * force;
                        other.vx -= nx * force; other.vy -= ny * force;
                        // Cohesión para mantener el grupo unido
                        const cohesion = 0.08;
                        cell.vx -= nx * cohesion; cell.vy -= ny * cohesion;
                        other.vx += nx * cohesion; other.vy += ny * cohesion;
                    }
                }
            }

            // 3. Colisiones externas (Bots) - Basado en Masa (11%) y Solapamiento (39%)
            const massDiff = 1.11;
            for(let j = Bots.items.length - 1; j >= 0; j--) {
                const bot = Bots.items[j];
                const dX = cell.x - bot.x, dY = cell.y - bot.y;
                const d2 = dX*dX + dY*dY;

                const sumR = cell.radius + bot.radius;
                if (d2 < sumR * sumR) {
                    const d = Math.sqrt(d2) || 1;
                    const canEatBot = cell.mass > bot.mass * massDiff;
                    const canBotEatMe = bot.mass > cell.mass * massDiff;

                    if (canEatBot && d < cell.radius - bot.radius * 0.39) {
                        if(window.VisualEffects) window.VisualEffects.spawnVictim(bot, cell);
                        cell.mass += bot.mass * 0.9;
                        cell.targetRadius = 30 * Math.sqrt(cell.mass / 30);

                        // MÓDULO 2: LIMPIEZA INMEDIATA DE MEMORIA (QA REQ)
                        Bots.items.splice(j, 1);
                        setTimeout(() => {
                            if (Bots.items.length < 50) Bots.items.push(Bots.createBot());
                        }, 3000);

                        if(window.Engine) window.Engine.trackMission('bots');

                        let totalEaten = parseInt(localStorage.getItem('slip_total_eaten') || 0);
                        localStorage.setItem('slip_total_eaten', totalEaten + 1);

                        // MÓDULO 4: Sistema de Killstreaks
                        const now = Date.now();
                        if (now - this.lastKillTime < 10000) {
                            this.killStreak++;
                        } else {
                            this.killStreak = 1;
                        }
                        this.lastKillTime = now;
                        if (window.HUD && window.HUD.announceKill) window.HUD.announceKill(this.killStreak);
                    }
                    else if (canBotEatMe && d < bot.radius - cell.radius * 0.39) {
                        if(window.VisualEffects) window.VisualEffects.spawnVictim(cell, bot);
                        bot.mass += cell.mass * 0.9;
                        bot.targetRadius = 30 * Math.sqrt(bot.mass / 30);
                        this.cells.splice(i, 1); i--;
                        if(this.cells.length === 0) this.isDead = true;
                        break;
                    }
                    // Quitar paredes externas: Jugador y Bots se sobreponen siempre (interpolan) libremente.
                }
            }

            // MÓDULO 1: Límites Físicos Estrictos (Anti-Gris)
            cell.x = Math.max(0, Math.min(window.World ? window.World.width : 5000, cell.x));
            cell.y = Math.max(0, Math.min(window.World ? window.World.height : 5000, cell.y));
        }

        if (this.activeEmote) {
            this.activeEmote.time--;
            if (this.activeEmote.time <= 0) this.activeEmote = null;
        }

        const mass = this.getMass();
        if (mass > this.maxMass) this.maxMass = mass;
    },

    renderCell(ctx, camera, cell) {
        // MÓDULO 3: OPTIMIZACIÓN EXTREMA DE AURAS Y DIVISIONES
        // Si el jugador está dividido, solo renderizar efectos en el fragmento más grande
        const isMainFragment = (cell === this.cells.sort((a,b) => b.mass - a.mass)[0]);
        const isDivided = this.cells.length > 1;

        const sx = cell.x - camera.x, sy = cell.y - camera.y;
        const r = cell.visualRadius;
        const visuals = (window.CONFIG && window.CONFIG.visuals) ? window.CONFIG.visuals : { renderBorders: true };
        const pts = cell.points;

        let vcx = sx, vcy = sy;
        if (pts && pts.length > 0) {
            let ox = 0, oy = 0;
            for(let i=0; i<pts.length; i++) { ox += pts[i].x; oy += pts[i].y; }
            vcx = sx + (ox / pts.length);
            vcy = sy + (oy / pts.length);
        }

        const isLow = (window.CONFIG && window.CONFIG.quality === 'low');

        // MÓDULO 3: Renderizado de Aura (SOLO SI ES EL PRINCIPAL O NO ESTÁ DIVIDIDO)
        const currentRP = (window.progression && window.progression.rankPoints) || 0;
        const isGod = currentRP >= 2000;
        if (!isLow && window.VisualEffects && window.VisualEffects.renderAura && (!isDivided || isMainFragment)) {
            if (this.equippedAura || isGod) {
                window.VisualEffects.renderAura(ctx, vcx, vcy, r, this.equippedAura || 'fire');
            }
        }

        ctx.save();

        // Renderizado del cuerpo
        if (pts && pts.length > 0) {
            ctx.beginPath();
            ctx.moveTo((pts[0].x + pts[pts.length-1].x)/2 + sx, (pts[0].y + pts[pts.length-1].y)/2 + sy);
            for(let k=0; k<pts.length; k++) {
                const p = pts[k], next = pts[(k+1)%pts.length];
                ctx.quadraticCurveTo(p.x + sx, p.y + sy, (p.x + next.x)/2 + sx, (p.y + next.y)/2 + sy);
            }
            ctx.closePath();
        } else {
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
        }

        // Borde dinámico
        if (visuals.renderBorders) {
            ctx.lineWidth = Math.max(3, r * 0.05);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.stroke();
        }

        ctx.clip();

        // Dibujamos la skin centrada en el centro visual calculado
        if (window.Menu) window.Menu.drawSkinTexture(ctx, vcx, vcy, r, this.skinKey, true);

        ctx.restore();

        // MÓDULO 2: Renderizado de Insignia de Rango
        if (window.VisualEffects && window.VisualEffects.drawBadge) {
            let rankId = 'virus';
            if (currentRP >= 2500) rankId = 'deidad';
            else if (currentRP >= 1200) rankId = 'espectro';
            else if (currentRP >= 600) rankId = 'titan';
            else if (currentRP >= 200) rankId = 'mutante';
            window.VisualEffects.drawBadge(ctx, vcx, vcy - r - 10, r * 0.4, rankId);
        }

        // Texto del jugador (SOLO SI ES EL PRINCIPAL O NO ESTÁ DIVIDIDO)
        if (!isDivided || isMainFragment) {
            if (this.activeEmote) {
                ctx.save();
                ctx.font = `${r * 0.8}px Inter`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                // Efecto flotante
                const bounce = Math.sin(Date.now() * 0.01) * 5;
                ctx.fillText(this.activeEmote.text, vcx, vcy - r - 40 + bounce);
                ctx.restore();
            }

            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${Math.max(12, r * 0.3)}px Inter`;
            ctx.textAlign = "center";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
            ctx.lineWidth = 2;

            if (visuals.shadowBlur > 20) {
                ctx.shadowBlur = 4;
                ctx.shadowColor = "black";
            }

            ctx.strokeText(this.name, vcx, vcy - 2);
            ctx.fillText(this.name, vcx, vcy - 2);

            if (r > 45) {
                ctx.font = `bold ${Math.max(10, r * 0.15)}px Inter`;
                ctx.fillStyle = "#eeeeee";
                const displayLvl = (window.progression && window.progression.passLevel) ? window.progression.passLevel : this.level;
                ctx.strokeText(`⭐ Lvl ${displayLvl}`, vcx, vcy + (r * 0.3));
                ctx.fillText(`⭐ Lvl ${displayLvl}`, vcx, vcy + (r * 0.3));
            }
            ctx.restore();
        }
    }
};

window.Player = Player;
