const EvolutionLab = {
    upgrades: {
        magneto: { name: "Magneto de Slip Coins", icon: "🧲", baseCost: 1500, maxLevel: 10, valuePerLevel: 0.1, currency: 'coins', desc: "Aumenta el radio de atracción de monedas." },
        banker: { name: "Banquero Overlord", icon: "🏦", baseCost: 10, maxLevel: 10, valuePerLevel: 0.1, currency: 'dna', desc: "Multiplica las monedas de las misiones." },
        trails: { name: "Estela de Fusión", icon: "✨", baseCost: 12, maxLevel: 5, valuePerLevel: 1, currency: 'dna', desc: "Efectos visuales más densos al fusionarse." }
    },

    getUpgradeData() {
        const saved = localStorage.getItem('slip_evolution_data_v2');
        if (saved) return JSON.parse(saved);
        return { magneto: 0, banker: 0, trails: 0 };
    },

    saveUpgradeData(data) {
        localStorage.setItem('slip_evolution_data_v2', JSON.stringify(data));
    },

    getCost(type, level) {
        const up = this.upgrades[type];
        const multiplier = type === 'magneto' ? 1.4 : 1.8;
        return Math.floor(up.baseCost * Math.pow(multiplier, level));
    },

    buyUpgrade(type) {
        const data = this.getUpgradeData();
        const up = this.upgrades[type];
        if (data[type] >= up.maxLevel) {
            if (window.Menu) window.Menu.showAlert("NIVEL MÁXIMO", "Ya has alcanzado el límite para esta mejora.", "⭐");
            else alert("Nivel máximo alcanzado");
            return;
        }

        const cost = this.getCost(type, data[type]);
        const balance = parseInt(localStorage.getItem(up.currency === 'coins' ? 'slipCoins' : 'slipDna') || 0);

        if (balance >= cost) {
            const msg = `¿Mejorar ${up.name} al nivel ${data[type] + 1} por ${cost} ${up.currency === 'coins' ? 'Monedas' : 'ADN'}?`;

            if (window.Menu) {
                window.Menu.showAlert("CONFIRMAR MEJORA", msg, up.icon, () => {
                    if (up.currency === 'coins') window.Engine.addCoins(-cost);
                    else window.Engine.addDna(-cost);

                    data[type]++;
                    this.saveUpgradeData(data);
                    this.renderLab();
                }, () => {}, "MEJORAR", "CANCELAR");
            } else {
                if (confirm(msg)) {
                    if (up.currency === 'coins') window.Engine.addCoins(-cost);
                    else window.Engine.addDna(-cost);
                    data[type]++;
                    this.saveUpgradeData(data);
                    this.renderLab();
                }
            }
        } else {
            const missing = cost - balance;
            const currencyName = up.currency === 'coins' ? 'Monedas' : 'ADN';
            if (window.Menu) {
                window.Menu.showAlert("RECURSOS INSUFICIENTES", `Te faltan ${missing} ${currencyName} para esta mejora galáctica.`, "💰", () => {
                    window.Menu.openShopCategory(up.currency === 'coins' ? 'coins' : 'dna');
                }, () => {}, "RECARGAR", "CERRAR");
            } else {
                alert("No tienes suficientes recursos");
            }
        }
    },

    renderLab() {
        const list = document.getElementById('itemsGrid');
        if (!list) return;

        const data = this.getUpgradeData();
        list.innerHTML = Object.keys(this.upgrades).map(key => {
            const up = this.upgrades[key];
            const lvl = data[key];
            const cost = this.getCost(key, lvl);
            const isMax = lvl >= up.maxLevel;
            const bonus = (up.valuePerLevel * lvl * 100).toFixed(0);

            return `
                <div class="skin-card">
                    <div style="font-size: 2rem; margin-bottom: 10px;">${up.icon}</div>
                    <div style="font-weight: 950; color: #fff; font-size: 0.8rem;">${up.name.toUpperCase()}</div>
                    <div style="font-size: 0.6rem; color: #8b5cf6; margin: 5px 0; font-weight: 900;">NIVEL ${lvl} / ${up.maxLevel}</div>
                    <div style="font-size: 0.55rem; color: #94a3b8; margin-bottom: 5px; height: 24px;">${up.desc}</div>
                    <div style="font-size: 0.7rem; color: #22c55e; font-weight: 900; margin-bottom: 15px;">+${bonus}% ACTUAL</div>
                    <button class="item-price-btn" style="background: ${isMax ? '#475569' : '#8b5cf6'}" onclick="EvolutionLab.buyUpgrade('${key}')">
                        ${isMax ? 'MAX' : (up.currency === 'coins' ? '💰 ' : '🧬 ') + cost}
                    </button>
                </div>
            `;
        }).join('');
    }
};

window.EvolutionLab = EvolutionLab;
