// music.js - Background Music System for Wizard Adventure Game
class MusicSystem {
    constructor() {
        this.currentTrack = null;
        this.volume = 0.4; // 40% total volume
        this.fadeTime = 2000; // 2 seconds fade
        this.isInitialized = false;
        this.queuedTrack = null; // Track to play once initialized
        
        // Music tracks for each scene
        this.tracks = {
            scene1: new Audio('/music/scene1.mp3'),
            scene2: new Audio('/music/scene2.mp3'),
            scene3: new Audio('/music/scene3.mp3')
        };
        
        // Configure all tracks
        Object.values(this.tracks).forEach(track => {
            track.loop = true;
            track.volume = 0;
            track.preload = 'auto';
        });
        
        this.setupEventListeners();
        this.initializeAudio();
        
        // Queue scene1 to start immediately
        this.queueTrack('scene1');
    }
    
    initializeAudio() {
        // Initialize on first user interaction to comply with browser autoplay policies
        const initOnInteraction = () => {
            if (!this.isInitialized) {
                this.isInitialized = true;
                console.log('🎵 Music system initialized');
                
                // Start queued track immediately when initialized
                if (this.queuedTrack) {
                    this.playTrack(this.queuedTrack);
                    this.queuedTrack = null;
                }
                
                document.removeEventListener('click', initOnInteraction);
                document.removeEventListener('keydown', initOnInteraction);
            }
        };
        
        document.addEventListener('click', initOnInteraction);
        document.addEventListener('keydown', initOnInteraction);
    }
    
    queueTrack(trackName) {
        if (this.isInitialized) {
            this.playTrack(trackName);
        } else {
            this.queuedTrack = trackName;
            console.log(`🎵 Queued track: ${trackName} (waiting for user interaction)`);
        }
    }
    
    setupEventListeners() {
        // Listen for scene changes through game phase transitions
        window.addEventListener('sceneChange', (event) => {
            this.handleSceneChange(event.detail.scene);
        });
        
        // Monitor game instance for phase changes
        this.monitorGamePhases();
    }
    
    monitorGamePhases() {
        let lastPhase = null;
        
        const checkPhase = () => {
            if (window.gameInstance && window.gameInstance.phase !== lastPhase) {
                const currentPhase = window.gameInstance.phase;
                
                // Map phases to scenes for music
                switch(currentPhase) {
                    case 'exploration':
                    case 'unlockingCage':
                        this.playTrack('scene1');
                        break;
                    case 'training':
                        this.playTrack('scene2');
                        break;
                    case 'battle':
                        this.playTrack('scene3');
                        break;
                }
                
                lastPhase = currentPhase;
            }
            
            requestAnimationFrame(checkPhase);
        };
        
        checkPhase();
    }
    
    handleSceneChange(sceneNumber) {
        const trackName = `scene${sceneNumber}`;
        this.playTrack(trackName);
    }
    
    playTrack(trackName) {
        if (!this.isInitialized || !this.tracks[trackName]) {
            console.warn(`🎵 Cannot play track: ${trackName}`);
            return;
        }
        
        const newTrack = this.tracks[trackName];
        
        // Don't restart the same track
        if (this.currentTrack === newTrack && !newTrack.paused) {
            return;
        }
        
        console.log(`🎵 Playing music: ${trackName}`);
        
        // Fade out current track if playing
        if (this.currentTrack && !this.currentTrack.paused) {
            this.fadeOut(this.currentTrack);
        }
        
        // Fade in new track
        this.currentTrack = newTrack;
        this.fadeIn(newTrack);
    }
    
    fadeIn(track) {
        track.currentTime = 0;
        track.volume = 0;
        
        const playPromise = track.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.createFade(track, 0, this.volume, this.fadeTime);
            }).catch(error => {
                console.warn('🎵 Audio play failed:', error);
            });
        }
    }
    
    fadeOut(track) {
        this.createFade(track, track.volume, 0, this.fadeTime, () => {
            track.pause();
        });
    }
    
    createFade(track, startVolume, endVolume, duration, onComplete = null) {
        const startTime = Date.now();
        const volumeDiff = endVolume - startVolume;
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            track.volume = startVolume + (volumeDiff * progress);
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        fade();
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentTrack) {
            this.currentTrack.volume = this.volume;
        }
    }
    
    mute() {
        Object.values(this.tracks).forEach(track => {
            track.volume = 0;
        });
    }
    
    unmute() {
        if (this.currentTrack) {
            this.currentTrack.volume = this.volume;
        }
    }
    
    stop() {
        if (this.currentTrack) {
            this.fadeOut(this.currentTrack);
            this.currentTrack = null;
        }
    }
}

// Initialize music system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.musicSystem = new MusicSystem();
    console.log('🎵 Music system loaded - Scene 1 music queued to start on first interaction');
});

// Export for potential use in other scripts
window.MusicSystem = MusicSystem;