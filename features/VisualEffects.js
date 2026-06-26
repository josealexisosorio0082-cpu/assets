const VisualEffects = {
    particles: [],
    ambient: [], // --- Prioridad 3: Polvo Cósmico ---
    victims: [],
    shockwaves: [], // MÓDULO 4
    time: 0,
    maxParticles: 150,
    shakeIntensity: 0,
    shakeDuration: 0,
    shakeOffset: { x: 0, y: 0 },
    skinCache: {},

    init() {
        this.ambient = [];
        this.shockwaves = [];
        this.skinCache = {};
        let count = 80;
        if (window.CONFIG && window.CONFIG.visualEffects) {
            this.maxParticles = window.CONFIG.visualEffects.maxParticles;
            const q = localStorage.getItem('game_quality') || 'high';
            if (q === 'low') count = 20;
            else if (q === 'medium') count = 50;
            else if (q === 'very_high') count = 200;
        }

        const w = window.World ? window.World.width : 5000;
        const h = window.World ? window.World.height : 5000;
        // Generar Polvo Cósmico inicial
        for(let i=0; i<count; i++) {
            this.ambient.push({
                x: Math.random() * w,
                y: Math.random() * h,
                radius: 1 + Math.random(),
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                opacity: 0.1 + Math.random() * 0.3
            });
        }
    },

    update() {
        this.time += 0.016;
        if (window.CONFIG && window.CONFIG.visualEffects) {
            this.maxParticles = window.CONFIG.visualEffects.maxParticles;
        }

        // MÓDULO 2: Garbage Collection Agresivo (60 FPS Stable)
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';

        // 1. Partículas Splat
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.opacity -= isLow ? 0.1 : 0.05;
            if (p.opacity <= 0 || p.dead) {
                this.particles.splice(i, 1);
            }
        }

        // 2. Lógica de Víctimas
        for (let i = this.victims.length - 1; i >= 0; i--) {
            const v = this.victims[i];
            v.progress += 0.1;
            v.x += (v.attacker.x - v.x) * 0.2;
            v.y += (v.attacker.y - v.y) * 0.2;
            v.radius *= 0.8;
            if (v.progress >= 1 || v.radius < 1 || v.dead) {
                this.victims.splice(i, 1);
            }
        }

        // 3. Lógica de Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i];
            s.radius += 15;
            s.opacity -= 0.07;
            if (s.opacity <= 0 || s.dead) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Movimiento autónomo lento del polvo cósmico (Desactivado en Low)
        const w = window.World ? window.World.width : 5000;
        const h = window.World ? window.World.height : 5000;
        if (!isLow) {
            for (const a of this.ambient) {
                a.x += a.vx; a.y += a.vy;
                if (a.x < 0) a.x = w; if (a.x > w) a.x = 0;
                if (a.y < 0) a.y = h; if (a.y > h) a.y = 0;
            }
        }

        // Screen Shake
        if (this.shakeDuration > 0) {
            this.shakeDuration--;
            this.shakeOffset.x = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeOffset.y = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeIntensity *= 0.9;
        } else {
            this.shakeOffset.x = 0; this.shakeOffset.y = 0;
        }
    },

    spawnSplat(x, y, color) {
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';
        if (isLow || this.particles.length >= this.maxParticles) return;

        const count = window.CONFIG && window.CONFIG.quality === 'medium' ? 3 : 5;
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 2,
                color,
                opacity: 0.8
            });
        }
    },

    createExplosion(x, y, color, count = 10) {
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';
        if (isLow) count = Math.floor(count / 2);
        if (this.particles.length >= this.maxParticles) return;
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color,
                opacity: 1
            });
        }
    },

    spawnVictim(victim, attacker) {
        this.victims.push({
            x: victim.x, y: victim.y, radius: victim.radius,
            color: victim.skinKey ? "#4a90e2" : (victim.skin || "#4a90e2"),
            attacker: attacker, progress: 0, skinKey: victim.skinKey || null
        });
        attacker.visualRadius += victim.radius * 0.2;
        this.spawnSplat(victim.x, victim.y, "#ff5555");
    },

    spawnEatParticles(x, y, color) {
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';
        if (isLow) return;
        const count = 3 + Math.floor(Math.random() * 3);
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 0.8 + Math.random(),
                color,
                opacity: 0.6,
                isEat: true
            });
        }
    },

    drawProceduralSkin(ctx, x, y, radius, seed) {
        const cacheKey = `skin_${seed}_${Math.floor(radius)}`;
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';

        if (isLow) {
            ctx.fillStyle = `hsl(${seed % 360}, 70%, 50%)`;
            ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            return;
        }

        if (!this.skinCache[cacheKey]) {
            const size = radius * 2 + 10;
            const offCanvas = document.createElement('canvas');
            offCanvas.width = size; offCanvas.height = size;
            const offCtx = offCanvas.getContext('2d');
            const cx = size/2, cy = size/2;

            // Base Gradient
            const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, `hsl(${seed % 360}, 80%, 60%)`);
            grad.addColorStop(1, `hsl(${(seed + 40) % 360}, 90%, 40%)`);

            offCtx.fillStyle = grad;
            offCtx.beginPath(); offCtx.arc(cx, cy, radius, 0, Math.PI * 2); offCtx.fill();

            // Orbits / Neons
            offCtx.strokeStyle = `hsl(${(seed + 180) % 360}, 100%, 70%)`;
            offCtx.lineWidth = 2;
            offCtx.beginPath();
            offCtx.ellipse(cx, cy, radius * 0.8, radius * 0.3, seed, 0, Math.PI * 2);
            offCtx.stroke();

            this.skinCache[cacheKey] = offCanvas;
        }

        ctx.drawImage(this.skinCache[cacheKey], x - radius - 5, y - radius - 5);
    },

    triggerShake(intensity = 5, duration = 10) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    },

    createShockwave(x, y) {
        this.shockwaves.push({ x, y, radius: 10, opacity: 0.8 });
    },

    // MÓDULO 2: INTERFAZ DE DIVISAS PREMIUM (SLIP COINS Y ADN)
    drawSlipCoin(ctx, x, y, size) {
        const isLow = window.CONFIG && (window.CONFIG.quality === 'low' || window.CONFIG.quality === 'medium');
        ctx.save();
        ctx.translate(x, y);

        if (isLow) {
            // MÓDULO 5: RENDERIZADO SIMPLIFICADO (60 FPS)
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = '#1e40af';
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            return;
        }

        // Hexágono base
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.7, '#1e40af');
        grad.addColorStop(1, '#0f172a');

        ctx.fillStyle = grad;
        ctx.fill();

        // Borde metálico
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = size * 0.1;
        ctx.stroke();

        // Brillo superior (Cristal templado)
        ctx.beginPath();
        ctx.ellipse(0, -size*0.3, size*0.6, size*0.3, 0, 0, Math.PI, true);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fill();

        ctx.restore();
    },

    drawDNA(ctx, x, y, size) {
        const isLow = window.CONFIG && (window.CONFIG.quality === 'low' || window.CONFIG.quality === 'medium');
        ctx.save();
        ctx.translate(x, y);

        if (isLow) {
            // MÓDULO 5: RENDERIZADO SIMPLIFICADO (60 FPS)
            ctx.beginPath();
            ctx.moveTo(-size*0.5, -size);
            ctx.lineTo(size*0.5, size);
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
            return;
        }

        const time = Date.now() * 0.003;
        const grad = ctx.createLinearGradient(0, -size, 0, size);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(1, '#7e22ce');

        ctx.strokeStyle = grad;
        ctx.lineWidth = size * 0.2;
        ctx.lineCap = 'round';

        // Doble Hélice (Bézier entrelazadas)
        for (let j = 0; j < 2; j++) {
            ctx.beginPath();
            const phase = j * Math.PI;
            for (let i = -size; i <= size; i += 2) {
                const dx = Math.sin(i * 0.2 + time + phase) * (size * 0.6);
                if (i === -size) ctx.moveTo(dx, i);
                else ctx.lineTo(dx, i);
            }
            ctx.stroke();
        }

        // Micro-partículas orbitando
        for (let i = 0; i < 3; i++) {
            const t = time + i * (Math.PI * 2 / 3);
            const px = Math.cos(t) * size;
            const py = Math.sin(t * 0.5) * size;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(px, py, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#fff';
        }

        ctx.restore();
    },

    drawUIIcon(ctx, x, y, size, type) {
        const quality = (window.CONFIG && window.CONFIG.quality) || 'high';
        const isLow = quality === 'low' || quality === 'medium';

        ctx.save();
        ctx.translate(x, y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const col = '#38bdf8';
        ctx.strokeStyle = col;
        ctx.lineWidth = size * 0.15;

        if (!isLow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = col;
        }

        if (type === 'settings') {
            // Reactor circular con punto neón
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            for(let i=0; i<8; i++) {
                ctx.rotate(Math.PI/4);
                ctx.moveTo(size * 0.5, 0);
                ctx.lineTo(size * 0.9, 0);
            }
            ctx.stroke();
        } else if (type === 'global') {
            // Trofeo Cyber
            ctx.beginPath();
            ctx.moveTo(-size*0.6, -size*0.6);
            ctx.lineTo(size*0.6, -size*0.6);
            ctx.lineTo(size*0.4, 0);
            ctx.lineTo(-size*0.4, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(0, size*0.5);
            ctx.moveTo(-size*0.4, size*0.5); ctx.lineTo(size*0.4, size*0.5);
            ctx.stroke();
        } else if (type === 'missions') {
            // Diana neón
            for(let i=1; i<=3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.3 * i, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (type === 'free') {
            // Regalo Cyber
            ctx.strokeRect(-size*0.6, -size*0.4, size*1.2, size*1);
            ctx.beginPath();
            ctx.moveTo(0, -size*0.4); ctx.lineTo(0, size*0.6);
            ctx.moveTo(-size*0.6, size*0.1); ctx.lineTo(size*0.6, size*0.1);
            ctx.stroke();
        } else if (type === 'pass') {
            // Ticket
            ctx.strokeRect(-size*0.8, -size*0.5, size*1.6, size);
            ctx.beginPath();
            ctx.moveTo(-size*0.2, -size*0.5); ctx.lineTo(-size*0.2, size*0.5);
            ctx.stroke();
        } else if (type === 'lan') {
            // Globo / Red
            ctx.beginPath(); ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-size*0.7, 0); ctx.lineTo(size*0.7, 0);
            ctx.moveTo(0, -size*0.7); ctx.lineTo(0, size*0.7);
            ctx.stroke();
        } else if (type === 'split') {
            // Icono Dividirse (Vectores geométricos)
            ctx.strokeStyle = '#ec4899';
            ctx.shadowColor = '#ec4899';
            ctx.beginPath();
            ctx.arc(-size*0.4, 0, size*0.4, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(size*0.4, 0, size*0.4, 0, Math.PI*2);
            ctx.stroke();
        } else if (type === 'eject') {
            // Icono Apuntar/Eyectar
            ctx.strokeStyle = '#ec4899';
            ctx.shadowColor = '#ec4899';
            ctx.beginPath();
            ctx.moveTo(0, -size*0.8); ctx.lineTo(0, size*0.8);
            ctx.moveTo(-size*0.8, 0); ctx.lineTo(size*0.8, 0);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, size*0.4, 0, Math.PI*2); ctx.stroke();
        } else if (type === 'pause') {
            // Icono Pausa
            ctx.beginPath();
            ctx.moveTo(-size*0.3, -size*0.6); ctx.lineTo(-size*0.3, size*0.6);
            ctx.moveTo(size*0.3, -size*0.6); ctx.lineTo(size*0.3, size*0.6);
            ctx.stroke();
        } else if (type === 'lb_toggle') {
            // Icono Leaderboard Toggle
            for(let i=-1; i<=1; i++) {
                ctx.beginPath();
                ctx.moveTo(-size*0.6, i*size*0.4); ctx.lineTo(size*0.6, i*size*0.4);
                ctx.stroke();
            }
        }

        ctx.restore();
    },
    renderAura(ctx, x, y, r, type) {
        const quality = (window.CONFIG && window.CONFIG.quality) || 'high';
        if (quality === 'low' || quality === 'medium') return; // MÓDULO 5: Auras desactivadas en bajo/medio

        const pulse = (window.GLOBAL_SINE_PULSE || Math.sin(Date.now() * 0.005)) * 5;
        const layers = 3;

        // Mapeo de colores por tipo de aura
        const auraColors = {
            fire: [0, 30, 60],
            ice: [180, 200, 220],
            plasma: [280, 300, 320],
            plasma_thunder: [260, 280, 300],
            void: [0, 0, 0],
            neon: [120, 150, 180],
            electric: [200, 220, 240],
            divine: [45, 60, 90]
        };

        const hues = auraColors[type] || auraColors.fire;

        ctx.save();
        for (let i = 0; i < layers; i++) {
            const layerR = r + 5 + (i * 4) + pulse;
            ctx.beginPath();
            ctx.arc(x, y, layerR, 0, Math.PI * 2);
            ctx.lineWidth = 3;

            const hue = hues[i % hues.length];
            const sat = (type === 'void') ? 0 : 100;
            const light = (type === 'void') ? (10 + i * 15) : 50;

            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.6 - (i * 0.2)})`;

            const offset = Math.sin(this.time * 2 + i) * 2;
            ctx.save();
            ctx.translate(offset, offset);
            ctx.stroke();
            ctx.restore();

            ctx.shadowBlur = 10 + pulse;
            ctx.shadowColor = `hsl(${hue}, ${sat}%, ${light}%)`;
        }
        ctx.restore();
    },

    // MÓDULO 2: Sistema de Insignias de Prestigio
    drawBadge(ctx, x, y, size, rankId) {
        if (size < 5) return;
        ctx.save();
        ctx.translate(x, y);

        const colors = {
            virus: { primary: '#cd7f32', secondary: '#8b4513' },
            mutante: { primary: '#ffd700', secondary: '#b8860b' },
            titan: { primary: '#00f2ff', secondary: '#008b8b' },
            espectro: { primary: '#f59e0b', secondary: '#9a3412' },
            deidad: { primary: '#a855f7', secondary: '#4b0082' }
        };

        const col = colors[rankId] || colors.virus;

        if (rankId === 'deidad') {
            // Corona para Deidad
            const t = Date.now() * 0.005;
            ctx.strokeStyle = `hsl(${(t * 50) % 360}, 100%, 50%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(-size, -size);
            ctx.lineTo(-size/2, -size/2);
            ctx.lineTo(0, -size);
            ctx.lineTo(size/2, -size/2);
            ctx.lineTo(size, -size);
            ctx.lineTo(size, 0);
            ctx.closePath();
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.stroke();
        } else {
            // Escudo/Diamante para otros
            ctx.beginPath();
            if (rankId === 'titan' || rankId === 'espectro') {
                ctx.moveTo(0, -size);
                ctx.lineTo(size, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size, 0);
            } else {
                ctx.moveTo(-size, -size);
                ctx.lineTo(size, -size);
                ctx.lineTo(size, size/2);
                ctx.lineTo(0, size);
                ctx.lineTo(-size, size/2);
            }
            ctx.closePath();

            const grad = ctx.createLinearGradient(-size, -size, size, size);
            grad.addColorStop(0, col.primary);
            grad.addColorStop(1, col.secondary);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    },

    render(ctx, camera) {
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';

        // Renderizar víctimas
        for (const v of this.victims) {
            const sx = v.x - camera.x, sy = v.y - camera.y;
            ctx.save();
            ctx.globalAlpha = 1 - v.progress;
            ctx.beginPath(); ctx.arc(sx, sy, v.radius, 0, Math.PI * 2);
            if (v.skinKey && window.Menu) window.Menu.drawSkinTexture(ctx, sx, sy, v.radius, v.skinKey, true);
            else { ctx.fillStyle = v.color; ctx.fill(); }
            ctx.restore();
        }

        // Renderizar partículas Splat
        if (this.particles.length > 0) {
            for (const p of this.particles) {
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x - camera.x, p.y - camera.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Renderizar Shockwaves (MÓDULO 4)
        for (const s of this.shockwaves) {
            ctx.save();
            ctx.globalAlpha = s.opacity;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(s.x - camera.x, s.y - camera.y, s.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    },

    renderAmbient(ctx, camera) {
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';
        if (isLow) return;

        const canvasW = window.canvas.width / (window.devicePixelRatio || 1);
        const canvasH = window.canvas.height / (window.devicePixelRatio || 1);
        const zoom = camera.zoom;

        ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
        for (const a of this.ambient) {
            const sx = a.x - camera.x, sy = a.y - camera.y;

            if (sx > -10 && sx < (canvasW/zoom)+10 && sy > -10 && sy < (canvasH/zoom)+10) {
                ctx.globalAlpha = a.opacity;
                ctx.beginPath();
                ctx.arc(sx, sy, a.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
};

window.VisualEffects = VisualEffects;
VisualEffects.init();
