/**
 * CyberAudioManager - Motor de Síntesis Procedural AAA para Slip Game
 * ------------------------------------------------------------------
 * Diseñado por Alexis Osorio. Implementa algoritmos de síntesis para SFX
 * de alta fidelidad sin archivos externos, optimizando latencia y memoria.
 */

class CyberAudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = localStorage.getItem('slip_game_muted') === 'true';
        this.bgmVolume = 0.35;
        this.sfxVolume = 0.5;

        // Canal de música (BGM) - Reservado para archivos externos
        this.bgm = null;
        this.bgmPath = 'audio/bgm/main_theme.mp3'; // El desarrollador puede cambiar esto

        this.initialized = false;
        this._setupInteractionListeners();
    }

    /**
     * Inicialización diferida del AudioContext por políticas de seguridad del navegador/WebView.
     */
    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = this.isMuted ? 0 : 1;

            this.initialized = true;
            console.log("CyberAudioManager: Motor de síntesis procedural activo.");

            // Inicializar BGM si existe el archivo
            this._initBGM();
        } catch (e) {
            console.error("CyberAudioManager: Error al inicializar Web Audio API.", e);
        }
    }

    _initBGM() {
        this.bgm = new Audio();
        this.bgm.src = this.bgmPath;
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        if (!this.isMuted) {
            this.bgm.play().catch(() => { /* Esperando interacción */ });
        }
    }

    _setupInteractionListeners() {
        const unlock = () => {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);
    }

    /**
     * 'UI_CLICK' - Clic mecánico sutil y futurista.
     */
    playClick() {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;

        // Cuerpo del clic (Triangular para suavidad mecánica)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);

        // Pulso metálico de alta frecuencia (Ataque rápido)
        const pulse = this.ctx.createOscillator();
        const pulseGain = this.ctx.createGain();
        const pulseFilter = this.ctx.createBiquadFilter();

        pulse.type = 'square';
        pulse.frequency.setValueAtTime(800, now);

        pulseFilter.type = 'highpass';
        pulseFilter.frequency.setValueAtTime(2500, now);

        pulseGain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        pulseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);

        pulse.connect(pulseFilter);
        pulseFilter.connect(pulseGain);
        pulseGain.connect(this.masterGain);

        pulse.start(now);
        pulse.stop(now + 0.03);
    }

    /**
     * 'EAT' - "Pop Acústico Hueco". Orgánico y con peso físico.
     */
    playEat() {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;
        const pitchMod = 0.92 + Math.random() * 0.16; // Variación aleatoria premium

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(45 * pitchMod, now + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        filter.Q.value = 5; // Resonancia para el efecto "hueco"

        gain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * 'COIN_BUY / GACHA' - Apertura mecánica + Acorde digital de dopamina.
     */
    playBuy() {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;

        // 1. Mecanismo abriéndose (Ruido blanco filtrado)
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1500, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.15);

        noiseGain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);

        // 2. Acorde de Victoria (Intervalos de 3ra y 5ta Mayor)
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Do Mayor brillante)
        freqs.forEach((f, i) => {
            const vOsc = this.ctx.createOscillator();
            const vGain = this.ctx.createGain();
            const vFilter = this.ctx.createBiquadFilter();

            vOsc.type = 'sine';
            vOsc.frequency.value = f;

            vFilter.type = 'lowpass';
            vFilter.frequency.value = 4000;

            const delay = i * 0.04; // Arpegio rápido para textura
            vGain.gain.setValueAtTime(0, now + delay);
            vGain.gain.linearRampToValueAtTime(0.2 * this.sfxVolume, now + delay + 0.05);
            vGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.6);

            vOsc.connect(vFilter);
            vFilter.connect(vGain);
            vGain.connect(this.masterGain);

            vOsc.start(now + delay);
            vOsc.stop(now + delay + 0.7);
        });
    }

    /**
     * 'PLAYER_DIVIDE' - Mini-explosión controlada y pesada.
     */
    playSplit() {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        filter.Q.value = 10;

        gain.gain.setValueAtTime(0.7 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * 'GAME_OVER' - Glitch de desconexión y caída de energía.
     */
    playGameOver() {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;
        const duration = 1.8;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + duration);

        gain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.1, now + duration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.2);

        this.fadeOutBGM();
    }

    /**
     * Gestión de BGM y estados
     */
    fadeOutBGM() {
        if (!this.bgm) return;
        const currentVol = this.bgm.volume;
        const steps = 20;
        const interval = 1000 / steps;
        let count = 0;

        const fade = setInterval(() => {
            count++;
            this.bgm.volume = Math.max(0, currentVol * (1 - count / steps));
            if (count >= steps) {
                this.bgm.pause();
                this.bgm.volume = this.bgmVolume;
                clearInterval(fade);
            }
        }, interval);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('slip_game_muted', this.isMuted);

        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.1);
        }

        if (this.bgm) {
            if (this.isMuted) this.bgm.pause();
            else this.bgm.play().catch(() => {});
        }

        console.log(`AudioManager: ${this.isMuted ? 'MUTE ON' : 'MUTE OFF'}`);
        return this.isMuted;
    }
}

// Inyección del Manager en el contexto global
window.AudioManager = new CyberAudioManager();
