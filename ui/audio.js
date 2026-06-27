/**
 * AudioManager - Cyber-Audio Manager Profesional para Slip Game
 * -----------------------------------------------------------
 * Arquitectura de canales separados (BGM/SFX), Audio Pooling,
 * variación de pitch aleatoria y persistencia de configuración.
 * Optimizado para WebView (60 FPS).
 */

class AudioManager {
    constructor() {
        // Estado inicial de persistencia
        this.isMuted = localStorage.getItem('slip_game_muted') === 'true';
        this.bgmVolume = 0.4;
        this.sfxVolume = 0.6;

        // Canales y Pools
        this.bgm = null;
        this.sfxPools = {};
        this.poolSize = 6; // Instancias por sonido de alta frecuencia

        // Mapeo de archivos (Asumidos en assets/audio/)
        this.sounds = {
            'UI_CLICK': 'audio/sfx/ui_click.mp3',
            'COIN_BUY': 'audio/sfx/coin_buy.mp3',
            'PLAYER_DIVIDE': 'audio/sfx/player_divide.mp3',
            'GAME_OVER': 'audio/sfx/game_over.mp3',
            'EAT': 'audio/sfx/eat_node.mp3'
        };

        this.bgmPath = 'audio/bgm/main_theme.mp3';

        this.init();
    }

    /**
     * Inicializa el sistema, pre-carga el pool y configura el BGM.
     */
    init() {
        console.log("AudioManager: Iniciando Cyber-Audio Manager...");

        // Pre-carga de SFX Pools (Anti-Lag)
        for (const [key, path] of Object.entries(this.sounds)) {
            this.sfxPools[key] = [];
            // Los sonidos más frecuentes tienen pools más grandes
            const count = (key === 'EAT' || key === 'UI_CLICK') ? this.poolSize : 2;

            for (let i = 0; i < count; i++) {
                const audio = new Audio(path);
                audio.preload = 'auto';
                this.sfxPools[key].push(audio);
            }
        }

        // Configuración de BGM
        this.bgm = new Audio(this.bgmPath);
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        this.bgm.preload = 'auto';

        // Manejo de interacción de usuario para Auto-Play (Restricción de Browsers)
        const startOnInteraction = () => {
            if (!this.isMuted && this.bgm) {
                this.bgm.play().catch(e => console.warn("Audio: Esperando interacción...", e));
            }
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('touchstart', startOnInteraction);
        };
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('touchstart', startOnInteraction);
    }

    /**
     * Reproduce un efecto de sonido del pool.
     * @param {string} name Identificador del sonido.
     * @param {boolean} varyPitch Si debe aplicar variación aleatoria (Anti-Fatiga).
     */
    playSFX(name, varyPitch = false) {
        if (this.isMuted || !this.sfxPools[name]) return;

        // Búsqueda de instancia disponible en el pool
        const pool = this.sfxPools[name];
        let audio = pool.find(a => a.paused);

        // Si todo el pool está ocupado, forzamos el reinicio de la primera (LIFO simple)
        if (!audio) audio = pool[0];

        audio.currentTime = 0;
        audio.volume = this.sfxVolume;

        if (varyPitch) {
            // Variación entre 0.92 y 1.08 para calidad premium
            audio.playbackRate = 0.92 + Math.random() * 0.16;
        } else {
            audio.playbackRate = 1.0;
        }

        audio.play().catch(e => {
            // Silenciamos errores de "User Interacted Needed"
        });
    }

    // --- Métodos de Conveniencia ---
    playClick() { this.playSFX('UI_CLICK'); }
    playBuy() { this.playSFX('COIN_BUY'); }
    playSplit() { this.playSFX('PLAYER_DIVIDE'); }
    playEat() { this.playSFX('EAT', true); }

    playGameOver() {
        this.playSFX('GAME_OVER');
        this.fadeOutBGM();
    }

    /**
     * Efecto glitch/descendente de música para Game Over.
     */
    fadeOutBGM() {
        if (!this.bgm) return;
        let originalVol = this.bgm.volume;
        const fadeInterval = setInterval(() => {
            if (this.bgm.volume > 0.05) {
                this.bgm.volume -= 0.05;
            } else {
                this.bgm.pause();
                this.bgm.volume = originalVol;
                clearInterval(fadeInterval);
            }
        }, 150);
    }

    /**
     * Muta/Desmuta el sistema y persiste en LocalStorage.
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('slip_game_muted', this.isMuted);

        if (this.isMuted) {
            if (this.bgm) this.bgm.pause();
            console.log("Audio: MUTE ON");
        } else {
            if (this.bgm) this.bgm.play().catch(()=>{});
            console.log("Audio: MUTE OFF");
        }
        return this.isMuted;
    }
}

// Instancia global accesible desde cualquier módulo
window.AudioManager = new AudioManager();
