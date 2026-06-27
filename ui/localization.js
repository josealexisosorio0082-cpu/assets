var Localization = {
    current: localStorage.getItem('slip_lang') || 'es',

    strings: {
        es: {
            // Menu
            "start": "INICIAR",
            "shop": "TIENDA",
            "market": "MERCADO",
            "gift": "Regalo",
            "top": "Top",
            "missions": "Misiones",
            "pass": "Pase",
            "setup": "Ajustes",
            "lan": "LAN",
            "loading_neural": "Sincronizando red neuronal...",
            "player_placeholder": "Usuario...",
            "creator": "CREADOR ALEXIS OSORIO",

            // Settings
            "settings_title": "Configuración",
            "graphic_quality": "Calidad Gráfica",
            "controls": "Controles",
            "language": "Idioma",
            "quality_low": "BAJA",
            "quality_medium": "MEDIA",
            "quality_high": "ALTA",
            "quality_ultra": "ULTRA",
            "control_touch": "TOUCH",
            "control_mouse": "MOUSE",

            // Profile
            "max_mass": "MAX MASA",
            "games": "PARTIDAS",
            "survive": "SURVIVE",
            "kills": "KILLS",
            "plasma_credits": "CRÉDITOS DE PLASMA",
            "customize_avatar": "PERSONALIZAR AVATAR",

            // Shop
            "back": "VOLVER",
            "skins": "Skins",
            "mass": "Maza",
            "speed": "Velocidad",
            "emotes": "Emotes",
            "potions": "Pociones",
            "money": "Dinero",
            "lab": "Laboratorio",
            "premium": "PREMIUM",
            "levels": "NIVELES",
            "exclusive": "EXCL",
            "free": "GRATIS",
            "buy": "COMPRAR",
            "equipped": "EQUIPADA",
            "select": "SELECCIONAR",
            "get": "OBTENER",

            // Game Over
            "game_over": "Game Over",
            "final_mass_title": "MASA MÁXIMA ALCANZADA",
            "experience": "EXPERIENCIA",
            "retry": "Reintentar",
            "main_menu": "Menú Principal",

            // Alerts
            "restart_required_title": "REINICIO REQUERIDO",
            "restart_required_msg": "El idioma ha cambiado. La aplicación se reiniciará para aplicar los cambios.",
            "accept": "ACEPTAR",
            "cancel": "CANCELAR",
            "confirm_purchase": "CONFIRMAR COMPRA",
            "insufficient_balance": "SALDO INSUFICIENTE"
        },
        en: {
            // Menu
            "start": "START",
            "shop": "SHOP",
            "market": "MARKET",
            "gift": "Gift",
            "top": "Top",
            "missions": "Missions",
            "pass": "Pass",
            "setup": "Setup",
            "lan": "LAN",
            "loading_neural": "Syncing neural network...",
            "player_placeholder": "Username...",
            "creator": "CREATOR ALEXIS OSORIO",

            // Settings
            "settings_title": "Settings",
            "graphic_quality": "Graphic Quality",
            "controls": "Controls",
            "language": "Language",
            "quality_low": "LOW",
            "quality_medium": "MEDIUM",
            "quality_high": "HIGH",
            "quality_ultra": "ULTRA",
            "control_touch": "TOUCH",
            "control_mouse": "MOUSE",

            // Profile
            "max_mass": "MAX MASS",
            "games": "GAMES",
            "survive": "SURVIVE",
            "kills": "KILLS",
            "plasma_credits": "PLASMA CREDITS",
            "customize_avatar": "CUSTOMIZE AVATAR",

            // Shop
            "back": "BACK",
            "skins": "Skins",
            "mass": "Mass",
            "speed": "Speed",
            "emotes": "Emotes",
            "potions": "Potions",
            "money": "Money",
            "lab": "Lab",
            "premium": "PREMIUM",
            "levels": "LEVELS",
            "exclusive": "EXCL",
            "free": "FREE",
            "buy": "BUY",
            "equipped": "EQUIPPED",
            "select": "SELECT",
            "get": "GET",

            // Game Over
            "game_over": "Game Over",
            "final_mass_title": "MAX MASS REACHED",
            "experience": "EXPERIENCE",
            "retry": "Retry",
            "main_menu": "Main Menu",

            // Alerts
            "restart_required_title": "RESTART REQUIRED",
            "restart_required_msg": "Language has changed. The app will restart to apply changes.",
            "accept": "ACCEPT",
            "cancel": "CANCEL",
            "confirm_purchase": "CONFIRM PURCHASE",
            "insufficient_balance": "INSUFFICIENT BALANCE"
        }
    },

    get: function(key) {
        return (this.strings[this.current] && this.strings[this.current][key]) || key;
    },

    apply: function() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.get(key);
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translation;
            } else {
                el.innerText = translation;
            }
        });
    }
};

window.Localization = Localization;
