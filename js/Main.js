// js/main.js - Enhanced with Mobile Support
import { Player } from './Character.js';
import { Scenes } from './Scenes.js';
import { DrawingSystem } from './draw.js';
import { DialogueSystem } from './dialogueSystem.js';
import { SnakeManager } from './Snakes.js';
import { CameraSystem } from './cameraSystem.js';
import { GameManager } from './GameManager.js';
import { Text } from './text.js';
import { Magic } from './magic.js';
import { MobileControls } from './MobileControls.js'; // NEW: Import mobile controls

class Game {
    constructor() {
        // Make game instance globally accessible for drawing system
        window.gameInstance = this;
        
        // --- Core Systems Initialization ---
        this.gameManager = new GameManager();
        this.scenes = new Scenes(this.gameManager);
        this.dialogueSystem = new DialogueSystem();
        this.text = new Text();
        
        // --- Game State Tracking ---
        this.phase = 'loading';
        this.trainingProgress = 0;
        this.requiredPerfectSpells = 5;
        this.hasMetWizard = false;
        
        // ENHANCED: Battle system tracking
        this.battleStats = {
            snakesDefeated: 0,
            totalSnakes: 5,
            battleActive: false,
            finalScore: 0
        };

        // --- Player and Controls ---
        this.player = new Player(this.gameManager.scene);
        this.inputState = { forward: false, backward: false, left: false, right: false };
        
        // --- Gameplay Systems ---
        this.cameraSystem = new CameraSystem(this.gameManager.camera, this.player.mesh);
        this.cameraSystem.setGameWorld(this.scenes.world);
        this.mainDrawingSystem = new DrawingSystem(this.gameManager); 
        this.cageDrawingSystem = null; 
        this.snakeManager = new SnakeManager(this.gameManager.scene);
        this.magicSystem = new Magic(this.gameManager.scene);
        
        // NEW: Mobile Controls System
        this.mobileControls = new MobileControls(this.player.controller);
        
        // --- Setup and Start ---
        this.setupEventListeners();
        this.setupDrawingCanvas();
        this.scenes.loadScene(1);
        this.enterExplorationPhase();
        this.animate();
    }

    // Setup drawing canvas management for all scenes
    setupDrawingCanvas() {
        // Ensure the main drawing system is properly initialized
        this.mainDrawingSystem.setActive(false); // Start inactive
        
        // Add styles for drawing feedback
        this.addDrawingStyles();
    }
    
