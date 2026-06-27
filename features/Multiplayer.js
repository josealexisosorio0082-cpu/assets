const Multiplayer = {
    isServer: false,
    isConnected: false,
    remotePlayers: {}, // { id: { x, y, mass, name, skin } }
    myId: Math.random().toString(36).substr(2, 9),

    init() {
        window.Multiplayer = this;
    },

    createRoom() {
        if (!window.AndroidBridge) return;
        this.isServer = true;
        this.isConnected = true;
        window.AndroidBridge.startLanServer();
        const code = window.AndroidBridge.getRoomCode();

        // El Lobby se maneja visualmente desde menu.js para coordinar con el UI
    },

    joinRoom() {
        const code = prompt("Introduce el código de 6 dígitos del grupo:");
        if (code && window.AndroidBridge) {
            const ip = window.AndroidBridge.getIpFromCode(code);
            if (ip) {
                this.isServer = false;
                window.AndroidBridge.connectToLanServer(ip);
                this.isConnected = true;
                alert("Conectando al grupo...");
                document.getElementById('lanModal').classList.remove('is-open');
            } else {
                alert("Código inválido o formato incorrecto.");
            }
        }
    },

    sendUpdate() {
        if (!this.isConnected || !window.AndroidBridge) return;
        const data = {
            id: this.myId,
            name: Player.name,
            skin: Player.skinKey,
            cells: Player.cells.map(c => ({ x: c.x, y: c.y, r: c.radius })),
            emote: Player.activeEmote ? Player.activeEmote.text : null
        };
        window.AndroidBridge.sendLanMessage(JSON.stringify(data));
    },

    onMessageReceived(msg) {
        try {
            const data = JSON.parse(msg);
            if (!data || !data.id || data.id === this.myId) return;
            if (!data.cells || !Array.isArray(data.cells)) return;

            // Si no estaba registrado, actualizar lista del lobby
            if (!this.remotePlayers[data.id]) {
                this.updateLobbyList(data.name);
            }

            this.remotePlayers[data.id] = data;
        } catch (e) {
            console.error("Error al procesar mensaje LAN:", e);
        }
    },

    updateLobbyList(newName) {
        const container = document.getElementById('lanPlayersContainer');
        if (container) {
            const div = document.createElement('div');
            div.style.fontWeight = '800';
            div.style.fontSize = '14px';
            div.style.color = '#334155';
            div.innerText = '• ' + (newName || "Jugador");
            container.appendChild(div);
        }
    },

    render(ctx, camera) {
        if (!this.isConnected || !this.remotePlayers) return;

        for (const id in this.remotePlayers) {
            const p = this.remotePlayers[id];
            if (!p || !p.cells) continue;

            p.cells.forEach((cell, idx) => {
                if (!cell) return;
                const sx = cell.x - camera.x, sy = cell.y - camera.y;
                const r = cell.r || 30;

                ctx.save();
                if (window.Menu && p.skin) {
                    window.Menu.drawSkinTexture(ctx, sx, sy, r, p.skin, true);
                }

                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 12px Inter";
                ctx.textAlign = "center";
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5;
                ctx.strokeText(p.name || "Jugador", sx, sy);
                ctx.fillText(p.name || "Jugador", sx, sy);

                // Renderizar emote del jugador remoto
                if (idx === 0 && p.emote) {
                    ctx.font = `${r * 0.8}px Inter`;
                    const bounce = Math.sin(Date.now() * 0.01) * 5;
                    ctx.fillText(p.emote, sx, sy - r - 30 + bounce);
                }
                ctx.restore();
            });
        }
    }
};

Multiplayer.init();
