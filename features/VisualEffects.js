const VisualEffects = {
    particles: [],
    ambient: [],
    victims: [],
    shockwaves: [],
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
        const q = localStorage.getItem('game_quality') || 'high';
        if (q === 'low') count = 20;
        else if (q === 'medium') count = 50;
        else if (q === 'very_high') count = 200;

        const w = window.World ? window.World.width : 5000;
        const h = window.World ? window.World.height : 5000;
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

    update(dt = 16.6) {
        this.time += 0.016 * (dt / 16.6);
        const q = localStorage.getItem('game_quality') || 'high';
        const isLow = q === 'low';
        const dtFactor = dt / 16.6;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dtFactor; p.y += p.vy * dtFactor;
            p.opacity -= (isLow ? 0.1 : 0.05) * dtFactor;
            if (p.opacity <= 0 || p.dead) this.particles.splice(i, 1);
        }

        for (let i = this.victims.length - 1; i >= 0; i--) {
            const v = this.victims[i];
            v.progress += 0.1 * dtFactor;
            const vLerp = 1 - Math.pow(1 - 0.2, dtFactor);
            v.x += (v.attacker.x - v.x) * vLerp;
            v.y += (v.attacker.y - v.y) * vLerp;
            v.radius *= Math.pow(0.8, dtFactor);
            if (v.progress >= 1 || v.radius < 1 || v.dead) this.victims.splice(i, 1);
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i];
            s.radius += 15 * dtFactor;
            s.opacity -= 0.07 * dtFactor;
            if (s.opacity <= 0 || s.dead) this.shockwaves.splice(i, 1);
        }

        if (!isLow) {
            const w = window.World ? window.World.width : 5000;
            const h = window.World ? window.World.height : 5000;
            for (const a of this.ambient) {
                a.x += a.vx * dtFactor; a.y += a.vy * dtFactor;
                if (a.x < 0) a.x = w; if (a.x > w) a.x = 0;
                if (a.y < 0) a.y = h; if (a.y > h) a.y = 0;
            }
        }

        if (this.shakeDuration > 0) {
            this.shakeDuration -= dtFactor;
            this.shakeOffset.x = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeOffset.y = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeIntensity *= Math.pow(0.9, dtFactor);
        } else {
            this.shakeOffset.x = 0; this.shakeOffset.y = 0;
        }
    },

    spawnSplat(x, y, color) {
        const q = localStorage.getItem('game_quality') || 'high';
        if (q === 'low' || this.particles.length >= this.maxParticles) return;
        // Limitamos partículas en móviles para evitar caídas de FPS
        const count = q === 'very_high' ? 6 : (q === 'medium' ? 2 : 4);
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 1 + Math.random() * 2, color, opacity: 0.8 });
        }
    },

    createExplosion(x, y, color, count = 10) {
        const q = localStorage.getItem('game_quality') || 'high';
        if (q === 'low') count = Math.floor(count / 2);
        if (this.particles.length >= this.maxParticles) return;
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 2 + Math.random() * 3, color, opacity: 1 });
        }
    },

    spawnVictim(victim, attacker) {
        this.victims.push({ x: victim.x, y: victim.y, radius: victim.radius, color: victim.skinKey ? "#4a90e2" : (victim.skin || "#4a90e2"), attacker: attacker, progress: 0, skinKey: victim.skinKey || null });
        attacker.visualRadius += victim.radius * 0.2;
        this.spawnSplat(victim.x, victim.y, "#ff5555");
    },

    spawnEatParticles(x, y, color) {
        const q = localStorage.getItem('game_quality') || 'high';
        if (q === 'low') return;
        const count = 3 + Math.floor(Math.random() * 3);
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 0.8 + Math.random(), color, opacity: 0.6, isEat: true });
        }
    },

    drawProceduralSkin(ctx, x, y, radius, seed) {
        const cacheKey = `skin_${seed}_${Math.floor(radius)}`;
        const q = localStorage.getItem('game_quality') || 'high';
        if (q === 'low') {
            ctx.fillStyle = `hsl(${seed % 360}, 70%, 50%)`;
            ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            return;
        }
        if (!this.skinCache[cacheKey]) {
            const size = radius * 2 + 10;
            const offCanvas = document.createElement('canvas'); offCanvas.width = size; offCanvas.height = size;
            const offCtx = offCanvas.getContext('2d');
            const cx = size/2, cy = size/2;
            const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, `hsl(${seed % 360}, 80%, 60%)`);
            grad.addColorStop(1, `hsl(${(seed + 40) % 360}, 90%, 40%)`);
            offCtx.fillStyle = grad;
            offCtx.beginPath(); offCtx.arc(cx, cy, radius, 0, Math.PI * 2); offCtx.fill();
            offCtx.strokeStyle = `hsl(${(seed + 180) % 360}, 100%, 70%)`;
            offCtx.lineWidth = 2;
            offCtx.beginPath(); offCtx.ellipse(cx, cy, radius * 0.8, radius * 0.3, seed, 0, Math.PI * 2); offCtx.stroke();
            this.skinCache[cacheKey] = offCanvas;
        }
        ctx.drawImage(this.skinCache[cacheKey], x - radius - 5, y - radius - 5);
    },

    drawBadge(ctx, x, y, size, type) {
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0,0,0,0.5)";

        let col = "#94a3b8";
        if (type === 'deidad') col = "#facc15";
        else if (type === 'espectro') col = "#ef4444";
        else if (type === 'titan') col = "#a855f7";
        else if (type === 'mutante') col = "#3b82f6";

        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, -size * 0.3);
        ctx.lineTo(size * 0.6, size);
        ctx.lineTo(-size * 0.6, size);
        ctx.lineTo(-size, -size * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${size}px Inter`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(type[0].toUpperCase(), 0, 0);

        ctx.restore();
    },

    renderAura(ctx, x, y, r, type) {
        ctx.save();
        const time = Date.now() * 0.002;
        const q = localStorage.getItem('game_quality') || 'high';

        if (type === 'fire') {
            const segments = q === 'very_high' ? 16 : 10;
            const grad = ctx.createRadialGradient(x, y, r, x, y, r * 1.5);
            grad.addColorStop(0, 'rgba(255, 80, 0, 0.4)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            for(let i=0; i<segments; i++) {
                const angle = (i/segments) * Math.PI * 2 + time;
                const dist = r * (1.2 + Math.sin(time * 3 + i) * 0.15);
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        } else if (type === 'ice') {
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            const crystals = q === 'very_high' ? 6 : 4;
            for(let i=0; i<crystals; i++) {
                const angle = (i/crystals) * Math.PI * 2 + time * 0.5;
                const px = x + Math.cos(angle) * r * 1.2;
                const py = y + Math.sin(angle) * r * 1.2;
                this.drawCrystal(ctx, px, py, r * 0.15, angle);
            }
        } else if (type === 'plasma') {
            const grad = ctx.createRadialGradient(x, y, r, x, y, r * 1.6);
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
            grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            const rings = q === 'very_high' ? 3 : 2;
            for(let i=0; i<rings; i++) {
                const rot = time + (i * Math.PI / rings);
                ctx.beginPath();
                ctx.ellipse(x, y, r * 1.4, r * 0.3, rot, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    },

    drawCrystal(ctx, x, y, size, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, -size); ctx.lineTo(size * 0.5, 0); ctx.lineTo(0, size); ctx.lineTo(-size * 0.5, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    },

    triggerShake(intensity = 5, duration = 10) { this.shakeIntensity = intensity; this.shakeDuration = duration; },

    createShockwave(x, y) { this.shockwaves.push({ x, y, radius: 10, opacity: 0.8 }); },

    drawSlipCoin(ctx, x, y, size) {
        if (!ctx) return;
        const q = localStorage.getItem('game_quality') || 'high';
        const isLow = q === 'low' || q === 'medium';
        ctx.save();
        ctx.translate(x, y);
        if (isLow) {
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = '#facc15'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore(); return;
        }
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = Math.cos(angle) * size, py = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        grad.addColorStop(0, '#fef08a'); grad.addColorStop(0.7, '#facc15'); grad.addColorStop(1, '#a16207');
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = size * 0.15; ctx.stroke();
        ctx.restore();
    },

    drawDNA(ctx, x, y, size) {
        if (!ctx) return;
        const q = localStorage.getItem('game_quality') || 'high';
        const isLow = q === 'low' || q === 'medium';
        ctx.save(); ctx.translate(x, y);
        if (isLow) {
            ctx.beginPath(); ctx.moveTo(-size*0.5, -size*0.8); ctx.lineTo(size*0.5, size*0.8);
            ctx.moveTo(size*0.5, -size*0.8); ctx.lineTo(-size*0.5, size*0.8);
            ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore(); return;
        }
        const time = Date.now() * 0.003;
        ctx.lineWidth = size * 0.25; ctx.lineCap = 'round';
        for (let j = 0; j < 2; j++) {
            ctx.beginPath();
            const phase = j * Math.PI;
            ctx.strokeStyle = j === 0 ? '#ec4899' : '#a855f7';
            for (let i = -size * 0.8; i <= size * 0.8; i += 2) {
                const dx = Math.sin(i * 0.3 + time + phase) * (size * 0.5);
                if (i === -size * 0.8) ctx.moveTo(dx, i); else ctx.lineTo(dx, i);
            }
            ctx.stroke();
        }
        ctx.restore();
    },

    drawUIIcon(ctx, x, y, size, type) {
        const q = localStorage.getItem('game_quality') || 'high';
        const isLow = q === 'low' || q === 'medium';
        ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const col = '#38bdf8'; ctx.strokeStyle = col; ctx.lineWidth = size * 0.15;
        if (!isLow) { ctx.shadowBlur = 10; ctx.shadowColor = col; }

        if (type === 'settings') {
            ctx.beginPath(); ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#00ffff'; ctx.fill();
            for(let i=0; i<8; i++) { ctx.rotate(Math.PI/4); ctx.moveTo(size * 0.5, 0); ctx.lineTo(size * 0.9, 0); }
            ctx.stroke();
        } else if (type === 'global') {
            ctx.beginPath(); ctx.moveTo(-size*0.6, -size*0.6); ctx.lineTo(size*0.6, -size*0.6); ctx.lineTo(size*0.4, 0); ctx.lineTo(-size*0.4, 0); ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, size*0.5); ctx.moveTo(-size*0.4, size*0.5); ctx.lineTo(size*0.4, size*0.5); ctx.stroke();
        } else if (type === 'missions') {
            for(let i=1; i<=3; i++) { ctx.beginPath(); ctx.arc(0, 0, size * 0.3 * i, 0, Math.PI * 2); ctx.stroke(); }
        } else if (type === 'free') {
            ctx.strokeRect(-size*0.6, -size*0.4, size*1.2, size*1);
            ctx.beginPath(); ctx.moveTo(0, -size*0.4); ctx.lineTo(0, size*0.6); ctx.moveTo(-size*0.6, size*0.1); ctx.lineTo(size*0.6, size*0.1); ctx.stroke();
        } else if (type === 'pass') {
            ctx.strokeRect(-size*0.8, -size*0.5, size*1.6, size);
            ctx.beginPath(); ctx.moveTo(-size*0.2, -size*0.5); ctx.lineTo(-size*0.2, size*0.5); ctx.stroke();
        } else if (type === 'lan') {
            ctx.beginPath(); ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-size*0.7, 0); ctx.lineTo(size*0.7, 0); ctx.moveTo(0, -size*0.7); ctx.lineTo(0, size*0.7); ctx.stroke();
        } else if (type === 'split') {
            ctx.strokeStyle = '#ec4899'; ctx.beginPath(); ctx.arc(-size*0.4, 0, size*0.4, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(size*0.4, 0, size*0.4, 0, Math.PI*2); ctx.stroke();
        } else if (type === 'eject') {
            ctx.strokeStyle = '#ec4899'; ctx.beginPath(); ctx.moveTo(0, -size*0.8); ctx.lineTo(0, size*0.8); ctx.moveTo(-size*0.8, 0); ctx.lineTo(size*0.8, 0); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, size*0.4, 0, Math.PI*2); ctx.stroke();
        } else if (type === 'pause') {
            ctx.beginPath(); ctx.moveTo(-size*0.3, -size*0.6); ctx.lineTo(-size*0.3, size*0.6); ctx.moveTo(size*0.3, -size*0.6); ctx.lineTo(size*0.3, size*0.6); ctx.stroke();
        } else if (type === 'lb_toggle') {
            for(let i=-1; i<=1; i++) { ctx.beginPath(); ctx.moveTo(-size*0.6, i*size*0.4); ctx.lineTo(size*0.6, i*size*0.4); ctx.stroke(); }
        } else if (type === 'emote') {
            ctx.beginPath(); ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(-size*0.3, -size*0.2, size*0.1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(size*0.3, -size*0.2, size*0.1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, size*0.1, size*0.4, 0, Math.PI); ctx.stroke();
        }
        ctx.restore();
    },

    render(ctx, camera) {
        for (const v of this.victims) {
            const sx = v.x - camera.x, sy = v.y - camera.y;
            ctx.save(); ctx.globalAlpha = 1 - v.progress; ctx.beginPath(); ctx.arc(sx, sy, v.radius, 0, Math.PI * 2);
            if (v.skinKey && window.Menu) window.Menu.drawSkinTexture(ctx, sx, sy, v.radius, v.skinKey, true);
            else { ctx.fillStyle = v.color; ctx.fill(); }
            ctx.restore();
        }
        for (const p of this.particles) {
            ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x - camera.x, p.y - camera.y, p.radius, 0, Math.PI * 2); ctx.fill();
        }
        for (const s of this.shockwaves) {
            ctx.save(); ctx.globalAlpha = s.opacity; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(s.x - camera.x, s.y - camera.y, s.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
        ctx.globalAlpha = 1;
    },

    renderAmbient(ctx, camera) {
        const q = localStorage.getItem('game_quality') || 'high';
        if (q === 'low') return;
        const canvasW = window.canvas.width / (window.devicePixelRatio || 1);
        const canvasH = window.canvas.height / (window.devicePixelRatio || 1);
        const zoom = camera.zoom;
        ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
        for (const a of this.ambient) {
            const sx = a.x - camera.x, sy = a.y - camera.y;
            if (sx > -10 && sx < (canvasW/zoom)+10 && sy > -10 && sy < (canvasH/zoom)+10) {
                ctx.globalAlpha = a.opacity; ctx.beginPath(); ctx.arc(sx, sy, a.radius, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
};

window.VisualEffects = VisualEffects;
VisualEffects.init();
