/**
 * SLIP GAME - CyberAudioManager (Premium Neon Edition)
 * Ingeniero de Audio: Alexis Osorio
 * Estabilidad: Ultra-Segura para Android WebView
 */

class CyberAudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = localStorage.getItem('slip_game_muted') === 'true';
        this.initialized = false;
    }

    /**
     * Inicialización segura del contexto de audio.
     */
    async init() {
        if (this.initialized) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.updateVolume();
            this.initialized = true;
            console.log("🔊 CyberAudioManager: Blindaje inicializado.");
        } catch (e) {
            console.error("❌ Error inicializando AudioContext:", e);
        }
    }

    /**
     * Verifica y reactiva el contexto si Android lo suspende.
     */
    async resumeContext() {
        if (!this.ctx) await this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
            } catch (e) {
                console.warn("AudioContext resume failed:", e);
            }
        }
    }

    updateVolume() {
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime, 0.02);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('slip_game_muted', this.isMuted);
        this.updateVolume();
        return this.isMuted;
    }

    /**
     * Motor de síntesis procedural robusto.
     */
    async play(type) {
        if (this.isMuted) return;

        try {
            await this.resumeContext();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const now = this.ctx.currentTime;

            switch (type) {
                case 'UI_CLICK': this.createUiClick(now); break;
                case 'EAT': this.createEatPop(now); break;
                case 'PLAYER_DIVIDE': this.createDivideSwoosh(now); break;
                case 'COIN_BUY': this.createCoinChime(now); break;
                case 'GAME_OVER': this.createGameOverTone(now); break;
            }
        } catch (error) {
            console.warn(`Audio Playback Error (${type}):`, error);
        }
    }

    // Aliases para compatibilidad con el código existente
    playClick() { this.play('UI_CLICK'); }
    playEat() { this.play('EAT'); }
    playSplit() { this.play('PLAYER_DIVIDE'); }
    playBuy() { this.play('COIN_BUY'); }
    playGameOver() { this.play('GAME_OVER'); }

    // --- GENERADORES PROCEDURALES ---

    createUiClick(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    createEatPop(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const pitchMod = 0.92 + Math.random() * 0.16;
        const baseFreq = 250 * pitchMod;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(450 * pitchMod, now + 0.06);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.06);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    createDivideSwoosh(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    createCoinChime(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    createGameOverTone(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

const AudioManager = new CyberAudioManager();
window.AudioManager = AudioManager;

// Listener para desbloquear el audio en Android
const unlockAudio = () => {
    AudioManager.resumeContext();
    // No removemos el listener para asegurar que siempre intentamos resumir si se suspende
};
document.addEventListener('touchstart', unlockAudio, { once: false, passive: true });
document.addEventListener('click', unlockAudio, { once: false, passive: true });
