export default class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.isMuted = false;
        this.sounds = {};
        this.currentMusic = null;
        this.isGameMusic = false;
        
        this.createSounds();
    }

    createSounds() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.sounds = {
            jump: () => this.playTone(400, 0.1, 'square'),
            doubleJump: () => this.playArpeggio([500, 700], 0.05),
            eat: () => this.playTone(800, 0.15, 'sine'),
            hurt: () => this.playNoise(0.2),
            fall: () => this.playArpeggio([400, 300, 200, 100], 0.15),
            powerup: () => this.playArpeggio([400, 600, 800], 0.1),
            enemyDefeat: () => this.playTone(200, 0.2, 'sawtooth'),
            warning: () => this.playTone(300, 0.3, 'square'),
            gameOver: () => this.playArpeggio([400, 300, 200, 100], 0.3),
            levelComplete: () => this.playArpeggio([400, 500, 600, 800], 0.2),
            // Size change sounds
            grow: () => this.playArpeggio([400, 500, 600, 700], 0.15),
            shrink: () => this.playArpeggio([600, 500, 400, 300], 0.15),
            // Arctic theme sounds
            roar: () => this.playRoar(),
            charge: () => this.playCharge(),
            iceBreak: () => this.playIceBreak()
        };
    }

    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    playTone(frequency, duration, waveform = 'sine') {
        if (this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = waveform;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playNoise(duration) {
        if (this.isMuted) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        noise.buffer = buffer;
        noise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        noise.start(this.audioContext.currentTime);
        noise.stop(this.audioContext.currentTime + duration);
    }

    playArpeggio(frequencies, duration) {
        if (this.isMuted) return;
        
        const noteLength = duration / frequencies.length;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteLength, 'square');
            }, index * noteLength * 1000);
        });
    }

    playBackgroundMusic(theme, isGamePlay = false) {
        if (this.currentMusic) {
            this.stopBackgroundMusic();
        }
        
        this.isGameMusic = isGamePlay;
        
        if (this.isMuted) return;
        
        if (isGamePlay) {
            // More dynamic in-game music with bass and melody
            this.playGameMusic(theme);
        } else {
            // Simple menu music
            const musicPatterns = {
                beach: [329.63, 392.00, 440.00, 493.88],
                city: [261.63, 329.63, 392.00, 523.25],
                ocean: [196.00, 246.94, 293.66, 392.00],
                harbor: [220.00, 261.63, 329.63, 440.00]
            };
            
            const pattern = musicPatterns[theme] || musicPatterns.ocean;
            let noteIndex = 0;
            
            this.currentMusic = setInterval(() => {
                if (!this.isMuted) {
                    this.playTone(pattern[noteIndex], 0.1, 'triangle');
                    noteIndex = (noteIndex + 1) % pattern.length;
                }
            }, 200);
        }
    }
    
    playGameMusic(theme) {
        // More complex in-game music with bass line and melody
        const gameMusic = {
            beach: {
                bass: [164.81, 164.81, 196.00, 196.00],
                melody: [329.63, 392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00],
                tempo: 200
            },
            city: {
                bass: [130.81, 164.81, 196.00, 164.81],
                melody: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 329.63],
                tempo: 180
            },
            ocean: {
                bass: [98.00, 98.00, 123.47, 123.47],
                melody: [196.00, 246.94, 293.66, 392.00, 349.23, 293.66, 246.94, 196.00],
                tempo: 300
            },
            harbor: {
                bass: [110.00, 130.81, 164.81, 130.81],
                melody: [220.00, 261.63, 329.63, 440.00, 392.00, 329.63, 261.63, 220.00],
                tempo: 220
            }
        };
        
        const music = gameMusic[theme] || gameMusic.ocean;
        let bassIndex = 0;
        let melodyIndex = 0;
        let beatCount = 0;
        
        this.currentMusic = setInterval(() => {
            if (!this.isMuted) {
                // Play bass note every beat
                if (beatCount % 2 === 0) {
                    this.playTone(music.bass[bassIndex], 0.15, 'sawtooth');
                    bassIndex = (bassIndex + 1) % music.bass.length;
                }
                
                // Play melody note
                this.playTone(music.melody[melodyIndex], 0.1, 'square');
                melodyIndex = (melodyIndex + 1) % music.melody.length;
                
                beatCount++;
            }
        }, music.tempo);
    }

    stopBackgroundMusic() {
        if (this.currentMusic) {
            clearInterval(this.currentMusic);
            this.currentMusic = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            if (this.scene.currentTheme) {
                this.playBackgroundMusic(this.scene.currentTheme.name, this.isGameMusic);
            }
        }
        
        return this.isMuted;
    }

    // Arctic theme-specific sounds
    playRoar() {
        if (this.isMuted) return;
        
        // Deep "RAWR" roar - laptop speaker friendly (50-250Hz range)
        const duration = 0.6;
        
        // Main oscillator - deeper but laptop-friendly
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth'; // Sawtooth for richer harmonics
        oscillator.frequency.value = 100; // Start deeper
        
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 8;
        
        // "RAWR" pitch contour - quick rise then fall
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(120, this.audioContext.currentTime + 0.05); // Quick rise
        oscillator.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.25); // Fall
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + duration); // Deep end
        
        // Punchy attack with sustained middle
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.9, this.audioContext.currentTime + 0.015); // Very quick attack
        gainNode.gain.setValueAtTime(0.9, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        // Mid-range growl layer for texture
        const growl = this.audioContext.createOscillator();
        const growlGain = this.audioContext.createGain();
        const growlFilter = this.audioContext.createBiquadFilter();
        
        growl.connect(growlFilter);
        growlFilter.connect(growlGain);
        growlGain.connect(this.audioContext.destination);
        
        growl.type = 'square';
        growl.frequency.value = 150;
        
        growlFilter.type = 'bandpass';
        growlFilter.frequency.value = 200;
        growlFilter.Q.value = 2;
        
        // Growl follows similar pitch contour
        growl.frequency.setValueAtTime(160, this.audioContext.currentTime);
        growl.frequency.linearRampToValueAtTime(240, this.audioContext.currentTime + 0.05);
        growl.frequency.exponentialRampToValueAtTime(120, this.audioContext.currentTime + 0.25);
        growl.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
        
        growlGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        growlGain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.015);
        growlGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        // Noise layer for "R" texture
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        noise.buffer = noiseBuffer;
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 150;
        noiseFilter.Q.value = 1;
        
        // Noise burst at beginning for "R" sound
        noiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        // Start all sound sources
        oscillator.start(this.audioContext.currentTime);
        growl.start(this.audioContext.currentTime);
        noise.start(this.audioContext.currentTime);
        
        // Stop all sound sources
        oscillator.stop(this.audioContext.currentTime + duration);
        growl.stop(this.audioContext.currentTime + duration);
        noise.stop(this.audioContext.currentTime + 0.1);
    }
    
    playCharge() {
        if (this.isMuted) return;
        
        // Rising pitch effect
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playIceBreak() {
        if (this.isMuted) return;
        
        // Crackling sound using filtered noise
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Create crackling noise pattern
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.01);
        }
        
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noise.start(this.audioContext.currentTime);
        noise.stop(this.audioContext.currentTime + 0.3);
        
        // Add some tonal elements for ice shatter
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playTone(2000 + Math.random() * 1000, 0.05, 'sine');
            }, i * 50);
        }
    }

    destroy() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}