var Leaderboard = {
    rankings: [],

    update() {
        const multiplayerPlayers = (window.Multiplayer && window.Multiplayer.isConnected) ?
            Object.values(window.Multiplayer.remotePlayers).map(p => {
                let m = 0;
                if (p.cells && p.cells.length > 0) {
                    m = p.cells.reduce((sum, c) => sum + (c.r * c.r / 900) * 30, 0);
                }
                return { id: p.id, name: p.name || "Invitado", mass: Math.floor(m), isPlayer: false };
            }) : [];

        this.rankings = [
            { id: 'player', name: Player.name || "Tú", mass: Player.getMass(), isPlayer: true },
            ...multiplayerPlayers,
            ...Bots.items.map(b => ({
                id: b.id, name: b.name || "Bot", mass: Math.floor(b.mass), isPlayer: false
            }))
        ].sort((a, b) => b.mass - a.mass);
    },

    render() {
        const panel = document.getElementById('leaderboard');
        if (!Player.isPlaying() || panel.style.display === 'none') return;

        let html = `<h3>TOP 10</h3>`;
        const top10 = this.rankings.slice(0, 10);
        let playerInTop10 = false;
        let playerRank = 0;

        top10.forEach((entry, i) => {
            const isPlayer = entry.isPlayer;
            if (isPlayer) {
                playerInTop10 = true;
                playerRank = i + 1;
            }

            let rankTag = '';
            let nameClass = '';
            if (window.Menu && window.Menu.getRankInfo) {
                // Asignar RP basado en masa para los bots si no tienen rank asignado (pero ya tienen en bots.js)
                // Buscamos el bot real para obtener su rank exacto
                const realBot = !isPlayer ? Bots.items.find(b => b.id === entry.id) : null;
                const rp = isPlayer ? (window.progression ? window.progression.rankPoints : 0) : (realBot ? (realBot.rank.id === 'god' ? 2000 : (realBot.rank.id === 'diamante' ? 1000 : 400)) : 100);

                const rank = window.Menu.getRankInfo(rp);
                rankTag = `<span class="lb-rank-tag ${rank.class}">${rank.tag}</span>`;
                if (rank.class === 'god') nameClass = 'god';
            }

            html += `
                <div class="${isPlayer ? 'lb-player' : ''}" style="line-height: 1.4; text-shadow: 2px 2px 4px #000000; margin-bottom: 3px;">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px; display: inline-flex; align-items: center;">
                        ${i + 1}. ${rankTag} <span class="lb-name ${nameClass}">${entry.name}</span>
                    </span>
                    <b style="font-family:monospace; margin-left: 5px;">${Math.floor(entry.mass)}</b>
                </div>
            `;
        });

        // Si el jugador no está en el top 10, mostrar su posición al final
        if (!playerInTop10) {
            const index = this.rankings.findIndex(r => r.isPlayer);
            if (index !== -1) {
                const playerEntry = this.rankings[index];

                let rankTag = '';
                if (window.Menu && window.Menu.getRankInfo && window.progression) {
                    const rank = window.Menu.getRankInfo(window.progression.rankPoints);
                    rankTag = `<span class="lb-rank-tag ${rank.class}">${rank.tag}</span>`;
                }

                html += `<div class="lb-separator"></div>`;
                html += `
                    <div class="lb-player">
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100px; display: inline-flex; align-items: center;">
                            ${index + 1}. ${rankTag} ${playerEntry.name}
                        </span>
                        <b style="font-family:monospace; margin-left: 5px;">${Math.floor(playerEntry.mass)}</b>
                    </div>
                `;
            }
        }

        panel.innerHTML = html;
    }
};

window.Leaderboard = Leaderboard;
