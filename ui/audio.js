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
     * Motor de síntesis procedural robusto y multi-capa.
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
                case 'LEVEL_UP': this.createLevelUpFanfare(now); break;
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
    playLevelUp() { this.play('LEVEL_UP'); }

    // --- GENERADORES PROCEDURALES MEJORADOS ---

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
        // Capa 1: El "Pop" (Frecuencia rápida hacia arriba)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        const pitchMod = 0.9 + Math.random() * 0.2;
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200 * pitchMod, now);
        osc1.frequency.exponentialRampToValueAtTime(600 * pitchMod, now + 0.05);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.05);

        // Capa 2: El "Click" (Ruido de alta frecuencia para impacto)
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.01, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(5000, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.01);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
    }

    createDivideSwoosh(now) {
        // Capa 1: Swoosh (Frecuencia subiendo)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.linearRampToValueAtTime(0, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Capa 2: Sub-Impacto (Frecuencia baja bajando)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(150, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now);
        osc2.stop(now + 0.2);
    }

    createCoinChime(now) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now); // E6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
    }

    createLevelUpFanfare(now) {
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.05, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    createGameOverTone(now) {
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(60, now + 1.5);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5, now);
        lfoGain.gain.setValueAtTime(20, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 1.5);
        osc.stop(now + 1.5);
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
