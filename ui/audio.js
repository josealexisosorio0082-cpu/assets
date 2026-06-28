/**
 * SLIP GAME - CyberAudioManager (Intelligent Edition)
 * Este motor detecta archivos por palabras clave en su descripción/nombre,
 * permitiendo agregar nuevos sonidos simplemente poniéndolos en la carpeta.
 */

class CyberAudioManager {
    constructor() {
        this.basePath = 'ui/Sonido General/';
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = localStorage.getItem('slip_game_muted') === 'true';
        this.initialized = false;

        this.sfx = new Map();
        this.bgm = new Map();
        this.currentBgm = null;

        // Diccionario de Palabras Clave para mapeo automático por descripción
        this.keywords = {
            'LEVELUP': ['subir', 'nivel', 'level', 'up'],
            'SHOP_BGM': ['tienda', 'shop', 'market', 'loop'],
            'SLIP_PASS': ['slip', 'pass', 'pase'],
            'GAMEOVER': ['pierde', 'muerte', 'gameover', 'fail', 'derrota'],
            'CLOSE_MENU': ['cerrar', 'close', 'back', 'volver'],
            'MENU_BGM': ['fondo', 'menu', 'principal', 'lobby', 'inicio'],
            'EQUIP_SKIN': ['equipar', 'equip', 'desbloquear'],
            'CLICK': ['click', 'tap', 'boton', 'hacer'],
            'EJECT': ['arroja', 'bolitas', 'masa', 'eject', 'lanzar'],
            'COIN': ['dinero', 'monedas', 'coins', 'cash', 'obtener'],
            'BUY_SKIN': ['compra', 'buy', 'shop', 'venta'],
            'UPGRADE': ['mejoras', 'upgrade', 'potions', 'evolucion'],
            'MERGE': ['unir', 'completamente', 'merge', 'unirse'],
            'EAT': ['comer', 'como', 'celula', 'eat', 'general'],
            'EXCLUSIVE_MENU': ['exclusivas', 'exclusive', 'especial'],
            'MERGING_LOOP': ['unen', 'loop', 'juntar', 'unirse'],
            'DAILY_CHEST': ['free', 'regalo', 'gratis', 'daily', 'chest'],
            'MISSION_REWARD': ['misiones', 'mission', 'recompensa'],
            'NOTIFICATION': ['notificacion', 'regrese', 'vuelve', 'alert'],
            'SPLIT': ['divide', 'split', 'posibles', 'separar']
        };

        // Lista de archivos actuales para inicialización (en Android WebView no se puede listar carpetas)
        this.knownFiles = [
            "Sonido al subir de nivel.mp3",
            "Sonido de la tienda loop.mp3",
            "Sonido al  abrir el Slip Pass.mp3",
            "Sonido cuando Pierde el jugador.mp3",
            "Sonido al Cerrar todos los menus.mp3",
            "Sonido de fondo del menu principal Loop.mp3",
            "Sonido al equipar o desbloquear una skin.mp3",
            "sonido al hacer click en todo el menu principal.mp3",
            "Sonido Cuando el jugador arroja bolitas de masa.mp3",
            "Sonido cuando el jugador obtiene dinero en general.mp3",
            "Sonido cuando el jugador Desbloquea Skin o las compra.mp3",
            "Sonido cuando el jugador Obtiene mejoras para su celula.mp3",
            "Sonido cuando el jugador se vuelve a unir completamente.mp3",
            "Sonido cuando el jugador se como a otra celula en general.mp3",
            "Sonido cuando el jugador entra al menu de skins exclusivas.mp3",
            "Sonido cuando las celulas separadas del jugar se unen loop.mp3",
            "Sonido cuando el usuario le salta el menu de Free regalo gratis.mp3",
            "Sonido cuando al jugar completa misiones y recibe recompensas gratis.mp3",
            "Sonido cuando el juego manda notificacion al jugador que regrese a jugar.mp3",
            "Sonido cuando el jugador se divide las veces que son posibles en la partida.mp3"
        ];

        console.log("🔊 CyberAudioManager: Sistema de detección inteligente por descripción listo.");
    }

