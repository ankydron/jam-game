/**
 * AudioManager - Procedural sound generation using Web Audio API
 * No external audio files required!
 */
class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 0.3; // Overall volume
        this.muted = false;
        this.musicNodes = null;

        // Initialize on first user interaction (browser requirement)
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('AudioManager initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    // Helper: Create oscillator with envelope
    createTone(frequency, duration, type = 'sine', volume = 1.0) {
        if (!this.initialized || this.muted) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(this.masterVolume * volume, this.context.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);

        return { osc, gain };
    }

    // Helper: Create noise
    createNoise(duration, volume = 1.0) {
        if (!this.initialized || this.muted) return;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = buffer;

        const gain = this.context.createGain();
        gain.gain.value = this.masterVolume * volume;

        noise.connect(gain);
        gain.connect(this.context.destination);

        noise.start(this.context.currentTime);

        return { noise, gain };
    }

    // Sound Effects

    playJump() {
        this.init();
        // Ascending pitch jump sound
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);

        gain.gain.setValueAtTime(this.masterVolume * 0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.15);
    }

    playAttack() {
        this.init();
        // Sword swoosh - noise burst with quick decay
        const duration = 0.15;
        const noise = this.createNoise(duration, 0.2);

        // Add a quick descending tone
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + duration);

        gain.gain.setValueAtTime(this.masterVolume * 0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);
    }

    playHit() {
        this.init();
        // Impact sound - low thump
        this.createTone(80, 0.1, 'triangle', 0.4);

        // Add high frequency click
        this.createTone(1200, 0.05, 'square', 0.2);
    }

    playEnemyHit() {
        this.init();
        // Higher pitched hit for enemy
        this.createTone(150, 0.08, 'triangle', 0.3);
        this.createTone(800, 0.05, 'square', 0.15);
    }

    playDeath() {
        this.init();
        // Descending death sound
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);

        gain.gain.setValueAtTime(this.masterVolume * 0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.5);
    }

    playLevelComplete() {
        this.init();
        // Victory fanfare - ascending notes
        const notes = [262, 330, 392, 523]; // C, E, G, C (one octave up)

        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createTone(freq, 0.3, 'sine', 0.3);
            }, i * 100);
        });
    }

    playGameOver() {
        this.init();
        // Sad descending sound
        const notes = [400, 350, 300, 250];

        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createTone(freq, 0.4, 'triangle', 0.25);
            }, i * 150);
        });
    }

    playMenuSelect() {
        this.init();
        // Quick blip
        this.createTone(600, 0.08, 'square', 0.2);
    }

    playPause() {
        this.init();
        this.createTone(400, 0.1, 'sine', 0.25);
    }

    // Background Music (Simple looping melody)

    startBackgroundMusic() {
        this.init();
        if (this.musicNodes || this.muted) return;

        // Simple 4-note loop melody
        const melody = [
            { freq: 262, duration: 0.5 }, // C
            { freq: 330, duration: 0.5 }, // E
            { freq: 392, duration: 0.5 }, // G
            { freq: 330, duration: 0.5 }, // E
        ];

        let currentNote = 0;

        const playNextNote = () => {
            if (this.muted || !this.musicNodes) return;

            const note = melody[currentNote];
            this.createTone(note.freq, note.duration, 'sine', 0.05); // Very quiet

            currentNote = (currentNote + 1) % melody.length;

            this.musicNodes.timeout = setTimeout(playNextNote, note.duration * 1000);
        };

        this.musicNodes = { timeout: null };
        playNextNote();
    }

    stopBackgroundMusic() {
        if (this.musicNodes) {
            if (this.musicNodes.timeout) {
                clearTimeout(this.musicNodes.timeout);
            }
            this.musicNodes = null;
        }
    }

    // Volume Control

    setVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBackgroundMusic();
        }
        return this.muted;
    }
}
