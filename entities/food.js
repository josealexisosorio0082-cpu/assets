const Food = {
    items: [],
    pool: [], // Object Pooling
    colors: ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#a855f7", "#ec4899"],

    getFood() {
        if (this.pool.length > 0) {
            const f = this.pool.pop();
            f.animRadius = 0;
            return f;
        }
        return { x: 0, y: 0, radius: 5, color: "#000", ejected: false, animRadius: 0 };
    },

    recycle(food) {
        this.pool.push(food);
    },

    createFood(x, y) {
        // MÓDULO 1: Asegurar que World.width/height son válidos antes de calcular
        const w = (window.World && window.World.width > 0) ? window.World.width : 5000;
        const h = (window.World && window.World.height > 0) ? window.World.height : 5000;

        const finalX = x !== undefined ? x : Math.random() * w;
        const finalY = y !== undefined ? y : Math.random() * h;

        const f = this.getFood();
        f.x = finalX; f.y = finalY; f.radius = 5;
        f.animRadius = 5;
        f.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        f.ejected = false;
        f.vx = 0; f.vy = 0;
        f.isDying = false;
        return f;
    },

    generate(amount = 400) {
        for (let i = 0; i < amount; i++) this.items.push(this.createFood());
    },

    addEjectedMass(x, y, vx, vy, owner = null, r = 8) {
        const f = this.getFood();
        f.x = x; f.y = y; f.radius = r; f.vx = vx; f.vy = vy;
        f.color = owner ? owner.color || "#f59e0b" : "#f59e0b";
        f.ejected = true; f.owner = owner; f.cooldown = 20;
        this.items.push(f);
    },

    update() {
        let ejectedCount = 0;
        let normalCount = 0;
        for (let i = this.items.length - 1; i >= 0; i--) {
            const f = this.items[i];

            if (f.isDying) {
                f.animRadius -= 1.25; // Scale Tween: 5 to 0 in ~4 frames
                if (f.animRadius <= 0) {
                    this.items.splice(i, 1);
                    this.recycle(f);
                }
                continue;
            }

            if (f.ejected) {
                ejectedCount++;
                f.x += f.vx; f.y += f.vy;
                f.vx *= 0.94; f.vy *= 0.94;
                if (f.cooldown > 0) f.cooldown--;
                f.x = Math.max(5, Math.min(World.width - 5, f.x));
                f.y = Math.max(5, Math.min(World.height - 5, f.y));
            } else {
                normalCount++;
            }
        }

        const targetCount = (window.CONFIG && window.CONFIG.quality === 'low') ? 200 : 400;
        while (normalCount < targetCount) {
            this.items.push(this.createFood());
            normalCount++;
        }
    },

    render(ctx, camera) {
        const visuals = (window.CONFIG && window.CONFIG.visuals) ? window.CONFIG.visuals : { shadowBlur: 0 };
        const isLow = window.CONFIG && window.CONFIG.quality === 'low';
        const isMedium = window.CONFIG && window.CONFIG.quality === 'medium';

        const viewW = window.innerWidth / camera.zoom;
        const viewH = window.innerHeight / camera.zoom;

        // Agrupar por color para batching
        const batches = {};
        const ejectedItems = [];

        for (let i = 0; i < this.items.length; i++) {
            const f = this.items[i];
            const sx = f.x - camera.x, sy = f.y - camera.y;

            // Frustum Culling
            if (sx < -20 || sx > viewW + 20 || sy < -20 || sy > viewH + 20) continue;

            if (f.ejected) {
                ejectedItems.push(f);
                continue;
            }

            if (!batches[f.color]) batches[f.color] = [];
            batches[f.color].push(f);
        }

        // Renderizado en lotes (Mucho más rápido)
        for (const color in batches) {
            ctx.fillStyle = color;
            ctx.beginPath();
            const items = batches[color];
            for (let i = 0; i < items.length; i++) {
                const f = items[i];
                const sx = f.x - camera.x, sy = f.y - camera.y;
                const r = f.animRadius || f.radius;
                ctx.moveTo(sx + r, sy);
                ctx.arc(sx, sy, r, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        // Masa eyectada (Suele ser poca, renderizado individual para efectos si aplica)
        for (const f of ejectedItems) {
            const sx = f.x - camera.x, sy = f.y - camera.y;
            ctx.beginPath();
            ctx.arc(sx, sy, f.radius, 0, Math.PI * 2);
            ctx.fillStyle = f.color;

            if (!isLow && !isMedium && visuals.shadowBlur > 0) {
                ctx.save();
                ctx.shadowBlur = visuals.shadowBlur / 2;
                ctx.shadowColor = f.color;
                ctx.fill();
                ctx.restore();
            } else {
                ctx.fill();
            }

            if (f.ejected && !isLow && visuals.shadowBlur > 15) {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }
};

window.Food = Food;