    async init() {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.updateVolume();
            this.initialized = true;
            console.log("🚀 AudioContext Activado.");
            await this.autoLoad(this.knownFiles);
        } catch (e) {
            console.error("❌ Fallo Crítico AudioContext:", e);
        }
    }

    /**
     * Mapea y Carga archivos automáticamente basándose en su nombre/descripción.
     * @param {string[]} fileList - Lista de nombres de archivos.
     */
    async autoLoad(fileList) {
        for (const fileName of fileList) {
            const lowerName = fileName.toLowerCase();
            let assigned = false;

            for (const [id, patterns] of Object.entries(this.keywords)) {
                if (patterns.some(p => lowerName.includes(p))) {
                    if (lowerName.includes('loop')) {
                        this.setupBGM(id, fileName);
                    } else {
                        await this.loadSFX(id, fileName);
                    }
                    assigned = true;
                    console.log(`📌 Asignado Automáticamente: ${fileName} -> [${id}]`);
                    break;
                }
            }
            if (!assigned) console.warn(`⚠️ Archivo sin categoría reconocida: ${fileName}`);
        }
    }

    async loadSFX(id, fileName) {
        try {
            const response = await fetch(this.basePath + encodeURIComponent(fileName));
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.sfx.set(id, audioBuffer);
        } catch (e) {
            console.warn(`No se pudo cargar SFX: ${fileName}`, e);
        }
    }

    setupBGM(id, fileName) {
        const audio = new Audio(this.basePath + encodeURIComponent(fileName));
        audio.loop = true;
        audio.preload = 'auto';
        this.bgm.set(id, audio);
    }

    async play(type) {
        if (this.isMuted || !this.initialized) return;
        try {
            await this.resumeContext();
            const buffer = this.sfx.get(type);
            if (!buffer) return;
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.masterGain);
            source.start(0);
        } catch (e) {
            console.warn(`Error reproduciendo SFX (${type}):`, e);
        }
    }

    playBGM(type) {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm.currentTime = 0;
        }
        const nextBgm = this.bgm.get(type);
        if (nextBgm) {
            this.currentBgm = nextBgm;
            if (!this.isMuted) {
                this.currentBgm.play().catch(e => console.log("Interacción requerida para BGM: " + type));
            }
        }
    }

    stopBGM() {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm.currentTime = 0;
            this.currentBgm = null;
        }
    }

    async resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    updateVolume() {
        const vol = this.isMuted ? 0 : 0.7;
        if (this.masterGain) this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
        if (this.currentBgm) this.currentBgm.volume = vol;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('slip_game_muted', this.isMuted);
        this.updateVolume();
        if (this.currentBgm) {
            if (this.isMuted) this.currentBgm.pause();
            else this.currentBgm.play().catch(() => {});
        }
        return this.isMuted;
    }

    // Métodos de acceso (El juego llama a estos, el motor busca el sonido mapeado)
    playLevelUp() { this.play('LEVELUP'); }
    playGameOver() { this.play('GAMEOVER'); }
    playClick() { this.play('CLICK'); }
    playEat() { this.play('EAT'); }
    playSplit() { this.play('SPLIT'); }
    playEject() { this.play('EJECT'); }
    playCoin() { this.play('COIN'); }
    playBuySkin() { this.play('BUY_SKIN'); }
    playEquipSkin() { this.play('EQUIP_SKIN'); }
    playCloseMenu() { this.play('CLOSE_MENU'); }
    playSlipPass() { this.play('SLIP_PASS'); }
    playUpgrade() { this.play('UPGRADE'); }
    playMerge() { this.play('MERGE'); }
    playExclusiveMenu() { this.play('EXCLUSIVE_MENU'); }
    playDailyChest() { this.play('DAILY_CHEST'); }
    playMissionReward() { this.play('MISSION_REWARD'); }
    playNotification() { this.play('NOTIFICATION'); }

    startMenuMusic() { this.playBGM('MENU_BGM'); }
    startShopMusic() { this.playBGM('SHOP_BGM'); }
    startMergingMusic() { this.playBGM('MERGING_LOOP'); }
}

const AudioManager = new CyberAudioManager();
window.AudioManager = AudioManager;

const unlock = async () => {
    await AudioManager.init();
    if (AudioManager.currentBgm === null) {
        AudioManager.startMenuMusic();
    }
};

document.addEventListener('touchstart', unlock, { once: true, passive: true });
document.addEventListener('mousedown', unlock, { once: true, passive: true });
