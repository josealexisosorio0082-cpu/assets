/**
 * ui/audio.js
 * ------------
 * Simple audio manager that uses the Web Audio API to generate short
 * tones for the most important game actions: split, absorb and death.
 * No external audio files are required – the tones are generated on the
 * fly, keeping the implementation lightweight and avoiding extra assets.
 */

const AudioManager = (() => {
    let ctx = null;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) ctx = new AudioContextClass();
    } catch (e) {
        console.warn("AudioContext no soportado o bloqueado");
    }

    // Helper to play a beep with given frequency and duration.
    function beep(freq, duration = 0.08, volume = 0.2) {
        if (!ctx || ctx.state === 'closed') return;
        try {
            // Reanudar contexto si está suspendido (requerido por navegadores modernos)
            if (ctx.state === 'suspended') ctx.resume();

            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = freq;
            gain.gain.value = volume;
            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    return {
        playSplit() {
            // High‑pitched short beep for split.
            beep(600);
        },
        playAbsorb() {
            // Mid‑pitched beep for absorption.
            beep(400);
        },
        playDeath() {
            // Low‑pitched longer beep for death.
            beep(200, 0.3, 0.3);
        }
    };
})();

// Expose globally so other modules can call it.
window.AudioManager = AudioManager;