    // ENHANCED: Add CSS styles for drawing feedback including mobile enhancements
    addDrawingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #drawingTrail {
                pointer-events: none !important;
                z-index: 10 !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: transparent !important;
            }
            
            #realTimeAccuracy {
                transition: all 0.3s ease;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            }
            
            .accuracy-feedback {
                position: fixed;
                top: 15%;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                font-size: 16px;
                z-index: 200;
                border-left: 4px solid #00ffff;
            }
            
            .proximity-warning {
                animation: shake 0.5s ease-in-out;
            }
            
            /* ENHANCED: Mobile-responsive battle UI styles */
            .battle-counter {
                position: fixed;
                top: 200px;
                left: 20px;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 0, 0, 0.9));
                color: #fff;
                padding: 20px 25px;
                border-radius: 15px;
                border: 3px solid #ff4444;
                box-shadow: 0 0 25px rgba(255, 68, 68, 0.6);
                font-size: 18px;
                font-weight: bold;
                z-index: 150;
                backdrop-filter: blur(10px);
                min-width: 280px;
                transition: all 0.3s ease;
            }
            
            .battle-counter:hover {
                transform: scale(1.02);
                box-shadow: 0 0 35px rgba(255, 68, 68, 0.8);
            }
            
            .snake-progress {
                margin-top: 8px;
                font-size: 14px;
                color: #ffaaaa;
            }
            
            /* NEW: Mobile-specific battle counter positioning */
            @media (max-width: 768px) {
                .battle-counter {
                    top: 80px;
                    left: 10px;
                    right: 10px;
                    font-size: 16px;
                    padding: 15px 20px;
                    min-width: auto;
                    max-width: calc(100vw - 20px);
                }
                
                #battleAccuracyIndicator {
                    bottom: 200px; /* Above joystick area */
                    font-size: 18px;
                    padding: 12px 20px;
                    min-width: 200px;
                }
                
                #snakeTargetingIndicator {
                    width: 50px;
                    height: 50px;
                    border-width: 3px;
                }
            }
            
            @media (max-width: 480px) {
                .battle-counter {
                    top: 60px;
                    font-size: 14px;
                    padding: 12px 15px;
                }
                
                #battleAccuracyIndicator {
                    bottom: 180px;
                    font-size: 16px;
                    padding: 10px 15px;
                    min-width: 180px;
                }
            }
            
            /* Touch-friendly drawing trail */
            @media (pointer: coarse) {
                #drawingTrail {
                    touch-action: none;
                }
            }
            
            /* Landscape mobile adjustments */
            @media (max-width: 768px) and (orientation: landscape) {
                .battle-counter {
                    top: 15px;
                    left: 200px; /* Clear joystick area */
                    font-size: 14px;
                    padding: 10px 15px;
                }
                
                #ui {
                    top: 15px;
                    left: 200px; /* Clear joystick area */
                    font-size: 12px;
                }
                
                #ui div {
                    padding: 6px 10px;
                    margin-bottom: 6px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // MODIFIED: Only setup keyboard events for non-touch devices
        if (!this.mobileControls.shouldUseTouchControls()) {
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        }
        
        window.addEventListener('spellCast', (e) => this.handleSpellCast(e));
        window.addEventListener('cageSpellAttempt', (e) => this.onCageSpellAttempt(e));
        
        // Battle event listeners
        window.addEventListener('battleStart', (e) => this.onBattleStart(e));
        window.addEventListener('snakeSpawned', (e) => this.onSnakeSpawned(e));
        window.addEventListener('snakeDefeated', (e) => this.onSnakeDefeated(e));
        window.addEventListener('battleComplete', (e) => this.onBattleComplete(e));
        window.addEventListener('gameOver', (e) => this.onGameOver(e));
        
        // Add cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    // --- Phase Management ---

    enterExplorationPhase() {
        this.phase = 'exploration';
        this.player.setPhase('chamber');
        this.cameraSystem.setPhase('chamber');
        
        // Ensure drawing system is inactive during exploration
        this.mainDrawingSystem.setActive(false);
        
        // ADDED: Show character in third-person mode
        this.player.mesh.visible = true;
        
        this.updateUI();
    }

    enterCageUnlockPhase() {
        this.phase = 'unlockingCage';
        this.player.controller.stop();
        this.dialogueSystem.hide();

        // Deactivate main drawing system during cage unlock
        this.mainDrawingSystem.setActive(false);

        // ADDED: Show character in third-person mode
        this.player.mesh.visible = true;

        const canvas = document.getElementById('cageUnlockCanvas');
        this.cageDrawingSystem = new DrawingSystem(this.gameManager, canvas);

        // Create template path for the S-shape
        const templatePath = [];
        const svgPath = document.querySelector("#s-path-template path");
        const totalLength = svgPath.getTotalLength();
        
        for(let i = 0; i < 1; i += 0.01) {
            const p = svgPath.getPointAtLength(i * totalLength);
            templatePath.push({x: p.x, y: p.y});
        }
        this.cageDrawingSystem.setTemplatePath(templatePath);

        this.dialogueSystem.showPopup('cageUnlockPopup');
        
        // Add instruction overlay for cage unlock
        this.showDrawingInstructions("Trace the golden 'S' shape from START to END to break the seal!");
    }

    enterTrainingPhase() {
        this.phase = 'training';
        this.player.setPhase('practice');
        this.cameraSystem.setPhase('practice');
        
        // ADDED: Hide character in first-person mode
        this.player.mesh.visible = false;
        
        // Activate main drawing system for training
        this.mainDrawingSystem.setActive(true);
        
        this.dialogueSystem.hidePopup('cageUnlockPopup');
        if(this.cageDrawingSystem) {
            this.cageDrawingSystem.destroy();
            this.cageDrawingSystem = null;
        }

        const cage = this.scenes.world.cage.mesh;
        new TWEEN.Tween(cage.scale)
            .to({ x: 0.01, y: 0.01, z: 0.01 }, 1500)
            .easing(TWEEN.Easing.Bounce.Out)
            .onComplete(() => cage.visible = false)
            .start();
        
        this.scenes.world.wizard.mesh.visible = true;
        this.scenes.world.rock.group.visible = true; 
        
        this.updateUI();
    }
    
    enterBattlePhase() {
        console.log("🏹 Entering battle phase...");
        this.phase = 'battle';
        this.player.setPhase('battle');
        this.cameraSystem.setPhase('battle');
        
        // ADDED: Hide character in first-person mode
        this.player.mesh.visible = false;
        
        // CRITICAL: Activate drawing system for battle
        this.mainDrawingSystem.setActive(true);
        console.log("✅ Drawing system activated for battle");
        
        // Reset battle stats
        this.battleStats = {
            snakesDefeated: 0,
            totalSnakes: 5,
            battleActive: true,
            finalScore: 0
        };
        
        this.dialogueSystem.hide();
        this.hideDrawingInstructions();
        
        const existingPopups = document.querySelectorAll('.popup');
        existingPopups.forEach(popup => {
            popup.classList.add('hidden');
        });
        
        this.scenes.world.rock.group.visible = false;
        this.scenes.loadScene(3);
        
        setTimeout(() => {
            console.log("🐍 Starting serpent spawning...");
            this.snakeManager.startSpawning();
            this.showBattleUI();
            console.log("🐍 Battle started with clean UI");
        }, 500);
        
        this.updateUI();
    }

    // Show drawing instructions
    showDrawingInstructions(message) {
        let instructions = document.getElementById('drawingInstructions');
        if (!instructions) {
            instructions = document.createElement('div');
            instructions.id = 'drawingInstructions';
            instructions.className = 'accuracy-feedback';
            document.body.appendChild(instructions);
        }
        instructions.textContent = message;
        instructions.style.display = 'block';
    }
    
    hideDrawingInstructions() {
        const instructions = document.getElementById('drawingInstructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    showBattleUI() {
        let battleCounter = document.getElementById('battleCounter');
        if (!battleCounter) {
            battleCounter = document.createElement('div');
            battleCounter.id = 'battleCounter';
            battleCounter.className = 'battle-counter';
            document.body.appendChild(battleCounter);
        }
        
        this.updateBattleUI();
        battleCounter.style.display = 'block';
    }
    
    updateBattleUI() {
        const battleCounter = document.getElementById('battleCounter');
        if (battleCounter && this.battleStats.battleActive) {
            const stats = this.snakeManager.getBattleStats();
            const progressPercent = Math.round((stats.defeatedCount / stats.maxSnakes) * 100);
            
            battleCounter.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 10px;">⚔️</span>
                    <span style="color: #ff8888;">Serpent Battle</span>
                </div>
                <div style="margin-bottom: 8px;">
                    🐍 Defeated: <span style="color: #00ff00;">${stats.defeatedCount}</span>/<span style="color: #ffaa00;">${stats.maxSnakes}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    👁️ Alive: <span style="color: ${stats.aliveCount > 0 ? '#ff4444' : '#888888'};">${stats.aliveCount}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    🎯 Progress: <span style="color: #00ffff;">${progressPercent}%</span>
                </div>
                <div style="font-size: 14px; color: #cccccc; margin-top: 10px;">
                    ${stats.aliveCount > 0 ? '🎯 Look for red S-runes!' : '🏆 Battle Complete!'}
                </div>
            `;
            
            if (stats.aliveCount > 0) {
                battleCounter.style.animation = 'battlePulse 2s infinite';
            } else {
                battleCounter.style.animation = 'none';
            }
        }
    }
    
    hideBattleUI() {
        const battleCounter = document.getElementById('battleCounter');
        if (battleCounter) {
            battleCounter.style.display = 'none';
        }
    }

    // --- Event Handlers ---

    onCageSpellAttempt(event) {
        const accuracy = event.detail.accuracy;
        const accuracyDisplay = document.getElementById('accuracy-display');
        accuracyDisplay.textContent = `Accuracy: ${Math.round(accuracy * 100)}%`;

        if (accuracy >= 0.50) {
            accuracyDisplay.style.color = '#7CFC00';
            this.dialogueSystem.showNotification("Perfect! The seal is breaking!", 2000, 'center');
            setTimeout(() => this.enterTrainingPhase(), 500);
        } else {
            accuracyDisplay.style.color = '#FF4500';
            const percentage = Math.round(accuracy * 100);
            this.dialogueSystem.showNotification(`${percentage}% accuracy. You need 50% or better. Trace the complete 'S' from START to END!`, 4000, 'top-right');
            setTimeout(() => this.cageDrawingSystem.clear(), 500);
        }
    }

    // UPDATED: Touch-friendly key handling
    handleKeyDown(event) {
        if (this.phase === 'unlockingCage') return;
        switch (event.key.toLowerCase()) {
            case 'w': case 'arrowup': this.inputState.forward = true; break;
            case 's': case 'arrowdown': this.inputState.backward = true; break;
            case 'a': case 'arrowleft': this.inputState.left = true; break;
            case 'd': case 'arrowright': this.inputState.right = true; break;
        }
        this.player.setInputState(this.inputState);
    }

    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w': case 'arrowup': this.inputState.forward = false; break;
            case 's': case 'arrowdown': this.inputState.backward = false; break;
            case 'a': case 'arrowleft': this.inputState.left = false; break;
            case 'd': case 'arrowright': this.inputState.right = false; break;
        }
        this.player.setInputState(this.inputState);
    }
    
    handleSpellCast(event) {
        const accuracy = event.detail.accuracy;
        const percentage = Math.round(accuracy * 100);

        if (this.phase === 'training') {
            const isNearRock = this.player.mesh.position.distanceTo(this.scenes.world.rock.group.position) < 60;
            
            if (accuracy >= 0.40) {
                this.trainingProgress++;
                const spellPosition = this.player.mesh.position.clone().add(this.player.mesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(5));
                this.magicSystem.createSpellEffect(spellPosition);
                
                if (isNearRock) {
                    this.scenes.world.rock.addSpellEffect();
                    this.showAccuracyFeedback(accuracy, true);
                }

                this.updateUI();
                    
                if (this.trainingProgress >= this.requiredPerfectSpells) {
                    this.hideDrawingInstructions();
                    
                    setTimeout(() => {
                        this.enterBattlePhase();
                    }, 1000);
                }
            } else {
                this.showAccuracyFeedback(accuracy, false);
                if (isNearRock) {
                    this.dialogueSystem.showNotification(`${percentage}% accuracy on the rock. You need 40% or better. Trace the full 'S' shape from top to bottom like in the popup!`, 4000, 'top-right');
                } else {
                    this.dialogueSystem.showNotification(`Get closer to the rock and trace the white 'S' rune from top to bottom!`, 3000, 'top-right');
                }
            }
        } else if (this.phase === 'battle') {
            console.log(`⚡ Battle spell cast with ${percentage}% accuracy`);
            
            const spellPosition = this.player.mesh.position.clone().add(
                this.player.mesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(10)
            );
            this.magicSystem.createSpellEffect(spellPosition);
            
            if (accuracy >= 0.40) {
                let targetHit = false;
                const aliveSnakes = this.snakeManager.getAliveSnakes();
                console.log(`🎯 ${aliveSnakes.length} snakes available for targeting`);
                
                if (aliveSnakes.length > 0) {
                    let targetSnake = null;
                    
                    if (event.detail.targetedSnake && event.detail.targetedSnake.userData.alive) {
                        targetSnake = event.detail.targetedSnake;
                        console.log(`🎯 Using targeted snake ${targetSnake.userData.spawnOrder}`);
                    } else {
                        targetSnake = this.snakeManager.getSnakeInView(this.gameManager.camera);
                        if (!targetSnake) {
                            targetSnake = aliveSnakes[0];
                        }
                        console.log(`🎯 Using fallback snake ${targetSnake ? targetSnake.userData.spawnOrder : 'none'}`);
                    }
                    
                    if (targetSnake && targetSnake.userData.alive) {
                        console.log(`🎯 Hitting snake ${targetSnake.userData.spawnOrder}`);
                        targetSnake.userData.hit();
                        targetHit = true;
                        this.showAccuracyFeedback(accuracy, true);
                    }
                }
                
                if (!targetHit) {
                    this.showAccuracyFeedback(accuracy, false);
                }
            } else {
                this.showAccuracyFeedback(accuracy, false);
                const aliveCount = this.snakeManager.getAliveSnakes().length;
                if (aliveCount > 0) {
                    this.dialogueSystem.showNotification(`${percentage}% accuracy. You need 40% or better. Trace a complete 'S' shape!`, 4000, 'top-right');
                } else {
                    this.dialogueSystem.showNotification(`Practice your 'S' tracing for future battles!`, 2000, 'top-right');
                }
            }
            
            this.updateBattleUI();
        }
    }
    
    // Battle event handlers
    onBattleStart(event) {
        const totalSnakes = event.detail.totalSnakes;
        this.battleStats.totalSnakes = totalSnakes;
        this.battleStats.battleActive = true;
        console.log(`🐍 Battle started silently with ${totalSnakes} serpents`);
    }
    
    onSnakeSpawned(event) {
        const { snakeNumber, totalSnakes } = event.detail;
        this.updateBattleUI();
        console.log(`🐍 Snake ${snakeNumber}/${totalSnakes} spawned silently`);
    }
    
    onSnakeDefeated(event) {
        const { spawnOrder, currentScore, totalSnakes } = event.detail;
        this.battleStats.snakesDefeated = currentScore;
        this.updateBattleUI();
        
        if (currentScore % 2 === 0 || currentScore === totalSnakes) {
            this.dialogueSystem.showNotification(`${currentScore}/${totalSnakes} serpents defeated`, 1500, 'top-right');
        }
    }
    
    onBattleComplete(event) {
        const { score, maxScore, success } = event.detail;
        this.battleStats.finalScore = score;
        this.battleStats.battleActive = false;
        
        this.hideBattleUI();
        this.hideDrawingInstructions();
        this.mainDrawingSystem.setActive(false);
        
        if (success && score === maxScore) {
            this.showVictoryScreen(score, maxScore);
        } else {
            this.showGameOverScreen(false, score, maxScore);
        }
    }
    
    onGameOver(event) {
        const { won, score, reason } = event.detail;
        this.battleStats.battleActive = false;
        
        this.hideBattleUI();
        this.hideDrawingInstructions();
        this.mainDrawingSystem.setActive(false);
        
        this.showGameOverScreen(won, score || 0, this.battleStats.totalSnakes, reason);
    }
    
    showVictoryScreen(score, maxScore) {
        const gameOverPopup = document.getElementById('gameOverPopup');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverText = document.getElementById('gameOverText');
        const finalStats = document.getElementById('finalStats');
        
        gameOverTitle.textContent = "🏆 VICTORY! 🏆";
        gameOverTitle.style.color = '#00FF00';
        
        finalStats.innerHTML = `
            <div>🐍 Serpents Defeated: <span>${score}/${maxScore}</span></div>
            <div>⭐ Magic Mastery: <span>Perfect!</span></div>
            <div>🎯 Final Grade: <span>Master Wizard</span></div>
            <div>✨ 'S' Shape Mastery: <span>Achieved!</span></div>
        `;
        
        this.dialogueSystem.showPopup('gameOverPopup');
        
        setTimeout(() => {
            this.createVictoryCelebration();
        }, 500);
    }
    
    showGameOverScreen(won, score, maxScore, reason = null) {
        const gameOverPopup = document.getElementById('gameOverPopup');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverText = document.getElementById('gameOverText');
        const finalStats = document.getElementById('finalStats');
        
        if (won) {
            gameOverTitle.textContent = "Mission Complete!";
            gameOverTitle.style.color = '#FFD700';
            gameOverText.textContent = "Well done! You have completed your wizard training.";
        } else {
            gameOverTitle.textContent = "Training Incomplete";
            gameOverTitle.style.color = '#FF6B6B';
            gameOverText.textContent = reason || "Your mentor needs more protection. Practice your 'S' spell and try again!";
        }
        
        finalStats.innerHTML = `
            <div>🐍 Serpents Defeated: <span>${score}/${maxScore}</span></div>
            <div>📊 Success Rate: <span>${Math.round((score/maxScore)*100)}%</span></div>
            <div>🎯 'S' Shape Practice: <span>${this.trainingProgress}/5 completed</span></div>
        `;
        
        this.dialogueSystem.showPopup('gameOverPopup');
    }
    
    createVictoryCelebration() {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const celebration = document.createElement('div');
                celebration.textContent = ['🎉', '✨', '⭐', '🏆', '🎊'][Math.floor(Math.random() * 5)];
                celebration.style.cssText = `
                    position: fixed;
                    top: ${Math.random() * 50 + 25}%;
                    left: ${Math.random() * 80 + 10}%;
                    font-size: 48px;
                    z-index: 2000;
                    pointer-events: none;
                    animation: celebrationFloat 3s ease-out forwards;
                `;
                
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes celebrationFloat {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                document.body.appendChild(celebration);
                
                setTimeout(() => {
                    document.body.removeChild(celebration);
                    document.head.removeChild(style);
                }, 3000);
            }, i * 200);
        }
    }
    
    showAccuracyFeedback(accuracy, isSuccess) {
        const feedback = document.createElement('div');
        const percentage = Math.round(accuracy * 100);
        const color = isSuccess ? '#00FF00' : '#FF8800';
        
        feedback.textContent = `${percentage}%`;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: ${color};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 1000;
            pointer-events: none;
            animation: accuracyPop 1.5s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes accuracyPop {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                40% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (document.body.contains(feedback)) document.body.removeChild(feedback);
            if (document.head.contains(style)) document.head.removeChild(style);
        }, 1500);
    }

    checkForEncounters() {
        if (this.phase === 'exploration' && !this.hasMetWizard) {
            const wizard = this.scenes.world.wizard;
            if (wizard && this.player.mesh.position.distanceTo(wizard.mesh.position) < 8) {
                this.hasMetWizard = true;
                this.enterCageUnlockPhase();
            }
        }
    }

    updateUI() {
        const spellCountElement = document.getElementById('spells');
        if (spellCountElement) {
            spellCountElement.textContent = `${this.trainingProgress}/${this.requiredPerfectSpells}`;
        }
        
        const instructions = document.getElementById('instructions');
        if (instructions) {
            // NEW: Use mobile-aware instruction text
            instructions.textContent = this.mobileControls.getControlInstructions(this.phase);
        }
    }
    
    updateWizardAI(deltaTime) {
        if (this.phase === 'training' || this.phase === 'battle') {
            const wizard = this.scenes.world.wizard;
            const player = this.player.mesh;
            wizard.followTarget(player, deltaTime);
        }
    }
    
    // ENHANCED: Cleanup with mobile controls
    cleanup() {
        if (this.mainDrawingSystem) {
            this.mainDrawingSystem.destroy();
        }
        if (this.cageDrawingSystem) {
            this.cageDrawingSystem.destroy();
        }
        if (this.mobileControls) {
            this.mobileControls.destroy();
        }
        
        const elements = ['drawingInstructions', 'realTimeAccuracy', 'battleCounter'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    animate(time) {
        requestAnimationFrame((t) => this.animate(t));
        TWEEN.update(time);
        const deltaTime = this.gameManager.clock.getDelta();

        this.player.update(deltaTime, this.scenes.world.ground, this.scenes.world.rock);
        this.cameraSystem.update();
        this.snakeManager.update(deltaTime);
        this.magicSystem.update(deltaTime);
        this.updateWizardAI(deltaTime);
        this.checkForEncounters();
        
        if (this.phase === 'battle' && this.battleStats.battleActive) {
            this.updateBattleUI();
        }
        
        this.gameManager.renderer.render(this.gameManager.scene, this.gameManager.camera);
    }
}

// Ensure TWEEN is available for animations
const tweenScript = document.createElement('script');
tweenScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js';
document.head.appendChild(tweenScript);
tweenScript.onload = () => {
    new Game();
};