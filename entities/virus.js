const Virus = {
    items: [],

    createVirus(x, y, vx = 0, vy = 0) {
        return {
            x, y, radius: 55, fed: 0, vx, vy,
            breathPhase: Math.random() * Math.PI * 2,
            spikes: true
        };
    },

    generate(amount = 15) {
        for (let i = 0; i < amount; i++) {
            this.items.push(this.createVirus(
                Math.random() * World.width,
                Math.random() * World.height
            ));
        }
    },

    update(dt = 16.6) {
        const dtFactor = dt / 16.6;
        const damping = Math.pow(0.95, dtFactor);

        for (let i = this.items.length - 1; i >= 0; i--) {
            const virus = this.items[i];
            virus.breathPhase += 0.05 * dtFactor;

            if (virus.vx || virus.vy) {
                virus.x += virus.vx * dtFactor; virus.y += virus.vy * dtFactor;
                virus.vx *= damping; virus.vy *= damping;
                if (Math.abs(virus.vx) < 0.1) virus.vx = 0;
                if (Math.abs(virus.vy) < 0.1) virus.vy = 0;
            }

            // Colisiones con Jugador (Z-Index manejado en engine.js)
            for (const cell of Player.cells) {
                const d = Math.hypot(cell.x - virus.x, cell.y - virus.y);
                // Si eres más grande que el virus -> EXPLOTAS (Prioridad 2)
                if (d < cell.radius && cell.radius > virus.radius * 1.1) {
                    if (Player.cells.length < 16) {
                        this.explodeCell(cell);
                        this.items.splice(i, 1);
                        this.items.push(this.createVirus(Math.random()*World.width, Math.random()*World.height));
                        break;
                    }
                }
            }
        }
    },

    explodeCell(cell) {
        const pieces = 10;
        const newMass = cell.mass / pieces;
        const newR = 30 * Math.sqrt(newMass / 30);
        cell.mass = newMass;
        cell.targetRadius = newR;
        cell.mergeTimer = 15;
        for (let i = 1; i < pieces; i++) {
            const angle = Math.random() * Math.PI * 2;
            Player.cells.push({
                x: cell.x, y: cell.y, mass: newMass, radius: newR, visualRadius: newR, targetRadius: newR,
                vx: Math.cos(angle) * 25, vy: Math.sin(angle) * 25,
                mergeTimer: 15, seed: Math.random() * 100,
                points: Player.initSpringPoints(newR)
            });
        }
    },

    render(ctx, camera) {
        ctx.fillStyle = "#33ff33";
        ctx.strokeStyle = "#22cc22";
        ctx.lineWidth = 4;

        for (const virus of this.items) {
            const breath = 1 + Math.sin(virus.breathPhase) * 0.05;
            const r = virus.radius * breath;
            const sx = virus.x - camera.x, sy = virus.y - camera.y;

            ctx.beginPath();
            let spikes = 20;
            const q = localStorage.getItem('game_quality') || 'high';
            if (q === 'low') spikes = 12;
            else if (q === 'medium') spikes = 18;
            else if (q === 'very_high') spikes = 40;

            for (let i = 0; i < spikes * 2; i++) {
                const angle = (Math.PI * i) / spikes;
                const dist = i % 2 === 0 ? r : r * 1.15;
                const px = sx + Math.cos(angle) * dist;
                const py = sy + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
    }
};

window.Virus = Virus;
