const Bots = {
    items: [],
    nextId: 1,
    names: [
        "Shadow", "Luna", "Rex", "Mika", "Neon", "Valen", "Kai", "Sofi", "Dante", "Nova",
        "Max", "Nico", "Zoe", "Leo", "Mia", "Alpha", "Beta", "Gamer123", "ProKiller", "Sky",
        "Storm", "Blaze", "Frost", "Pixel", "Vortex", "Bolt", "Titan", "Echo", "Ghost", "Rider",
        "Sniper", "Astra", "Zero", "Omega", "Kira", "Finn", "Raven", "Ace", "Solo", "Hunter",
        "Drake", "Luna_X", "Slayer", "Toxin", "Swift", "Rogue", "Mystic", "Crimson", "Shadow_Pro", "NoobMaster"
    ],
    RANKS: {
        VIRUS: { id: 'virus', name: 'Virus', color: '#cd7f32' },
        MUTANTE: { id: 'mutante', name: 'Mutante', color: '#ffd700' },
        TITAN: { id: 'titan', name: 'Titán', color: '#00f2ff' },
        ESPECTRO: { id: 'espectro', name: 'Espectro', color: '#f59e0b' },
        DEIDAD: { id: 'deidad', name: 'Deidad', color: '#a855f7' }
    },

    createBot() {
        // MÓDULO 2: ASIGNACIÓN DE RANGO POR PUNTOS (Sincronización IA)
        const rankPoints = Math.floor(Math.random() * 3000);
        let rank = this.RANKS.VIRUS;
        let tier = "novice";
        let personality = 0.2 + Math.random() * 0.5;

        // Mapeo estricto por Switch-Case (Requerimiento QA)
        switch(true) {
            case (rankPoints >= 2500):
                rank = this.RANKS.DEIDAD;
                tier = "pro";
                personality = 0.9;
                break;
            case (rankPoints >= 1200):
                rank = this.RANKS.ESPECTRO;
                tier = "pro";
                personality = 0.75;
                break;
            case (rankPoints >= 600):
                rank = this.RANKS.TITAN;
                tier = "intermediate";
                personality = 0.6;
                break;
            case (rankPoints >= 200):
                rank = this.RANKS.MUTANTE;
                tier = "intermediate";
                personality = 0.4;
                break;
            default:
                rank = this.RANKS.VIRUS;
                tier = "novice";
                personality = 0.2;
                break;
        }

        const massOffset = (rankPoints / 5);
        const mass = 20 + massOffset + Math.random() * 25;
        const radius = 30 * Math.sqrt(mass / 30);

        // MÓDULO 1: Inicialización segura de coordenadas (Anti-Diagonal cascada)
        const w = (window.World && window.World.width > 0) ? window.World.width : 5000;
        const h = (window.World && window.World.height > 0) ? window.World.height : 5000;

        const angle = Math.random() * Math.PI * 2;
        const skinKey = "skins gratis/Free (1).png"; // Skin base por defecto para bots

        return {
            id: this.nextId++,
            name: this.names[Math.floor(Math.random() * this.names.length)],
            x: Math.random() * w,
            y: Math.random() * h,
            mass: mass,
            radius: radius,
            visualRadius: radius,
            targetRadius: radius,
            vx: 0, vy: 0,
            tx: Math.cos(angle), ty: Math.sin(angle),
            skinKey: skinKey,
            rank: rank,
            thinkTimer: 0,
            tier: tier,
            updateCounter: Math.floor(Math.random() * 10), // Para LOD
            points: Player.initSpringPoints(radius),
            personality: personality,
            target: null,
            pursuerCount: 0,
            waver: Math.random() * Math.PI * 2, // Para movimiento natural
            reactionDelay: tier === "pro" ? 0 : (tier === "intermediate" ? 5 : 12)
        };
    },

    generate(amount = 50) {
        this.items = [];
        const w = (window.World && window.World.width > 0) ? window.World.width : 5000;
        const h = (window.World && window.World.height > 0) ? window.World.height : 5000;
        const pPos = Player.getCenter ? Player.getCenter() : { x: w / 2, y: h / 2 };

        for (let i = 0; i < amount; i++) {
            let bot = this.createBot();

            // MÓDULO 1: Bucle de spawn con intentos máximos para evitar bucle infinito
            let attempts = 0;
            while (attempts < 10) {
                const dist = Math.hypot(bot.x - pPos.x, bot.y - pPos.y);
                if (dist > 800) break; // Posición segura encontrada

                bot.x = Math.random() * w;
                bot.y = Math.random() * h;
                attempts++;
            }

            this.items.push(bot);
        }
    },

    update() {
        const threshold = 1.15;
        const viewportMargin = 100;

        // Determinar viewport para LOD
        const viewW = window.innerWidth / window.camera.zoom;
        const viewH = window.innerHeight / window.camera.zoom;
        const viewX = window.camera.x;
        const viewY = window.camera.y;

        const isLow = window.CONFIG && window.CONFIG.quality === 'low';

        for (let i = 0; i < this.items.length; i++) {
            const bot = this.items[i];

            // LOD de IA
            const inViewport = (bot.x > viewX - viewportMargin && bot.x < viewX + viewW + viewportMargin &&
                                bot.y > viewY - viewportMargin && bot.y < viewY + viewH + viewportMargin);

            bot.updateCounter++;
            let shouldThink = false;

            if (inViewport) {
                const thinkRate = bot.tier === "pro" ? 6 : (bot.tier === "intermediate" ? 15 : 30);
                if (bot.updateCounter >= thinkRate) {
                    shouldThink = true;
                    bot.updateCounter = 0;
                }
            } else {
                if (bot.updateCounter >= 60) {
                    shouldThink = true;
                    bot.updateCounter = 0;
                }
            }

            if (shouldThink) {
                this.think(bot, i, threshold);
            }

            // Passive Mass Decay
            if (bot.mass > 50) {
                let decayRate = 0.0004;
                if (bot.mass > 1000) decayRate = 0.001;
                bot.mass -= bot.mass * decayRate;
                bot.targetRadius = 30 * Math.sqrt(bot.mass / 30);
            }

            // Movimiento
            const speedFactor = (16 / Math.sqrt(bot.mass)) + 0.45;
            const lerpSpeed = bot.tier === "pro" ? 0.15 : (bot.tier === "intermediate" ? 0.08 : 0.04);

            bot.vx += (bot.tx * speedFactor - bot.vx) * lerpSpeed;
            bot.vy += (bot.ty * speedFactor - bot.vy) * lerpSpeed;

            bot.x += bot.vx; bot.y += bot.vy;

            this.handleCollisions(bot, i, threshold);

            bot.radius += (bot.targetRadius - bot.radius) * 0.1;
            bot.visualRadius += (bot.radius - bot.visualRadius) * 0.1;

            // Optimización: No actualizar resortes en calidad baja
            if (!isLow && window.CONFIG && window.CONFIG.quality !== 'low') {
                Player.updateSprings(bot);
            }

            bot.x = Math.max(bot.radius, Math.min(World.width - bot.radius, bot.x));
            bot.y = Math.max(bot.radius, Math.min(World.height - bot.radius, bot.y));
        }
    },

    think(bot, index, threshold) {
        let forceX = 0, forceY = 0;
        const viewDist = bot.tier === "pro" ? 1100 : (bot.tier === "intermediate" ? 800 : 500);

        bot.waver += 0.05;
        const waverAmount = bot.tier === "pro" ? 0.05 : 0.15;
        forceX += Math.cos(bot.waver) * waverAmount;
        forceY += Math.sin(bot.waver) * waverAmount;

        if (bot.tier !== "pro" && Math.random() < 0.1) {
            bot.tx += (Math.random() - 0.5) * 0.4;
            bot.ty += (Math.random() - 0.5) * 0.4;
        }

        let closestThreat = null;
        let minDistThreat = bot.tier === "novice" ? 300 : (bot.tier === "intermediate" ? 600 : 900);
        const potentialThreats = [...Player.cells, ...this.items.filter((_, idx) => idx !== index)];

        // Optimización: Evaluar amenazas solo si están cerca
        for (let i = 0; i < potentialThreats.length; i++) {
            const other = potentialThreats[i];
            const dx = bot.x - other.x, dy = bot.y - other.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < minDistThreat * minDistThreat && other.mass > bot.mass * threshold) {
                closestThreat = other;
                minDistThreat = Math.sqrt(d2);
            }
        }

        if (closestThreat) {
            const dx = bot.x - closestThreat.x, dy = bot.y - closestThreat.y;
            const d = Math.max(1, Math.sqrt(dx*dx + dy*dy));
            let escapeX = dx / d, escapeY = dy / d;
            if (bot.tier === "pro" && minDistThreat < 300) {
                const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 0.4 : -0.4);
                escapeX = Math.cos(angle); escapeY = Math.sin(angle);
            }
            const strength = (minDistThreat < 250) ? 6 : 4;
            forceX += escapeX * strength; forceY += escapeY * strength;
        }

        if (bot.mass > 60) {
            const virusDist = bot.tier === "pro" ? 250 : 150;
            for (const v of Virus.items) {
                const dx = bot.x - v.x, dy = bot.y - v.y;
                const d2 = dx*dx + dy*dy;
                if (d2 < (bot.radius + virusDist) * (bot.radius + virusDist)) {
                    const d = Math.sqrt(d2) || 1;
                    const strength = (bot.radius + virusDist - d) / 50;
                    forceX += (dx / d) * strength * 5; forceY += (dy / d) * strength * 5;
                }
            }
        }

        if (!closestThreat || (bot.tier === "pro" && minDistThreat > 350)) {
            let closestPrey = null;
            let minDistPrey = viewDist;
            for (const other of potentialThreats) {
                if (other.pursuerCount > 3) continue;
                const dx = bot.x - other.x, dy = bot.y - other.y;
                const d2 = dx*dx + dy*dy;
                if (d2 < minDistPrey * minDistPrey && bot.mass > other.mass * threshold) {
                    closestPrey = other; minDistPrey = Math.sqrt(d2);
                }
            }

        if (closestPrey && bot.personality > 0.3) {
            let targetX = closestPrey.x;
            let targetY = closestPrey.y;

            // Parche de IA: Intercepción inteligente para rangos altos (Espectro y Deidad)
            if (bot.rank.id === 'espectro' || bot.rank.id === 'deidad') {
                targetX = closestPrey.x + (closestPrey.vx || 0) * 12;
                targetY = closestPrey.y + (closestPrey.vy || 0) * 12;
            }

            const dx = targetX - bot.x, dy = targetY - bot.y;
            const d = Math.sqrt(dx*dx + dy*dy) || 1;
            forceX += (dx / d) * 3; forceY += (dy / d) * 3;

            if (bot.tier === "pro" && bot.mass > 100 && bot.mass > closestPrey.mass * 2.3 && d < bot.radius * 4 && Math.random() < 0.08) {
                this.botSplit(bot);
            }
        } else {
                let bestFood = null;
                let minDistFood = 600;
                // Muestreo agresivo de comida para rendimiento
                const step = bot.tier === "novice" ? 4 : 8;
                for (let k = 0; k < Food.items.length; k += step) {
                    const f = Food.items[k];
                    const dx = bot.x - f.x, dy = bot.y - f.y;
                    const d2 = dx*dx + dy*dy;
                    if (d2 < minDistFood * minDistFood) {
                        bestFood = f; minDistFood = Math.sqrt(d2);
                    }
                }
                if (bestFood) {
                    const dx = bestFood.x - bot.x, dy = bestFood.y - bot.y;
                    const d = Math.sqrt(dx*dx + dy*dy) || 1;
                    forceX += (dx / d) * 1.5; forceY += (dy / d) * 1.5;
                }
            }
        }

        const margin = 200;
        if (bot.x < margin) forceX += 3;
        if (bot.x > World.width - margin) forceX -= 3;
        if (bot.y < margin) forceY += 3;
        if (bot.y > World.height - margin) forceY -= 3;

        const totalMag = Math.sqrt(forceX*forceX + forceY*forceY);
        if (totalMag > 0.1) {
            bot.tx = forceX / totalMag; bot.ty = forceY / totalMag;
        }
    },

    handleCollisions(bot, i, threshold) {
        // Optimización: Solo comer comida si estamos cerca (Culling espacial implícito)
        // Usamos un step mayor para la comida para no chequear cada partícula cada frame para cada bot
        const step = (window.CONFIG && window.CONFIG.quality === 'low') ? 2 : 1;

        for (let k = Food.items.length - 1; k >= 0; k -= step) {
            const f = Food.items[k];
            const dx = bot.x - f.x, dy = bot.y - f.y;
            const distSq = dx*dx + dy*dy;
            if (distSq < bot.radius * bot.radius) {
                bot.mass += (f.ejected ? 3 : 1);
                bot.targetRadius = 30 * Math.sqrt(bot.mass / 30);
                Food.items.splice(k, 1);
                Food.recycle(f);
            }
        }

        // 2. Colisión con Virus
        for (const v of Virus.items) {
            const dx = bot.x - v.x, dy = bot.y - v.y;
            const distSq = dx*dx + dy*dy;
            if (distSq < bot.radius * bot.radius && bot.mass > v.radius * 1.1) {
                bot.mass *= 0.5;
                bot.targetRadius = 30 * Math.sqrt(bot.mass / 30);
                const angle = Math.random() * Math.PI * 2;
                bot.vx += Math.cos(angle) * 20;
                bot.vy += Math.sin(angle) * 20;
                v.x = Math.random() * World.width;
                v.y = Math.random() * World.height;
            }
        }

        // 3. Comer otros bots
        for (let j = 0; j < this.items.length; j++) {
            if (i === j) continue;
            const other = this.items[j];
            const dx = bot.x - other.x, dy = bot.y - other.y;
            const distSq = dx*dx + dy*dy;
            const sumR = bot.radius + other.radius;

            if (distSq < sumR * sumR) {
                const dist = Math.sqrt(distSq) || 1;
                const massDiff = 1.11;

                if (bot.mass > other.mass * massDiff && dist < bot.radius - other.radius * 0.39) {
                    bot.mass += other.mass * 0.85;
                    bot.targetRadius = 30 * Math.sqrt(bot.mass / 30);
                    // MÓDULO 2: LIMPIEZA INMEDIATA DE MEMORIA
                    this.items.splice(j, 1);
                    if (j < i) i--;
                    setTimeout(() => {
                        if (this.items.length < 50) this.items.push(this.createBot());
                    }, 2000);
                }
                else if (other.mass > bot.mass * massDiff && dist < other.radius - bot.radius * 0.39) {
                    other.mass += bot.mass * 0.85;
                    other.targetRadius = 30 * Math.sqrt(other.mass / 30);
                    // MÓDULO 2: LIMPIEZA INMEDIATA DE MEMORIA
                    this.items.splice(i, 1);
                    setTimeout(() => {
                        if (this.items.length < 50) this.items.push(this.createBot());
                    }, 2000);
                    return;
                }
            }
        }
    },

    botSplit(bot) {
        if (bot.mass < 60) return;

        // Simular split con un impulso de velocidad y pérdida de masa
        bot.mass *= 0.55; // Pierde un poco más de la mitad para balance
        bot.targetRadius = 30 * Math.sqrt(bot.mass / 30);

        // Impulso fuerte hacia adelante
        bot.vx += bot.tx * 30;
        bot.vy += bot.ty * 30;

        if (window.VisualEffects) {
            window.VisualEffects.createExplosion(bot.x, bot.y, "#ffffff", 10);
        }
    },

    botEject(bot, target) {
        // Simular lanzamiento de masa 'W'
        const dx = target.x - bot.x, dy = target.y - bot.y;
        const d = Math.hypot(dx, dy);
        if (bot.mass > 50) {
            bot.mass -= 2;
            Food.addEjectedMass(bot.x, bot.y, (dx/d)*15, (dy/d)*15, bot);
        }
    },


    renderCell(ctx, camera, bot) {
        const sx = bot.x - camera.x, sy = bot.y - camera.y;
        const r = bot.visualRadius;
        const config = window.CONFIG || {};
        const visuals = config.visuals || { renderBorders: true };
        const isLow = config.quality === 'low';

        // Frustum Culling
        const margin = 100;
        if (sx < -r - margin || sx > (window.innerWidth / camera.zoom) + r + margin ||
            sy < -r - margin || sy > (window.innerHeight / camera.zoom) + r + margin) return;

        let vcx = sx, vcy = sy;
        const pts = bot.points;
        if (!isLow && pts && pts.length > 0) {
            let ox = 0, oy = 0;
            for(let i=0; i<pts.length; i++) { ox += pts[i].x; oy += pts[i].y; }
            vcx = sx + (ox / pts.length);
            vcy = sy + (oy / pts.length);
        }

        // MÓDULO 4: ACTIVACIÓN DE AURAS DE BOTS (ESPECTRO y DEIDAD)
        if (!isLow && bot.rank && (bot.rank.id === 'deidad' || bot.rank.id === 'espectro')) {
            if (window.VisualEffects) {
                // Invocación obligatoria de drawProceduralSkin para el anillo de fuego neón pulsante
                // Se usa un radio mayor para crear el efecto de aura exterior
                // REGLA DE ORO 1: USAR CACHÉ GLOBAL (GLOBAL_SINE_PULSE)
                const auraPulse = 1.1 + (window.GLOBAL_SINE_PULSE || Math.sin(Date.now() * 0.005)) * 0.05;
                window.VisualEffects.drawProceduralSkin(ctx, vcx, vcy, r * auraPulse, bot.id * 13);

                // También llamar a renderAura si existe para mayor fidelidad visual
                if (window.VisualEffects.renderAura) {
                    window.VisualEffects.renderAura(ctx, vcx, vcy, r, bot.rank.id === 'deidad' ? 'fire' : 'plasma');
                }
            }
        }

        ctx.save();

        // Optimización 'Baja': Usar círculos perfectos en lugar de resortes orgánicos
        if (!isLow && pts && pts.length > 0) {
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

        if (visuals.renderBorders) {
            ctx.lineWidth = Math.max(2, r * 0.04);
            ctx.strokeStyle = (bot.rank && bot.rank.id === 'god') ? "#a855f7" : "rgba(0, 0, 0, 0.1)";
            ctx.stroke();
        }

        // Optimización 'Baja': Color plano si es baja calidad para evitar texturizado
        if (isLow) {
            ctx.fillStyle = bot.color || "#ff6666";
            ctx.fill();
        } else {
            ctx.clip();
            if (window.Menu) window.Menu.drawSkinTexture(ctx, vcx, vcy, r, bot.skinKey, true);
        }

        ctx.restore();

        // MÓDULO 2: Renderizado de Insignia
        if (window.VisualEffects && window.VisualEffects.drawBadge && bot.rank) {
            window.VisualEffects.drawBadge(ctx, vcx, vcy - r - 10, r * 0.4, bot.rank.id);
        }

        // Renderizado de nombre optimizado
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(10, r * 0.3)}px Inter`;
        ctx.textAlign = "center";
        if (isLow) {
            // Texto simple sin stroke para rendimiento en Low
            ctx.fillText(bot.name, vcx, vcy + (r * 0.1));
        } else {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.4)"; ctx.lineWidth = 1.5;
            ctx.strokeText(bot.name, vcx, vcy + (r * 0.15));
            ctx.fillText(bot.name, vcx, vcy + (r * 0.15));
        }
        ctx.restore();
    }
};

window.Bots = Bots;
