// js/dialogueSystem.js
export class DialogueSystem {
    constructor() {
        this.bubble = document.createElement('div');
        this.bubble.id = 'speechBubble';
        this.bubble.className = 'speech-bubble';
        document.body.appendChild(this.bubble);

        this.textElement = document.createElement('p');
        this.bubble.appendChild(this.textElement);

        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.className = 'bubble-buttons';
        this.bubble.appendChild(this.buttonsContainer);

        // Real-time accuracy display elements
        this.accuracyDisplay = null;
        this.drawingInstructions = null;
        this.proximityWarning = null;
        this.successCelebration = null;
        
        // Progress tracking
        this.progressTracker = null;
        this.currentPhase = 'exploration';
        
        // Educational messaging
        this.educationalTips = [];
        this.currentTipIndex = 0;
        
        // NEW: Battle system support
        this.battleInstructions = null;
        this.battleProgress = null;
        this.snakeTargeting = null;

        this.addStyles();
        this.createAccuracyElements();
        this.hide();
    }

    showMessage(message, options = []) {
        this.textElement.textContent = message;
        this.buttonsContainer.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.onclick = () => {
                this.hide();
                if(option.action) option.action();
            };
            this.buttonsContainer.appendChild(button);
        });

        this.bubble.classList.add('show');
    }

    showNotification(message, duration = 3000, position = 'top-right') {
        const notification = document.createElement('div');
        notification.className = `notification ${position}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if(document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, duration);
    }
    
    // Function to show a specific popup by its ID
    showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.classList.remove('hidden');
        }
    }

    // Function to hide a specific popup by its ID
    hidePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.classList.add('hidden');
        }
    }

    showEmergencyMessage(message, duration) {
        this.showNotification(message, duration, 'center');
    }

    hide() {
        this.bubble.classList.remove('show');
    }
    
    // Create real-time accuracy display elements
    createAccuracyElements() {
        // Real-time accuracy display
        this.accuracyDisplay = document.createElement('div');
        this.accuracyDisplay.id = 'realTimeAccuracyDialogue';
        this.accuracyDisplay.className = 'accuracy-display hidden';
        this.accuracyDisplay.innerHTML = `
            <div class="accuracy-meter">
                <div class="accuracy-bar">
                    <div class="accuracy-fill" id="accuracyFill"></div>
                </div>
                <div class="accuracy-text" id="accuracyText">0%</div>
            </div>
            <div class="accuracy-status" id="accuracyStatus">Start tracing the 'S' shape</div>
        `;
        document.body.appendChild(this.accuracyDisplay);

        // Drawing instructions overlay
        this.drawingInstructions = document.createElement('div');
        this.drawingInstructions.id = 'drawingInstructionsDialogue';
        this.drawingInstructions.className = 'drawing-instructions-overlay hidden';
        document.body.appendChild(this.drawingInstructions);

        // Proximity warning
        this.proximityWarning = document.createElement('div');
        this.proximityWarning.id = 'proximityWarningDialogue';
        this.proximityWarning.className = 'proximity-warning-overlay hidden';
        this.proximityWarning.innerHTML = `
            <div class="warning-icon">⚠️</div>
            <div class="warning-title">Stay Close to the 'S'!</div>
            <div class="warning-subtitle">Start drawing near the golden line</div>
        `;
        document.body.appendChild(this.proximityWarning);

        // Success celebration
        this.successCelebration = document.createElement('div');
        this.successCelebration.id = 'successCelebrationDialogue';
        this.successCelebration.className = 'success-celebration hidden';
        document.body.appendChild(this.successCelebration);

        // Progress tracker
        this.progressTracker = document.createElement('div');
        this.progressTracker.id = 'progressTrackerDialogue';
        this.progressTracker.className = 'progress-tracker hidden';
        document.body.appendChild(this.progressTracker);
        
        // NEW: Battle-specific elements
        this.createBattleElements();
    }
    
    // NEW: Create battle-specific UI elements
    createBattleElements() {
        // Battle instructions overlay
        this.battleInstructions = document.createElement('div');
        this.battleInstructions.id = 'battleInstructionsDialogue';
        this.battleInstructions.className = 'battle-instructions-overlay hidden';
        document.body.appendChild(this.battleInstructions);

        // Snake targeting guide
        this.snakeTargeting = document.createElement('div');
        this.snakeTargeting.id = 'snakeTargetingDialogue';
        this.snakeTargeting.className = 'snake-targeting-guide hidden';
        document.body.appendChild(this.snakeTargeting);

        // Battle progress display
        this.battleProgress = document.createElement('div');
        this.battleProgress.id = 'battleProgressDialogue';
        this.battleProgress.className = 'battle-progress-display hidden';
        document.body.appendChild(this.battleProgress);
    }
    
    // Update real-time accuracy display
    updateAccuracy(accuracy, isDrawing = false) {
        if (!this.accuracyDisplay || this.accuracyDisplay.classList.contains('hidden')) return;
        
        const percentage = Math.round(accuracy * 100);
        const accuracyFill = document.getElementById('accuracyFill');
        const accuracyText = document.getElementById('accuracyText');
        const accuracyStatus = document.getElementById('accuracyStatus');
        
        if (accuracyFill && accuracyText && accuracyStatus) {
            // Update percentage display
            accuracyText.textContent = `${percentage}%`;
            accuracyFill.style.width = `${percentage}%`;
            
            // Color coding based on accuracy
            let color, status;
            if (percentage >= 75) {
                color = '#00FF00';
                status = 'Excellent! Perfect tracing!';
            } else if (percentage >= 50) {
                color = '#FFFF00';
                status = 'Great! Keep following the line!';
            } else if (percentage >= 25) {
                color = '#FF8800';
                status = 'Good start! Stay closer to the line';
            } else {
                color = '#FF4444';
                status = isDrawing ? 'Follow the S-shape line more closely' : 'Start tracing the \'S\' shape';
            }
            
            accuracyFill.style.backgroundColor = color;
            accuracyText.style.color = color;
            accuracyStatus.textContent = status;
            
            // Add pulsing effect for high accuracy
            if (percentage >= 75) {
                this.accuracyDisplay.classList.add('high-accuracy');
            } else {
                this.accuracyDisplay.classList.remove('high-accuracy');
            }
        }
    }
    
    // Show/hide real-time accuracy display
    showAccuracyDisplay() {
        if (this.accuracyDisplay) {
            this.accuracyDisplay.classList.remove('hidden');
            this.updateAccuracy(0);
        }
    }
    
    hideAccuracyDisplay() {
        if (this.accuracyDisplay) {
            this.accuracyDisplay.classList.add('hidden');
        }
    }
    
    // Show drawing instructions for current phase
    showDrawingInstructions(phase) {
        if (!this.drawingInstructions) return;
        
        this.currentPhase = phase;
        let instruction = '';
        
        switch(phase) {
            case 'cage':
                instruction = `
                    <div class="instruction-icon">🗝️</div>
                    <div class="instruction-title">Break the Magical Seal</div>
                    <div class="instruction-steps">
                        <div class="step">1. Look for the golden 'S' rune</div>
                        <div class="step">2. Start at the green START point</div>
                        <div class="step">3. Follow the curved path to the red END</div>
                        <div class="step">4. Trace the complete S-shape carefully</div>
                    </div>
                `;
                break;
            case 'training':
                instruction = `
                    <div class="instruction-icon">✨</div>
                    <div class="instruction-title">Practice Your Magic</div>
                    <div class="instruction-steps">
                        <div class="step">1. Approach the glowing rock</div>
                        <div class="step">2. Find the white 'S' rune (same shape as before)</div>
                        <div class="step">3. Trace from top to bottom like the popup</div>
                        <div class="step">4. Need 5 perfect spells to continue</div>
                    </div>
                `;
                break;
            case 'battle':
                instruction = `
                    <div class="instruction-icon">⚔️</div>
                    <div class="instruction-title">Defend Against 5 Serpents</div>
                    <div class="instruction-steps">
                        <div class="step">1. Look for red 'S' runes above snakes</div>
                        <div class="step">2. Trace the same S-shape as before</div>
                        <div class="step">3. Start near the rune and trace completely</div>
                        <div class="step">4. Defeat all 5 serpents to win!</div>
                    </div>
                    <div class="battle-scoring">
                        <div class="score-info">🎯 Goal: Score 5/5 for victory!</div>
                    </div>
                `;
                break;
        }
        
        this.drawingInstructions.innerHTML = instruction;
        this.drawingInstructions.classList.remove('hidden');
    }
    
    hideDrawingInstructions() {
        if (this.drawingInstructions) {
            this.drawingInstructions.classList.add('hidden');
        }
    }
    
    // NEW: Show battle-specific instructions
    showBattleInstructions() {
        if (!this.battleInstructions) return;
        
        this.battleInstructions.innerHTML = `
            <div class="battle-header">
                <div class="battle-icon">🐍</div>
                <div class="battle-title">Serpent Battle Guide</div>
            </div>
            <div class="battle-tips">
                <div class="tip">
                    <div class="tip-icon">🎯</div>
                    <div class="tip-text">Look for red 'S' runes floating above serpents</div>
                </div>
                <div class="tip">
                    <div class="tip-icon">✏️</div>
                    <div class="tip-text">Trace the same S-shape you practiced</div>
                </div>
                <div class="tip">
                    <div class="tip-icon">⚡</div>
                    <div class="tip-text">40%+ accuracy puts serpents to sleep</div>
                </div>
                <div class="tip">
                    <div class="tip-icon">🏆</div>
                    <div class="tip-text">Defeat all 5 serpents for victory!</div>
                </div>
            </div>
        `;
        
        this.battleInstructions.classList.remove('hidden');
    }
    
    hideBattleInstructions() {
        if (this.battleInstructions) {
            this.battleInstructions.classList.add('hidden');
        }
    }
    
    // NEW: Show snake targeting guide
    showSnakeTargeting(snakeNumber, totalSnakes) {
        if (!this.snakeTargeting) return;
        
        this.snakeTargeting.innerHTML = `
            <div class="targeting-header">
                <div class="target-icon">🎯</div>
                <div class="target-text">Target: Serpent ${snakeNumber}/${totalSnakes}</div>
            </div>
            <div class="targeting-guide">Trace the red 'S' rune above the serpent</div>
        `;
        
        this.snakeTargeting.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideSnakeTargeting();
        }, 3000);
    }
    
    hideSnakeTargeting() {
        if (this.snakeTargeting) {
            this.snakeTargeting.classList.add('hidden');
        }
    }
    
    // NEW: Update battle progress
    updateBattleProgress(defeated, total, currentTarget = null) {
        if (!this.battleProgress) return;
        
        const percentage = (defeated / total) * 100;
        
        this.battleProgress.innerHTML = `
            <div class="battle-progress-header">
                <div class="progress-icon">⚔️</div>
                <div class="progress-title">Battle Progress</div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%; background: linear-gradient(90deg, #ff4444, #ff8888);"></div>
                </div>
                <div class="progress-text">${defeated}/${total} Serpents Defeated</div>
            </div>
            ${currentTarget ? `<div class="current-target">🎯 Current Target: Serpent ${currentTarget}</div>` : ''}
        `;
        
        this.battleProgress.classList.remove('hidden');
    }
    
    hideBattleProgress() {
        if (this.battleProgress) {
            this.battleProgress.classList.add('hidden');
        }
    }
    
    // Show proximity warning
    showProximityWarning(customMessage = null) {
        if (!this.proximityWarning) return;
        
        if (customMessage) {
            this.proximityWarning.querySelector('.warning-subtitle').textContent = customMessage;
        }
        
        this.proximityWarning.classList.remove('hidden');
        this.proximityWarning.classList.add('shake');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideProximityWarning();
        }, 3000);
    }
    
    hideProximityWarning() {
        if (this.proximityWarning) {
            this.proximityWarning.classList.add('hidden');
            this.proximityWarning.classList.remove('shake');
        }
    }
    
    // Show success celebration
    showSuccessCelebration(accuracy, message = 'Perfect Tracing!') {
        if (!this.successCelebration) return;
        
        const percentage = Math.round(accuracy * 100);
        this.successCelebration.innerHTML = `
            <div class="celebration-icon">🎉</div>
            <div class="celebration-title">${message}</div>
            <div class="celebration-accuracy">${percentage}% Accuracy!</div>
            <div class="celebration-sparkles">✨ ⭐ ✨</div>
        `;
        
        this.successCelebration.classList.remove('hidden');
        this.successCelebration.classList.add('celebrate');
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hideSuccessCelebration();
        }, 2000);
    }
    
    hideSuccessCelebration() {
        if (this.successCelebration) {
            this.successCelebration.classList.add('hidden');
            this.successCelebration.classList.remove('celebrate');
        }
    }
    
    // Update progress tracker
    updateProgress(current, total, phase) {
        if (!this.progressTracker) return;
        
        const percentage = (current / total) * 100;
        let phaseTitle = '';
        
        switch(phase) {
            case 'training':
                phaseTitle = 'Spell Practice';
                break;
            case 'battle':
                phaseTitle = 'Serpent Battle';
                break;
            default:
                phaseTitle = 'Progress';
        }
        
        this.progressTracker.innerHTML = `
            <div class="progress-title">${phaseTitle}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%; background: linear-gradient(90deg, #00ffff, #0088ff);"></div>
            </div>
            <div class="progress-text">${current} / ${total} Complete</div>
        `;
        
        this.progressTracker.classList.remove('hidden');
    }
    
    hideProgress() {
        if (this.progressTracker) {
            this.progressTracker.classList.add('hidden');
        }
    }
    
    // Show educational tips
    showEducationalTip(tipType = 'general') {
        const tips = {
            general: [
                "💡 Take your time! Slow, steady tracing works best.",
                "🎯 Start at the beginning of the 'S' shape for better accuracy.",
                "✋ Keep your movements smooth and flowing like the letter.",
                "🌟 Practice makes perfect! Don't worry about mistakes."
            ],
            cage: [
                "🗝️ Follow the golden dotted line from START to END.",
                "⭐ The seal responds to complete S-shape tracing.",
                "🎯 Start from the green dot and curve down smoothly."
            ],
            training: [
                "✨ The rock glows when you trace the white S-rune correctly.",
                "🎪 Each successful spell makes you stronger!",
                "🔥 Same S-shape as the popup - trace from top to bottom."
            ],
            battle: [
                "🐍 Each serpent has a red 'S' rune floating above it.",
                "⚡ Trace the same S-shape you've been practicing.",
                "🛡️ 40%+ accuracy puts serpents to sleep instantly.",
                "🏆 Score 5/5 to achieve victory and save your mentor!",
                "🎯 Look for the red runes and trace them completely."
            ]
        };
        
        const tipArray = tips[tipType] || tips.general;
        const tip = tipArray[this.currentTipIndex % tipArray.length];
        this.currentTipIndex++;
        
        this.showNotification(tip, 4000, 'top-right');
    }
    
    // Show accuracy-based feedback
    showAccuracyFeedback(accuracy, context = 'general') {
        const percentage = Math.round(accuracy * 100);
        let message = '';
        
        if (accuracy >= 0.75) {
            const excellentMessages = [
                `🌟 Outstanding! ${percentage}% accuracy!`,
                `✨ Perfect S-shape tracing! You're a master!`,
                `🎯 Incredible! ${percentage}% - Expert level!`,
                `⭐ Amazing work! The S-shape is perfect!`
            ];
            message = excellentMessages[Math.floor(Math.random() * excellentMessages.length)];
            this.showSuccessCelebration(accuracy, 'Excellent Tracing!');
        } else if (accuracy >= 0.50) {
            const goodMessages = [
                `👍 Great job! ${percentage}% accuracy!`,
                `🎪 Well done! Keep practicing the S-shape!`,
                `💪 Good tracing! You're improving!`,
                `✅ Success! ${percentage}% is great progress!`
            ];
            message = goodMessages[Math.floor(Math.random() * goodMessages.length)];
        } else if (accuracy >= 0.25) {
            const okayMessages = [
                `🎯 Getting there! ${percentage}% - try tracing the complete S-shape.`,
                `📈 Good start! Follow the S-shape from top to bottom.`,
                `💡 Nice try! Keep your line on the S-shape path.`,
                `🔄 Almost! Trace more slowly for better accuracy.`
            ];
            message = okayMessages[Math.floor(Math.random() * okayMessages.length)];
        } else {
            const encouragementMessages = [
                `🌱 Keep practicing! Try following the S-shape more closely.`,
                `💝 Don't give up! Start at the beginning of the S-shape.`,
                `🎨 Take your time! Trace the complete S from top to bottom.`,
                `🤗 Learning is a process! The S-shape takes practice!`
            ];
            message = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
        }
        
        this.showNotification(message, 3000, 'top-right');
    }
    
    // NEW: Battle-specific feedback
    showBattleResult(defeated, total, accuracy = null) {
        let message = '';
        const percentage = accuracy ? Math.round(accuracy * 100) : '';
        
        if (defeated === total) {
            // Perfect victory
            message = `🏆 VICTORY! All ${total} serpents defeated! ${percentage ? `Final spell: ${percentage}%` : 'Perfect score: 5/5!'}`;
            this.showSuccessCelebration(accuracy || 1.0, 'Battle Won!');
        } else if (defeated > 0) {
            // Partial success
            message = `⚔️ Serpent defeated! Progress: ${defeated}/${total} ${percentage ? `(${percentage}% accuracy)` : ''}`;
        } else {
            // First attempt or miss
            message = percentage ? `🎯 ${percentage}% accuracy. Keep practicing the S-shape!` : 'Look for red S-runes above the serpents!';
        }
        
        this.showNotification(message, 3000, 'top-right');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .speech-bubble {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translate(-50%, 150%);
                background: linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(60, 30, 90, 0.95));
                color: white;
                padding: 20px;
                border-radius: 15px;
                border: 2px solid #ffd700;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
                backdrop-filter: blur(10px);
                width: 80%;
                max-width: 600px;
                text-align: center;
                z-index: 1001;
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .speech-bubble.show {
                transform: translate(-50%, 0);
            }
            .bubble-buttons button {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                border: none;
                padding: 10px 20px;
                margin: 10px 5px 0 5px;
                font-size: 16px;
                font-weight: bold;
                color: #333;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .bubble-buttons button:hover {
                transform: scale(1.05);
            }
            .notification {
                position: fixed;
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(30,30,60,0.9));
                color: #fff;
                padding: 15px 20px;
                border-radius: 10px;
                z-index: 1002;
                opacity: 0;
                transition: all 0.5s;
                pointer-events: none;
                border: 1px solid rgba(0, 255, 255, 0.3);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
                backdrop-filter: blur(5px);
                font-size: 16px;
                max-width: 350px;
            }
            .notification.top-right { top: 80px; right: -100%; }
            .notification.top-right.show { right: 20px; opacity: 1; }
            .notification.center { top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5); }
            .notification.center.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            
            /* Real-time accuracy display styles */
            .accuracy-display {
                position: fixed;
                bottom: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #00ffff;
                border-radius: 20px;
                padding: 20px;
                color: white;
                z-index: 150;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
                min-width: 300px;
                text-align: center;
                transition: all 0.3s ease;
            }
            
            .accuracy-display.hidden {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
                pointer-events: none;
            }
            
            .accuracy-display.high-accuracy {
                animation: accuracyPulse 1s infinite;
                border-color: #00ff00;
                box-shadow: 0 0 40px rgba(0, 255, 0, 0.6);
            }
            
            .accuracy-meter {
                margin-bottom: 15px;
            }
            
            .accuracy-bar {
                width: 100%;
                height: 20px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 10px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .accuracy-fill {
                height: 100%;
                background: #00ffff;
                border-radius: 10px;
                transition: all 0.3s ease;
                min-width: 2px;
            }
            
            .accuracy-text {
                font-size: 24px;
                font-weight: bold;
                color: #00ffff;
                text-shadow: 0 0 10px currentColor;
            }
            
            .accuracy-status {
                font-size: 14px;
                color: #cccccc;
                font-style: italic;
            }
            
            /* Drawing instructions overlay */
            .drawing-instructions-overlay {
                position: fixed;
                top: 10%;
                right: 20px;
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid #ffd700;
                border-radius: 15px;
                padding: 20px;
                color: white;
                z-index: 180;
                max-width: 320px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
            }
            
            .drawing-instructions-overlay.hidden {
                opacity: 0;
                transform: translateX(20px);
                pointer-events: none;
            }
            
            .instruction-icon {
                font-size: 32px;
                text-align: center;
                margin-bottom: 10px;
            }
            
            .instruction-title {
                font-size: 18px;
                font-weight: bold;
                color: #ffd700;
                text-align: center;
                margin-bottom: 15px;
            }
            
            .instruction-steps .step {
                margin: 8px 0;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                border-left: 3px solid #00ffff;
                font-size: 14px;
            }
            
            /* NEW: Battle-specific styles */
            .battle-scoring {
                margin-top: 15px;
                padding: 10px;
                background: rgba(255, 68, 68, 0.2);
                border-radius: 8px;
                border: 1px solid rgba(255, 68, 68, 0.4);
            }
            
            .score-info {
                color: #ffaaaa;
                font-weight: bold;
                text-align: center;
            }
            
            .battle-instructions-overlay {
                position: fixed;
                top: 15%;
                left: 20px;
                background: rgba(20, 20, 40, 0.9);
                border: 2px solid #ff4444;
                border-radius: 15px;
                padding: 20px;
                color: white;
                z-index: 190;
                max-width: 300px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 25px rgba(255, 68, 68, 0.4);
            }
            
            .battle-instructions-overlay.hidden {
                opacity: 0;
                transform: translateX(-20px);
                pointer-events: none;
            }
            
            .battle-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .battle-icon {
                font-size: 24px;
                margin-right: 10px;
            }
            
            .battle-title {
                font-size: 16px;
                font-weight: bold;
                color: #ff8888;
            }
            
            .battle-tips .tip {
                display: flex;
                align-items: center;
                margin: 10px 0;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
            }
            
            .tip-icon {
                font-size: 16px;
                margin-right: 8px;
                min-width: 20px;
            }
            
            .tip-text {
                font-size: 13px;
                flex: 1;
            }
            
            .snake-targeting-guide {
                position: fixed;
                top: 40%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 68, 68, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                z-index: 200;
                border: 2px solid #ff8888;
                box-shadow: 0 0 20px rgba(255, 68, 68, 0.6);
                text-align: center;
            }
            
            .snake-targeting-guide.hidden {
                opacity: 0;
                transform: translateX(-50%) scale(0.8);
                pointer-events: none;
            }
            
            .targeting-header {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 8px;
            }
            
            .target-icon {
                font-size: 20px;
                margin-right: 8px;
            }
            
            .target-text {
                font-size: 14px;
            }
            
            .targeting-guide {
                font-size: 12px;
                opacity: 0.9;
            }
            
            .battle-progress-display {
                position: fixed;
                top: 140px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #ff4444;
                border-radius: 12px;
                padding: 15px;
                color: white;
                z-index: 160;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
                min-width: 200px;
            }
            
            .battle-progress-display.hidden {
                opacity: 0;
                transform: translateX(-20px);
                pointer-events: none;
            }
            
            .battle-progress-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .progress-icon {
                font-size: 18px;
                margin-right: 8px;
            }
            
            .progress-title {
                font-size: 14px;
                font-weight: bold;
                color: #ff8888;
            }
            
            .progress-bar-container {
                margin-bottom: 8px;
            }
            
            .progress-bar {
                width: 100%;
                height: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .progress-fill {
                height: 100%;
                border-radius: 5px;
                transition: all 0.5s ease;
            }
            
            .progress-text {
                font-size: 12px;
                text-align: center;
                color: #cccccc;
            }
            
            .current-target {
                font-size: 12px;
                color: #ffaaaa;
                text-align: center;
                margin-top: 5px;
            }
            
            /* Proximity warning styles */
            .proximity-warning-overlay {
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 100, 100, 0.95);
                color: white;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                z-index: 250;
                border: 3px solid #ff4444;
                box-shadow: 0 0 30px rgba(255, 68, 68, 0.7);
                backdrop-filter: blur(10px);
            }
            
            .proximity-warning-overlay.hidden {
                opacity: 0;
                transform: translateX(-50%) scale(0.8);
                pointer-events: none;
            }
            
            .proximity-warning-overlay.shake {
                animation: warningShake 0.5s ease-in-out infinite;
            }
            
            .warning-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
            
            .warning-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .warning-subtitle {
                font-size: 16px;
                opacity: 0.9;
            }
            
            /* Success celebration styles */
            .success-celebration {
                position: fixed;
                top: 40%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #00ff00, #7cfc00);
                color: #003300;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                z-index: 300;
                border: 3px solid #00ff00;
                box-shadow: 0 0 40px rgba(0, 255, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .success-celebration.hidden {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
                pointer-events: none;
            }
            
            .success-celebration.celebrate {
                animation: celebrationBounce 0.6s ease-out;
            }
            
            .celebration-icon {
                font-size: 64px;
                margin-bottom: 15px;
                animation: celebrationSpin 1s linear infinite;
            }
            
            .celebration-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .celebration-accuracy {
                font-size: 20px;
                margin-bottom: 10px;
            }
            
            .celebration-sparkles {
                font-size: 32px;
                animation: sparkleFloat 2s ease-in-out infinite;
            }
            
            /* Progress tracker styles */
            .progress-tracker {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 15px 25px;
                color: white;
                z-index: 160;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            }
            
            .progress-tracker.hidden {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
                pointer-events: none;
            }
            
            /* Animations */
            @keyframes accuracyPulse {
                0%, 100% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
            }
            
            @keyframes warningShake {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                25% { transform: translateX(-52%) translateY(-2px); }
                75% { transform: translateX(-48%) translateY(2px); }
            }
            
            @keyframes celebrationBounce {
                0% { transform: translate(-50%, -50%) scale(0.3); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes celebrationSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes sparkleFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
}