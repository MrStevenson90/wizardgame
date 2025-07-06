// dialogue.js - Dialogue Audio System for Wizard Adventure Game
class DialogueAudioSystem {
    constructor() {
        this.volume = 0.9;
        this.isInitialized = false;
        this.currentDialogue = null;
        
        // Dialogue audio files
        this.dialogues = {
            hello: new Audio('/dialogue/1_hello.mp3'),
            howto: new Audio('/dialogue/2_howto.mp3'),
            tryagain: new Audio('/dialogue/3_tryagain.mp3'),
            complete: new Audio('/dialogue/4_complete.mp3'),
            scene2: new Audio('/dialogue/5_scene2.mp3'),
            scene3: new Audio('/dialogue/6_scene3.mp3'),
            scene3bad: new Audio('/dialogue/7_scene3bad.mp3'),
            scene3good: new Audio('/dialogue/8_scene3good.mp3'),
            victory: new Audio('/dialogue/9_victory.mp3')
        };
        
        // Configure all dialogues
        Object.values(this.dialogues).forEach(dialogue => {
            dialogue.volume = this.volume;
            dialogue.preload = 'auto';
        });
        
        // Track game state for dialogue triggers
        this.playedDialogues = new Set();
        this.lastPhase = null;
        this.cageUnlockAttempts = 0;
        this.battleSpellCount = 0;
        
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    initializeAudio() {
        // Initialize on first user interaction
        const initOnInteraction = () => {
            if (!this.isInitialized) {
                this.isInitialized = true;
                console.log('🎭 Dialogue system initialized');
                document.removeEventListener('click', initOnInteraction);
                document.removeEventListener('keydown', initOnInteraction);
            }
        };
        
        document.addEventListener('click', initOnInteraction);
        document.addEventListener('keydown', initOnInteraction);
    }
    
    setupEventListeners() {
        // Listen for cage spell attempts
        window.addEventListener('cageSpellAttempt', (event) => {
            this.handleCageSpellAttempt(event.detail);
        });
        
        // Listen for spell casting in battle
        window.addEventListener('spellCast', (event) => {
            this.handleBattleSpellCast(event.detail);
        });
        
        // Listen for game over/victory
        window.addEventListener('gameOver', (event) => {
            if (event.detail.won) {
                this.playDialogue('victory');
            }
        });
        
        window.addEventListener('battleComplete', (event) => {
            if (event.detail.success) {
                this.playDialogue('victory');
            }
        });
        
        // Monitor for phase changes and specific game states
        this.monitorGameState();
        this.monitorPopups();
    }
    
    monitorGameState() {
        const checkGameState = () => {
            if (window.gameInstance) {
                const currentPhase = window.gameInstance.phase;
                
                // Scene 1 start - hello dialogue
                if (currentPhase === 'exploration' && !this.playedDialogues.has('hello')) {
                    this.playDialogue('hello');
                    this.playedDialogues.add('hello');
                }
                
                // Scene 2 start - scene2 dialogue
                if (currentPhase === 'training' && this.lastPhase !== 'training' && !this.playedDialogues.has('scene2')) {
                    this.playDialogue('scene2');
                    this.playedDialogues.add('scene2');
                }
                
                // Check for training completion (5 perfect spells)
                if (currentPhase === 'training' && window.gameInstance.trainingProgress >= window.gameInstance.requiredPerfectSpells) {
                    if (!this.playedDialogues.has('scene3')) {
                        this.playDialogue('scene3');
                        this.playedDialogues.add('scene3');
                    }
                }
                
                // Reset battle spell count when entering battle
                if (currentPhase === 'battle' && this.lastPhase !== 'battle') {
                    this.battleSpellCount = 0;
                }
                
                this.lastPhase = currentPhase;
            }
            
            requestAnimationFrame(checkGameState);
        };
        
        checkGameState();
    }
    
    monitorPopups() {
        // Monitor for cage unlock popup appearing
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    
                    // Cage unlock popup appeared
                    if (target.id === 'cageUnlockPopup' && !target.classList.contains('hidden')) {
                        if (!this.playedDialogues.has('howto')) {
                            // Small delay to let popup fully appear
                            setTimeout(() => {
                                this.playDialogue('howto');
                                this.playedDialogues.add('howto');
                            }, 500);
                        }
                    }
                    
                    // Victory popup appeared
                    if (target.id === 'gameOverPopup' && !target.classList.contains('hidden')) {
                        // Check if it's a victory (not a game over)
                        const gameOverTitle = document.getElementById('gameOverTitle');
                        if (gameOverTitle && (
                            gameOverTitle.textContent.includes('VICTORY') ||
                            gameOverTitle.textContent.includes('Complete')
                        )) {
                            if (!this.playedDialogues.has('victory')) {
                                setTimeout(() => {
                                    this.playDialogue('victory');
                                    this.playedDialogues.add('victory');
                                }, 800);
                            }
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
    }
    
    handleCageSpellAttempt(spellData) {
        this.cageUnlockAttempts++;
        
        if (spellData.accuracy >= 0.50) {
            // Success - play complete dialogue
            this.playDialogue('complete');
        } else {
            // Failure - play try again dialogue (but not on first attempt)
            if (this.cageUnlockAttempts > 1) {
                this.playDialogue('tryagain');
            }
        }
    }
    
    handleBattleSpellCast(spellData) {
        // Only handle battle phase spells
        if (window.gameInstance?.phase !== 'battle') {
            return;
        }
        
        this.battleSpellCount++;
        const accuracy = spellData.accuracy || 0;
        
        if (accuracy >= 0.40) {
            // Good spell - occasionally play scene3good
            if (this.battleSpellCount % 2 === 1) { // Play on odd attempts for variety
                this.playDialogue('scene3good');
            }
        } else {
            // Bad spell - occasionally play scene3bad
            if (this.battleSpellCount % 3 === 1) { // Play less frequently to avoid spam
                this.playDialogue('scene3bad');
            }
        }
    }
    
    playDialogue(dialogueName) {
        if (!this.isInitialized || !this.dialogues[dialogueName]) {
            console.warn(`🎭 Cannot play dialogue: ${dialogueName}`);
            return;
        }
        
        // Stop current dialogue if playing
        if (this.currentDialogue && !this.currentDialogue.paused) {
            this.currentDialogue.pause();
            this.currentDialogue.currentTime = 0;
        }
        
        const dialogue = this.dialogues[dialogueName];
        this.currentDialogue = dialogue;
        
        // Reset and play
        dialogue.currentTime = 0;
        
        const playPromise = dialogue.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`🎭 Playing dialogue: ${dialogueName}`);
            }).catch(error => {
                console.warn(`🎭 Dialogue play failed for ${dialogueName}:`, error);
            });
        }
    }
    
    stopCurrentDialogue() {
        if (this.currentDialogue && !this.currentDialogue.paused) {
            this.currentDialogue.pause();
            this.currentDialogue.currentTime = 0;
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.dialogues).forEach(dialogue => {
            dialogue.volume = this.volume;
        });
    }
    
    mute() {
        Object.values(this.dialogues).forEach(dialogue => {
            dialogue.volume = 0;
        });
    }
    
    unmute() {
        Object.values(this.dialogues).forEach(dialogue => {
            dialogue.volume = this.volume;
        });
    }
    
    reset() {
        // Reset all tracking for new game
        this.playedDialogues.clear();
        this.lastPhase = null;
        this.cageUnlockAttempts = 0;
        this.battleSpellCount = 0;
        this.stopCurrentDialogue();
    }
    
    preloadAll() {
        Object.values(this.dialogues).forEach(dialogue => {
            dialogue.load();
        });
    }
}

// Initialize dialogue system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dialogueAudioSystem = new DialogueAudioSystem();
    console.log('🎭 Dialogue audio system loaded');
});

// Export for potential use in other scripts
window.DialogueAudioSystem = DialogueAudioSystem;