// js/draw.js - Enhanced for Touch and Mobile Drawing

export class DrawingSystem {
    constructor(gameManager, canvasElement = null) {
        this.gameManager = gameManager;
        this.isDrawing = false;
        this.drawPath = [];
        this.isActive = false;

        this.mode = canvasElement ? 'canvas' : 'raycast';
        this.canvas = canvasElement;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Visual drawing trail for all scenes
        this.trailCanvas = null;
        this.trailCtx = null;
        this.setupTrailCanvas();
        
        this.templatePath = null;
        this.standardTemplatePath = this.createStandardTemplatePath();
        
        // Accuracy tracking and visual feedback
        this.currentAccuracy = 0;
        this.realTimeAccuracy = 0;
        this.proximityTolerance = 200;
        this.overlapTolerance = 50;
        
        // ENHANCED: Battle phase targeting with visual feedback
        this.targetedSnake = null;
        this.lastTargetCheck = 0;
        this.targetingIndicator = null;
        this.accuracyIndicator = null;

        // NEW: Touch support properties
        this.isTouch = 'ontouchstart' in window;
        this.isMobile = this.detectMobile();
        this.lastTouchTime = 0;
        this.touchDebounceDelay = 50; // ms
        this.activeTouchId = null;

        // Bind event handlers
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onClick = this.onClick.bind(this);
        
        // NEW: Touch event handlers
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);

