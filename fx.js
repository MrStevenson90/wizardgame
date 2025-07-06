// fx.js - Sound Effects System for Wizard Adventure Game
class FXSystem {
    constructor() {
        this.volume = 0.24; // 30% of previous volume (0.8 * 0.3 = 0.24)
        this.isInitialized = false;
        
        // Sound effect files
        this.sounds = {
            cage: new Audio('/fx/cage.mp3'),
            popup: new Audio('/fx/popup.mp3'),
            s: new Audio('/fx/s.mp3'),
            sleep: new Audio('/fx/sleep.mp3'),
            spell: new Audio('/fx/spell.mp3'),
            success: new Audio('/fx/success.mp3')
        };
        
        // Configure all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
            sound.preload = 'auto';
        });
        
        // Track game state for triggers
        this.hasPlayedCageSound = false;
        this.lastDrawTime = 0;
        this.lastPopupTime = 0;
        
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    initializeAudio() {
        // Initialize on first user interaction
        const initOnInteraction = () => {
            if (!this.isInitialized) {
                this.isInitialized = true;
                console.log('🔊 FX system initialized');
                document.removeEventListener('click', initOnInteraction);
                document.removeEventListener('keydown', initOnInteraction);
            }
        };
        
        document.addEventListener('click', initOnInteraction);
        document.addEventListener('keydown', initOnInteraction);
    }
    
    setupEventListeners() {
        // Listen for spell casting events (S drawing)
        window.addEventListener('spellCast', (event) => {
            this.handleSpellCast(event.detail);
        });
        
        window.addEventListener('cageSpellAttempt', (event) => {
            this.handleCageSpellAttempt(event.detail);
        });
        
        // Listen for snake events
        window.addEventListener('snakeDefeated', (event) => {
            this.playSound('sleep');
        });
        
        // Listen for battle events
        window.addEventListener('battleComplete', (event) => {
            if (event.detail.success) {
                this.playSound('success');
            }
        });
        
        // Listen for game over events
        window.addEventListener('gameOver', (event) => {
            if (event.detail.won) {
                this.playSound('success');
            }
        });
        
        // Monitor for cage encounters and popup appearances
        this.monitorGameState();
        this.monitorPopups();
    }
    
    monitorGameState() {
        let lastPhase = null;
        
        const checkGameState = () => {
            if (window.gameInstance) {
                const currentPhase = window.gameInstance.phase;
                
                // Check for cage encounter
                if (currentPhase === 'unlockingCage' && !this.hasPlayedCageSound) {
                    this.playSound('cage');
                    this.hasPlayedCageSound = true;
                }
                
                // Reset cage sound flag when leaving exploration
                if (currentPhase !== 'exploration' && currentPhase !== 'unlockingCage') {
                    this.hasPlayedCageSound = false;
                }
                
                // Check for scene completions (success sounds)
                if (lastPhase !== currentPhase) {
                    switch(currentPhase) {
                        case 'training':
                            // Completed cage unlock
                            if (lastPhase === 'unlockingCage') {
                                this.playSound('success');
                            }
                            break;
                        case 'battle':
                            // Completed training
                            if (lastPhase === 'training') {
                                this.playSound('success');
                            }
                            break;
                    }
                    lastPhase = currentPhase;
                }
            }
            
            requestAnimationFrame(checkGameState);
        };
        
        checkGameState();
    }
    
    monitorPopups() {
        // Monitor for popup appearances by checking DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('popup') && !target.classList.contains('hidden')) {
                        // Popup became visible
                        const now = Date.now();
                        if (now - this.lastPopupTime > 500) { // Debounce rapid popups
                            this.playSound('popup');
                            this.lastPopupTime = now;
                        }
                    }
                }
            });
        });
        
        // Observe popup containers
        const popupsContainer = document.getElementById('popups');
        if (popupsContainer) {
            observer.observe(popupsContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
        // Also monitor speech bubbles and notifications
        const body = document.body;
        const speechObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && (
                                node.classList.contains('speech-bubble') ||
                                node.classList.contains('notification') ||
                                node.id === 'speechBubble'
                            )) {
                                const now = Date.now();
                                if (now - this.lastPopupTime > 300) {
                                    this.playSound('popup');
                                    this.lastPopupTime = now;
                                }
                            }
                        }
                    });
                }
            });
        });
        
        speechObserver.observe(body, { childList: true, subtree: true });
    }
    
    handleSpellCast(spellData) {
        const now = Date.now();
        
        // Play S drawing sound (with debouncing to avoid spam)
        if (now - this.lastDrawTime > 200) {
            this.playSound('s');
            this.lastDrawTime = now;
        }
        
        // Check if spell was successful
        const accuracy = spellData.accuracy || 0;
        const currentPhase = window.gameInstance?.phase;
        
        let successThreshold = 0.40; // Default threshold
        if (currentPhase === 'unlockingCage') {
            successThreshold = 0.50; // Cage unlock requires higher accuracy
        }
        
        if (accuracy >= successThreshold) {
            // Delay spell success sound slightly to follow S sound
            setTimeout(() => {
                this.playSound('spell');
            }, 150);
        }
    }
    
    handleCageSpellAttempt(spellData) {
        const now = Date.now();
        
        // Play S drawing sound
        if (now - this.lastDrawTime > 200) {
            this.playSound('s');
            this.lastDrawTime = now;
        }
        
        // Check success
        if (spellData.accuracy >= 0.50) {
            setTimeout(() => {
                this.playSound('spell');
            }, 150);
        }
    }
    
    playSound(soundName) {
        if (!this.isInitialized || !this.sounds[soundName]) {
            console.warn(`🔊 Cannot play sound: ${soundName}`);
            return;
        }
        
        const sound = this.sounds[soundName];
        
        // Reset and play
        sound.currentTime = 0;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`🔊 Playing FX: ${soundName}`);
            }).catch(error => {
                console.warn(`🔊 FX play failed for ${soundName}:`, error);
            });
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
    
    mute() {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0;
        });
    }
    
    unmute() {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
    
    preloadAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }
}

// Initialize FX system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.fxSystem = new FXSystem();
    console.log('🔊 FX system loaded');
});

// Export for potential use in other scripts
window.FXSystem = FXSystem;