        this.setupControls();
        this.setupBattleUI();
    }
    
    // NEW: Mobile detection
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
               window.innerWidth <= 768;
    }
    
    // NEW: Setup battle-specific UI elements
    setupBattleUI() {
        this.targetingIndicator = document.createElement('div');
        this.targetingIndicator.id = 'snakeTargetingIndicator';
        this.targetingIndicator.style.cssText = `
            position: fixed;
            width: 60px;
            height: 60px;
            border: 4px solid #ff4444;
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
            display: none;
            animation: targetPulse 1s infinite;
            box-shadow: 0 0 20px rgba(255, 68, 68, 0.6);
        `;
        document.body.appendChild(this.targetingIndicator);
        
        this.accuracyIndicator = document.createElement('div');
        this.accuracyIndicator.id = 'battleAccuracyIndicator';
        this.accuracyIndicator.style.cssText = `
            position: fixed;
            bottom: 15%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #ff4444;
            border-radius: 20px;
            padding: 15px 25px;
            color: white;
            font-size: 20px;
            font-weight: bold;
            z-index: 150;
            display: none;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 25px rgba(255, 68, 68, 0.5);
        `;
        document.body.appendChild(this.accuracyIndicator);
        
        // Mobile-specific positioning
        if (this.isMobile) {
            this.accuracyIndicator.style.bottom = '200px'; // Above joystick area
            this.accuracyIndicator.style.fontSize = '18px';
            this.accuracyIndicator.style.padding = '12px 20px';
        }
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes targetPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 1; }
            }
            @keyframes accuracyGlow {
                0%, 100% { box-shadow: 0 0 25px rgba(255, 68, 68, 0.5); }
                50% { box-shadow: 0 0 35px rgba(255, 68, 68, 0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Setup visual trail canvas for all scenes
    setupTrailCanvas() {
        if (!this.canvas) { // Only for raycast mode (3D scenes)
            this.trailCanvas = document.createElement('canvas');
            this.trailCanvas.id = 'drawingTrail';
            this.trailCanvas.width = window.innerWidth;
            this.trailCanvas.height = window.innerHeight;
            this.trailCanvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                z-index: 10;
                pointer-events: none;
                width: 100%;
                height: 100%;
                background: transparent;
                touch-action: none;
            `;
            document.body.appendChild(this.trailCanvas);
            this.trailCtx = this.trailCanvas.getContext('2d');
            
            this.trailCtx.lineCap = 'round';
            this.trailCtx.lineJoin = 'round';
            this.trailCtx.globalCompositeOperation = 'source-over';
        }
    }
    
    setActive(isActive) {
        this.isActive = isActive;
        console.log(`🎨 Drawing system ${isActive ? 'activated' : 'deactivated'}`);
        
        if (this.trailCanvas) {
            this.trailCanvas.style.display = isActive ? 'block' : 'none';
            console.log(`🎨 Trail canvas display: ${this.trailCanvas.style.display}`);
        }
        
        // Show/hide battle UI elements
        if (window.gameInstance?.phase === 'battle') {
            if (isActive) {
                this.showBattleUI();
            } else {
                this.hideBattleUI();
            }
        }
    }

    showBattleUI() {
        if (this.accuracyIndicator) {
            this.accuracyIndicator.style.display = 'block';
        }
    }
    
    hideBattleUI() {
        if (this.targetingIndicator) {
            this.targetingIndicator.style.display = 'none';
        }
        if (this.accuracyIndicator) {
            this.accuracyIndicator.style.display = 'none';
        }
    }

    setupControls() {
        const eventTarget = this.canvas || this.gameManager.renderer.domElement;
        
        // ENHANCED: Setup both mouse and touch events
        if (this.isTouch) {
            // Touch events for mobile/tablet
            eventTarget.addEventListener('touchstart', this.onTouchStart, { passive: false });
            eventTarget.addEventListener('touchmove', this.onTouchMove, { passive: false });
            eventTarget.addEventListener('touchend', this.onTouchEnd, { passive: false });
            eventTarget.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
            
            console.log('📱 Touch events registered for drawing');
        } else {
            // Mouse events for desktop
            eventTarget.addEventListener('mousedown', this.onMouseDown);
            eventTarget.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mouseup', this.onMouseUp);
            
            if (this.mode === 'raycast') {
                this.gameManager.renderer.domElement.addEventListener('click', this.onClick);
            }
            
            console.log('🖱️ Mouse events registered for drawing');
        }
        
        // Handle window resize for trail canvas
        window.addEventListener('resize', () => this.handleResize());
    }
    
    // Handle window resize
    handleResize() {
        if (this.trailCanvas) {
            this.trailCanvas.width = window.innerWidth;
            this.trailCanvas.height = window.innerHeight;
        }
    }

    // NEW: Touch event handlers
    onTouchStart(event) {
        event.preventDefault();
        
        const now = Date.now();
        if (now - this.lastTouchTime < this.touchDebounceDelay) {
            return;
        }
        this.lastTouchTime = now;
        
        const touch = event.touches[0];
        if (!touch) return;
        
        this.activeTouchId = touch.identifier;
        
        console.log(`📱 Touch start - Phase: ${window.gameInstance?.phase}, Active: ${this.isActive}`);
        
        if (this.mode === 'raycast' && !this.isActive) {
            console.log(`❌ Drawing system not active`);
            return;
        }
        
        // Create synthetic mouse event for existing logic
        const syntheticEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => {},
            stopPropagation: () => {}
        };
        
        this.handleDrawingStart(syntheticEvent);
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        if (!this.isDrawing || this.activeTouchId === null) return;
        
        // Find the active touch
        let activeTouch = null;
        for (let i = 0; i < event.touches.length; i++) {
            if (event.touches[i].identifier === this.activeTouchId) {
                activeTouch = event.touches[i];
                break;
            }
        }
        
        if (!activeTouch) return;
        
        const syntheticEvent = {
            clientX: activeTouch.clientX,
            clientY: activeTouch.clientY
        };
        
        this.handleDrawingMove(syntheticEvent);
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        
        if (!this.isDrawing || this.activeTouchId === null) return;
        
        // Check if our active touch ended
        let touchEnded = true;
        for (let i = 0; i < event.touches.length; i++) {
            if (event.touches[i].identifier === this.activeTouchId) {
                touchEnded = false;
                break;
            }
        }
        
        if (touchEnded) {
            console.log(`📱 Touch end - Processing drawing with ${this.drawPath.length} points`);
            this.activeTouchId = null;
            this.handleDrawingEnd();
        }
    }

    // ENHANCED: Mouse event handlers (refactored to use common logic)
    onMouseDown(event) {
        console.log(`🖱️ Mouse down - Phase: ${window.gameInstance?.phase}, Active: ${this.isActive}`);
        
        if (this.mode === 'raycast' && !this.isActive) {
            console.log(`❌ Drawing system not active`);
            return;
        }
        
        this.handleDrawingStart(event);
    }

    onMouseMove(event) {
        if (this.isDrawing) {
            this.handleDrawingMove(event);
        }
    }

    onMouseUp(event) {
        if (this.isDrawing) {
            console.log(`🖱️ Mouse up - Processing drawing with ${this.drawPath.length} points`);
            this.handleDrawingEnd();
        }
    }

    onClick(event) {
        // This is now handled by the targeting system in the battle phase
    }

    // NEW: Common drawing start logic for both mouse and touch
    handleDrawingStart(event) {
        // SIMPLIFIED: For battle phase, be very permissive
        if (window.gameInstance?.phase === 'battle') {
            const snakeManager = window.gameInstance.snakeManager;
            const aliveCount = snakeManager ? snakeManager.getAliveSnakes().length : 0;
            console.log(`🐍 Battle phase: ${aliveCount} snakes alive`);
            
            if (aliveCount === 0) {
                this.showProximityWarning();
                return;
            }
            
            console.log(`✅ Battle: allowing drawing with ${aliveCount} snakes`);
        } else {
            // Original proximity check for non-battle phases
            if (!this.isNearTarget(event)) {
                this.showProximityWarning();
                return;
            }
        }
        
        console.log(`✅ Starting drawing...`);
        
        this.isDrawing = true;
        this.drawPath = [];
        this.currentAccuracy = 0;
        this.realTimeAccuracy = 0;
        
        // For battle phase, try to find the best target snake
        if (this.mode === 'raycast' && window.gameInstance?.phase === 'battle') {
            const mousePos = { x: event.clientX, y: event.clientY };
            this.targetedSnake = this.findTargetedSnake(mousePos);
            if (this.targetedSnake) {
                console.log(`🎯 Targeting snake ${this.targetedSnake.userData.spawnOrder}`);
                this.highlightTargetedSnake(this.targetedSnake, mousePos);
            } else {
                console.log(`🎯 No specific target, will use closest snake`);
            }
        }
        
        // Initialize drawing contexts
        if (this.ctx) this.ctx.beginPath();
        if (this.trailCtx) {
            this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            this.trailCtx.beginPath();
            this.trailCtx.strokeStyle = '#00FFFF';
            this.trailCtx.lineWidth = this.isMobile ? 8 : 6; // Thicker lines for mobile
            this.trailCtx.shadowColor = '#00FFFF';
            this.trailCtx.shadowBlur = this.isMobile ? 15 : 10;
        }
        
        this.updateMousePosition(event);
        this.updateRealTimeAccuracy();
    }
    
    // NEW: Common drawing move logic
    handleDrawingMove(event) {
        this.updateMousePosition(event);
        
        // ENHANCED: Draw visual trail with better styling for mobile
        if (this.mode === 'canvas' && this.ctx) {
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.strokeStyle = this.getAccuracyColor(this.realTimeAccuracy);
            this.ctx.lineWidth = this.isMobile ? 7 : 5;
            this.ctx.stroke();
        } else if (this.trailCtx) {
            // Enhanced trail drawing for 3D scenes
            this.trailCtx.lineTo(event.clientX, event.clientY);
            this.trailCtx.strokeStyle = this.getAccuracyColor(this.realTimeAccuracy);
            this.trailCtx.lineWidth = this.isMobile ? 8 : 6;
            this.trailCtx.shadowColor = this.getAccuracyColor(this.realTimeAccuracy);
            this.trailCtx.stroke();
        }
        
        this.updateRealTimeAccuracy();
        this.updateBattleAccuracyDisplay();
    }
    
    // NEW: Common drawing end logic
    handleDrawingEnd() {
        this.isDrawing = false;
        this.processDrawing();
        this.clearTrailAfterDelay();
        
        // Reset targeting
        this.targetedSnake = null;
        this.hideTargetingIndicator();
    }

    updateMousePosition(event) {
        if (this.mode === 'canvas') {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        } else {
            this.mouse = { x: event.clientX, y: event.clientY };
        }
        this.drawPath.push({ ...this.mouse });
    }
    
    // ENHANCED: Find targeted snake with better logic
    findTargetedSnake(mousePos) {
        if (!window.gameInstance?.snakeManager) {
            console.log("⚠️ No snake manager available");
            return null;
        }
        
        const snakeManager = window.gameInstance.snakeManager;
        const camera = window.gameInstance.gameManager.camera;
        const renderer = window.gameInstance.gameManager.renderer;
        
        const aliveSnakes = snakeManager.getAliveSnakes();
        console.log(`🐍 Checking ${aliveSnakes.length} alive snakes for targeting`);
        
        if (aliveSnakes.length === 0) {
            console.log("⚠️ No alive snakes available");
            return null;
        }
        
        // ENHANCED: More lenient targeting for mobile with larger tolerance
        const tolerance = this.isMobile ? 250 : 200;
        
        for (const snake of aliveSnakes) {
            const runeScreenPos = snakeManager.getSnakeRuneScreenPosition(snake, camera, renderer);
            if (runeScreenPos) {
                const distance = Math.sqrt(
                    Math.pow(mousePos.x - runeScreenPos.x, 2) + 
                    Math.pow(mousePos.y - runeScreenPos.y, 2)
                );
                if (distance <= tolerance) {
                    console.log(`🎯 Found snake ${snake.userData.spawnOrder} within ${Math.round(distance)}px of cursor`);
                    return snake;
                }
            }
        }
        
        // Second priority: any snake that's visible on screen  
        for (const snake of aliveSnakes) {
            const runeScreenPos = snakeManager.getSnakeRuneScreenPosition(snake, camera, renderer);
            if (runeScreenPos && runeScreenPos.x >= 0 && runeScreenPos.x <= window.innerWidth && 
                runeScreenPos.y >= 0 && runeScreenPos.y <= window.innerHeight) {
                console.log(`🎯 Found visible snake ${snake.userData.spawnOrder} on screen`);
                return snake;
            }
        }
        
        // Third priority: just return the first alive snake
        console.log(`🎯 Using first available snake ${aliveSnakes[0].userData.spawnOrder} as fallback`);
        return aliveSnakes[0];
    }
    
    // NEW: Highlight the targeted snake
    highlightTargetedSnake(snake, mousePos) {
        if (!this.targetingIndicator) return;
        
        const runeScreenPos = window.gameInstance.snakeManager.getSnakeRuneScreenPosition(
            snake,
            window.gameInstance.gameManager.camera,
            window.gameInstance.gameManager.renderer
        );
        
        if (runeScreenPos) {
            this.targetingIndicator.style.left = (runeScreenPos.x - 30) + 'px';
            this.targetingIndicator.style.top = (runeScreenPos.y - 30) + 'px';
            this.targetingIndicator.style.display = 'block';
        }
    }
    
    // NEW: Hide targeting indicator
    hideTargetingIndicator() {
        if (this.targetingIndicator) {
            this.targetingIndicator.style.display = 'none';
        }
    }
    
    // NEW: Update battle accuracy display
    updateBattleAccuracyDisplay() {
        if (window.gameInstance?.phase === 'battle' && this.accuracyIndicator) {
            const percentage = Math.round(this.realTimeAccuracy * 100);
            this.accuracyIndicator.textContent = `Accuracy: ${percentage}% (Need 40%+)`;
            this.accuracyIndicator.style.borderColor = this.getAccuracyColor(this.realTimeAccuracy);
            this.accuracyIndicator.style.color = this.getAccuracyColor(this.realTimeAccuracy);
            
            if (this.realTimeAccuracy >= 0.75) {
                this.accuracyIndicator.style.animation = 'accuracyGlow 1s infinite';
            } else {
                this.accuracyIndicator.style.animation = 'none';
            }
        }
    }
    
    // Check if drawing starts near target 'S'
    isNearTarget(event) {
        const mousePos = this.mode === 'canvas' 
            ? { x: event.clientX - this.canvas.getBoundingClientRect().left, y: event.clientY - this.canvas.getBoundingClientRect().top }
            : { x: event.clientX, y: event.clientY };
        
        // For canvas mode (cage unlock), use the template path
        if (this.mode === 'canvas') {
            if (!this.templatePath || this.templatePath.length === 0) return true;
            
            // ENHANCED: Larger tolerance for mobile
            const tolerance = this.isMobile ? this.proximityTolerance * 1.5 : this.proximityTolerance;
            
            for (const point of this.templatePath) {
                const distance = Math.sqrt(Math.pow(mousePos.x - point.x, 2) + Math.pow(mousePos.y - point.y, 2));
                if (distance <= tolerance) {
                    return true;
                }
            }
            return false;
        }
        
        // For raycast mode (3D scenes), check different targets based on phase
        const gameInstance = window.gameInstance;
        if (!gameInstance) return true;
        
        switch (gameInstance.phase) {
            case 'training':
                // Check proximity to rock
                const rock = gameInstance.scenes?.world?.rock;
                if (rock) {
                    // ENHANCED: Larger tolerance for mobile
                    const tolerance = this.isMobile ? this.proximityTolerance * 1.5 : this.proximityTolerance;
                    return rock.isNearRune(
                        mousePos,
                        gameInstance.gameManager.camera,
                        gameInstance.gameManager.renderer,
                        tolerance
                    );
                }
                break;
                
            case 'battle':
                // FIXED: For battle phase, be more permissive - allow drawing if any snakes exist
                const snakeManager = gameInstance.snakeManager;
                if (snakeManager) {
                    const aliveSnakes = snakeManager.getAliveSnakes();
                    console.log(`🐍 Found ${aliveSnakes.length} alive snakes`);
                    
                    if (aliveSnakes.length === 0) {
                        console.log("⚠️ No alive snakes to target");
                        return false;
                    }
                    
                    console.log(`🎯 Battle phase: allowing drawing with ${aliveSnakes.length} snakes available`);
                    return true;
                }
                console.log("⚠️ No snake manager found");
                return true;
                
            default:
                return true;
        }
        
        return true;
    }
    
    // Get template path in screen coordinates for 3D scenes
    getScreenSpaceTemplatePath() {
        const gameInstance = window.gameInstance;
        if (!gameInstance) {
            return this.getFallbackTemplatePath();
        }
        
        switch (gameInstance.phase) {
            case 'training':
                // Use rock's template path
                const rock = gameInstance.scenes?.world?.rock;
                if (rock) {
                    const rockPath = rock.getRuneScreenTemplatePath(
                        gameInstance.gameManager.camera,
                        gameInstance.gameManager.renderer
                    );
                    if (rockPath && rockPath.length > 0) {
                        return rockPath;
                    }
                }
                break;
                
            case 'battle':
                // ENHANCED: Use targeted snake's template path
                if (this.targetedSnake && this.targetedSnake.userData.alive) {
                    const snakeManager = gameInstance.snakeManager;
                    const snakePath = snakeManager.getSnakeRuneTemplatePath(
                        this.targetedSnake,
                        gameInstance.gameManager.camera,
                        gameInstance.gameManager.renderer
                    );
                    if (snakePath && snakePath.length > 0) {
                        console.log(`📐 Using targeted snake template (${snakePath.length} points)`);
                        return snakePath;
                    }
                } else {
                    // Fallback: try to find any snake for template
                    const snakeManager = gameInstance.snakeManager;
                    if (snakeManager) {
                        const aliveSnakes = snakeManager.getAliveSnakes();
                        if (aliveSnakes.length > 0) {
                            const snakePath = snakeManager.getSnakeRuneTemplatePath(
                                aliveSnakes[0],
                                gameInstance.gameManager.camera,
                                gameInstance.gameManager.renderer
                            );
                            if (snakePath && snakePath.length > 0) {
                                console.log(`📐 Using fallback snake template (${snakePath.length} points)`);
                                return snakePath;
                            }
                        }
                    }
                }
                break;
        }
        
        return this.getFallbackTemplatePath();
    }
    
    // Fallback template path for cases where specific targets aren't available
    getFallbackTemplatePath() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const scale = this.isMobile ? 120 : 100; // Larger scale for mobile
        
        return this.standardTemplatePath.map(point => ({
            x: centerX + (point.x - 150) * scale / 150,
            y: centerY + (point.y - 150) * scale / 150
        }));
    }
    
    // Show warning when drawing too far from target
    showProximityWarning() {
        const gameInstance = window.gameInstance;
        let warningMessage = 'Draw closer to the "S" shape!';
        
        if (gameInstance) {
            switch (gameInstance.phase) {
                case 'training':
                    warningMessage = this.isMobile ? 
                        'Get closer to the rock and touch the white "S" rune!' :
                        'Get closer to the rock and trace the white "S" rune!';
                    break;
                case 'battle':
                    const snakeManager = gameInstance.snakeManager;
                    const aliveCount = snakeManager ? snakeManager.getAliveSnakes().length : 0;
                    if (aliveCount > 0) {
                        warningMessage = this.isMobile ?
                            `Touch near a red "S" rune above a serpent to start drawing!` :
                            `Position your cursor near a red "S" rune above a serpent to start drawing!`;
                    } else {
                        warningMessage = 'No serpents remaining to target!';
                    }
                    break;
            }
        }
        
        console.log(`⚠️ Proximity warning: ${warningMessage}`);
        
        const warning = document.createElement('div');
        warning.textContent = warningMessage;
        warning.style.cssText = `
            position: fixed;
            top: 25%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 100, 100, 0.95);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: ${this.isMobile ? '16px' : '18px'};
            font-weight: bold;
            z-index: 1000;
            animation: warningPulse 3s forwards;
            box-shadow: 0 0 30px rgba(255, 100, 100, 0.7);
            border: 3px solid #ff4444;
            text-align: center;
            max-width: ${this.isMobile ? '300px' : '400px'};
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes warningPulse {
                0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
                15% { opacity: 1; transform: translateX(-50%) scale(1); }
                85% { opacity: 1; transform: translateX(-50%) scale(1); }
                100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (document.body.contains(warning)) document.body.removeChild(warning);
            if (document.head.contains(style)) document.head.removeChild(style);
        }, 3000);
    }
    
    // Update real-time accuracy during drawing
    updateRealTimeAccuracy() {
        if (this.drawPath.length < 2) return;
        
        const templatePath = this.mode === 'canvas' ? this.templatePath : this.getScreenSpaceTemplatePath();
        if (!templatePath || templatePath.length === 0) {
            console.log("⚠️ No template path available for accuracy calculation");
            return;
        }
        
        this.realTimeAccuracy = this.calculateOverlapAccuracy(this.drawPath, templatePath);
        
        if (window.gameInstance?.phase !== 'battle') {
            this.displayRealTimeAccuracy();
        }
    }
    
    // Display real-time accuracy feedback (for non-battle phases)
    displayRealTimeAccuracy() {
        let accuracyDisplay = document.getElementById('realTimeAccuracy');
        if (!accuracyDisplay) {
            accuracyDisplay = document.createElement('div');
            accuracyDisplay.id = 'realTimeAccuracy';
            accuracyDisplay.style.cssText = `
                position: fixed;
                bottom: ${this.isMobile ? '220px' : '20%'};
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                font-size: ${this.isMobile ? '18px' : '20px'};
                font-weight: bold;
                z-index: 100;
                border: 2px solid ${this.getAccuracyColor(this.realTimeAccuracy)};
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(accuracyDisplay);
        }
        
        accuracyDisplay.textContent = `Accuracy: ${Math.round(this.realTimeAccuracy * 100)}%`;
        accuracyDisplay.style.borderColor = this.getAccuracyColor(this.realTimeAccuracy);
        accuracyDisplay.style.color = this.getAccuracyColor(this.realTimeAccuracy);
        
        // Add pulsing effect for high accuracy
        if (this.realTimeAccuracy >= 0.75) {
            accuracyDisplay.style.animation = 'accuracyPulse 1s infinite';
        } else {
            accuracyDisplay.style.animation = 'none';
        }
    }
    
    // Get color based on accuracy level
    getAccuracyColor(accuracy) {
        if (accuracy >= 0.75) return '#00FF00'; // Green
        if (accuracy >= 0.50) return '#FFFF00'; // Yellow
        if (accuracy >= 0.25) return '#FF8800'; // Orange
        return '#FF4444'; // Red
    }
    
    // Clear trail after delay
    clearTrailAfterDelay() {
        setTimeout(() => {
            if (this.trailCtx) {
                this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            }
            const accuracyDisplay = document.getElementById('realTimeAccuracy');
            if (accuracyDisplay) {
                accuracyDisplay.remove();
            }
        }, 2500);
    }

    processDrawing() {
        if (this.drawPath.length < 5) {
            console.log("❌ Drawing path too short");
            return;
        }

        if (this.mode === 'canvas') {
            const accuracy = this.calculateOverlapAccuracy(this.drawPath, this.templatePath);
            this.currentAccuracy = accuracy;
            window.dispatchEvent(new CustomEvent('cageSpellAttempt', { detail: { accuracy } }));
        } else { // raycast mode
            const templatePath = this.getScreenSpaceTemplatePath();
            if (!templatePath || templatePath.length === 0) {
                console.log("❌ No template path for accuracy calculation");
                return;
            }
            
            const accuracy = this.calculateOverlapAccuracy(this.drawPath, templatePath);
            this.currentAccuracy = accuracy;
            
            console.log(`✨ Spell cast with ${Math.round(accuracy * 100)}% accuracy`);
            
            // Enhanced event details for battle phase
            const eventDetail = { accuracy };
            if (this.targetedSnake && window.gameInstance?.phase === 'battle') {
                eventDetail.targetedSnake = this.targetedSnake;
                eventDetail.targetedSnakeId = this.targetedSnake.userData.id;
                eventDetail.drawPath = this.drawPath;
                eventDetail.templatePath = templatePath;
            }
            
            window.dispatchEvent(new CustomEvent('spellCast', { detail: eventDetail }));
        }
    }

    setTemplatePath(path) {
        this.templatePath = path;
    }
    
    clear() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.trailCtx) {
            this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        }
    }
    
    // Create standard template path using the same S-shape as all scenes
    createStandardTemplatePath() {
        const path = [];
        // Create the same S-shape template as the popup and rock
        
        // First curve: Top part of S (220,60 to 120,100)
        for(let t = 0; t <= 1; t += 0.02) {
            const x = Math.pow(1-t, 3) * 220 + 3*Math.pow(1-t, 2)*t * 180 + 3*(1-t)*Math.pow(t, 2) * 120 + Math.pow(t, 3) * 120;
            const y = Math.pow(1-t, 3) * 60 + 3*Math.pow(1-t, 2)*t * 60 + 3*(1-t)*Math.pow(t, 2) * 60 + Math.pow(t, 3) * 100;
            path.push({x: x, y: y});
        }
        
        // Second curve: Middle part of S (120,100 to 180,180)  
        for(let t = 0; t <= 1; t += 0.02) {
            const x = Math.pow(1-t, 3) * 120 + 3*Math.pow(1-t, 2)*t * 120 + 3*(1-t)*Math.pow(t, 2) * 180 + Math.pow(t, 3) * 180;
            const y = Math.pow(1-t, 3) * 100 + 3*Math.pow(1-t, 2)*t * 140 + 3*(1-t)*Math.pow(t, 2) * 140 + Math.pow(t, 3) * 180;
            path.push({x: x, y: y});
        }
        
        // Third curve: Bottom part of S (180,180 to 80,220)
        for(let t = 0; t <= 1; t += 0.02) {
            const x = Math.pow(1-t, 3) * 180 + 3*Math.pow(1-t, 2)*t * 180 + 3*(1-t)*Math.pow(t, 2) * 120 + Math.pow(t, 3) * 80;
            const y = Math.pow(1-t, 3) * 180 + 3*Math.pow(1-t, 2)*t * 220 + 3*(1-t)*Math.pow(t, 2) * 220 + Math.pow(t, 3) * 220;
            path.push({x: x, y: y});
        }
        
        return path;
    }

    // Calculate accuracy based on both line overlap AND template coverage
    calculateOverlapAccuracy(drawnPath, templatePath) {
        if (!templatePath || templatePath.length === 0 || drawnPath.length === 0) {
            console.log("❌ Invalid paths for accuracy calculation");
            return 0;
        }
        
        // ENHANCED: Adjust tolerance for mobile devices
        const tolerance = this.isMobile ? this.overlapTolerance * 1.2 : this.overlapTolerance;
        
        // 1. Calculate what percentage of drawn points overlap with template
        let overlappingDrawnPoints = 0;
        const totalDrawnPoints = drawnPath.length;
        
        for (const drawnPoint of drawnPath) {
            let isOverlapping = false;
            
            for (const templatePoint of templatePath) {
                const distance = Math.sqrt(
                    Math.pow(drawnPoint.x - templatePoint.x, 2) + 
                    Math.pow(drawnPoint.y - templatePoint.y, 2)
                );
                
                if (distance <= tolerance) {
                    isOverlapping = true;
                    break;
                }
            }
            
            if (isOverlapping) {
                overlappingDrawnPoints++;
            }
        }
        
        // 2. Calculate what percentage of template path has been covered by drawing
        let coveredTemplatePoints = 0;
        const totalTemplatePoints = templatePath.length;
        
        for (const templatePoint of templatePath) {
            let isCovered = false;
            
            for (const drawnPoint of drawnPath) {
                const distance = Math.sqrt(
                    Math.pow(drawnPoint.x - templatePoint.x, 2) + 
                    Math.pow(drawnPoint.y - templatePoint.y, 2)
                );
                
                if (distance <= tolerance) {
                    isCovered = true;
                    break;
                }
            }
            
            if (isCovered) {
                coveredTemplatePoints++;
            }
        }
        
        // 3. Calculate both metrics
        const drawingAccuracy = overlappingDrawnPoints / totalDrawnPoints;
        const templateCoverage = coveredTemplatePoints / totalTemplatePoints;
        
        // 4. Require BOTH good accuracy AND good coverage
        const finalAccuracy = Math.min(drawingAccuracy, templateCoverage);
        
        // 5. Additional penalty if coverage is too low (slightly more lenient for mobile)
        const coverageThreshold = this.isMobile ? 0.45 : 0.5;
        if (templateCoverage < coverageThreshold) {
            return finalAccuracy * 0.5;
        }
        
        console.log(`📊 Accuracy: ${Math.round(finalAccuracy * 100)}% (Drawing: ${Math.round(drawingAccuracy * 100)}%, Coverage: ${Math.round(templateCoverage * 100)}%)`);
        
        return finalAccuracy;
    }

    destroy() {
        const eventTarget = this.canvas || this.gameManager.renderer.domElement;
        
        // Remove all event listeners
        if (this.isTouch) {
            eventTarget.removeEventListener('touchstart', this.onTouchStart);
            eventTarget.removeEventListener('touchmove', this.onTouchMove);
            eventTarget.removeEventListener('touchend', this.onTouchEnd);
            eventTarget.removeEventListener('touchcancel', this.onTouchEnd);
        } else {
            eventTarget.removeEventListener('mousedown', this.onMouseDown);
            eventTarget.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('mouseup', this.onMouseUp);
            
            if (this.mode === 'raycast') {
                this.gameManager.renderer.domElement.removeEventListener('click', this.onClick);
            }
        }
        
        window.removeEventListener('resize', this.handleResize);
        
        // Clean up trail canvas
        if (this.trailCanvas && document.body.contains(this.trailCanvas)) {
            document.body.removeChild(this.trailCanvas);
        }
        
        // Clean up battle UI elements
        if (this.targetingIndicator && document.body.contains(this.targetingIndicator)) {
            document.body.removeChild(this.targetingIndicator);
        }
        if (this.accuracyIndicator && document.body.contains(this.accuracyIndicator)) {
            document.body.removeChild(this.accuracyIndicator);
        }
        
        // Clean up real-time accuracy display
        const accuracyDisplay = document.getElementById('realTimeAccuracy');
        if (accuracyDisplay) {
            accuracyDisplay.remove();
        }
        
        // Reset targeted snake
        this.targetedSnake = null;
    }
}