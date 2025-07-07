// js/MobileControls.js - Enhanced Mobile Controls with Analog Speed Control

export class MobileControls {
    constructor(characterController) {
        this.characterController = characterController;
        this.joystick = null;
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isTouch = 'ontouchstart' in window;
        
        // Enhanced touch state tracking with analog values
        this.touchState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // NEW: Analog movement values (0.0 to 1.0)
        this.analogInput = {
            x: 0.0,  // -1.0 (full left) to 1.0 (full right)
            y: 0.0,  // -1.0 (full back) to 1.0 (full forward)
            intensity: 0.0  // 0.0 (no input) to 1.0 (max input)
        };
        
        // Mobile-specific speed settings (multipliers for base speeds)
        this.mobileSpeedSettings = {
            // Reduced speed multipliers for smoother mobile experience
            phone: {
                moveSpeedMultiplier: 0.6,      // 60% of desktop speed
                turnSpeedMultiplier: 0.7,      // 70% of desktop turn speed
                deadZoneThreshold: 0.15,       // Larger dead zone for touch accuracy
                maxInputThreshold: 0.85        // Don't require full joystick extension
            },
            tablet: {
                moveSpeedMultiplier: 0.75,     // 75% of desktop speed
                turnSpeedMultiplier: 0.8,      // 80% of desktop turn speed
                deadZoneThreshold: 0.12,       // Medium dead zone
                maxInputThreshold: 0.9         // Nearly full joystick extension
            },
            desktop: {
                moveSpeedMultiplier: 1.0,      // Full desktop speed
                turnSpeedMultiplier: 1.0,      // Full desktop turn speed
                deadZoneThreshold: 0.0,        // No dead zone needed
                maxInputThreshold: 1.0         // Full input range
            }
        };
        
        // Get current device settings
        this.currentSpeedSettings = this.mobileSpeedSettings[this.getDeviceType()];
        
        // Joystick configuration with enhanced sensitivity
        this.joystickConfig = {
            zone: null,
            mode: 'static',
            position: { left: '80px', bottom: '80px' },
            color: '#ffd700',
            size: this.getJoystickSize(),
            threshold: 0.05,                   // Very small threshold for immediate response
            fadeTime: 300,                     // Faster fade for responsiveness
            multitouch: false,
            maxNumberOfNipples: 1,
            dataOnly: false,
            restJoystick: true,
            restOpacity: 0.4,
            lockX: false,
            lockY: false
        };
        
        this.init();
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
               /mobile|tablet|touch|phone/i.test(userAgent.toLowerCase()) ||
               window.innerWidth <= 768;
    }
    
    detectTablet() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /ipad|android|tablet/i.test(userAgent.toLowerCase()) ||
               (window.innerWidth > 768 && window.innerWidth <= 1024 && this.isTouch);
    }
    
    getDeviceType() {
        if (this.isMobile && window.innerWidth <= 480) return 'phone';
        if (this.isMobile || this.isTablet) return 'tablet';
        return 'desktop';
    }
    
    getJoystickSize() {
        const deviceType = this.getDeviceType();
        switch (deviceType) {
            case 'phone': return 100;      // Smaller for phones
            case 'tablet': return 140;     // Medium for tablets
            default: return 120;           // Default size
        }
    }
    
    init() {
        console.log(`📱 Device detected: ${this.getDeviceType()}, Touch: ${this.isTouch}`);
        console.log(`📱 Speed settings:`, this.currentSpeedSettings);
        
        if (this.isMobile || this.isTablet) {
            this.createMobileUI();
            this.initializeJoystick();
            this.setupTouchEvents();
            this.updateUIForMobile();
            this.applyMobileSpeedSettings();
        }
        
        this.createFullscreenButton();
        this.setupOrientationHandling();
    }
    
    // NEW: Apply mobile-specific speed multipliers to character controller
    applyMobileSpeedSettings() {
        if (!this.characterController || !this.characterController.movementSettings) return;
        
        const settings = this.currentSpeedSettings;
        const phases = ['chamber', 'practice', 'battle'];
        
        phases.forEach(phase => {
            if (this.characterController.movementSettings[phase]) {
                // Apply mobile speed multipliers to max speeds
                this.characterController.movementSettings[phase].maxMoveSpeed *= settings.moveSpeedMultiplier;
                this.characterController.movementSettings[phase].maxTurnSpeed *= settings.turnSpeedMultiplier;
                
                console.log(`📱 Applied mobile speed settings to ${phase}: 
                    Move: ${this.characterController.movementSettings[phase].maxMoveSpeed.toFixed(1)}, 
                    Turn: ${this.characterController.movementSettings[phase].maxTurnSpeed.toFixed(1)}`);
            }
        });
    }
    
    createMobileUI() {
        // Create joystick container with device-appropriate sizing
        const joystickZone = document.createElement('div');
        joystickZone.id = 'joystick-zone';
        const size = this.getJoystickSize() + 40; // Extra space for container
        
        joystickZone.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 215, 0, 0.5);
            z-index: 1000;
            backdrop-filter: blur(5px);
            display: ${this.isMobile || this.isTablet ? 'block' : 'none'};
        `;
        
        document.body.appendChild(joystickZone);
        this.joystickConfig.zone = joystickZone;
        
        this.showMobileInstructions();
    }
    
    showMobileInstructions() {
        // Create mobile-specific instructions
        const mobileInstructions = document.createElement('div');
        mobileInstructions.id = 'mobile-instructions';
        mobileInstructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ffd700;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            z-index: 2000;
            max-width: 300px;
            font-size: 16px;
            line-height: 1.4;
            border: 2px solid #ffd700;
        `;
        
        const deviceType = this.getDeviceType();
        mobileInstructions.innerHTML = `
            <h3 style="margin-top: 0; color: #ffd700;">📱 ${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Controls</h3>
            <p>🕹️ Use the <strong>virtual joystick</strong> (bottom-left) to move around</p>
            <p>✏️ <strong>Touch and drag</strong> on the screen to draw S-shapes</p>
            <p>📺 Tap the <strong>fullscreen button</strong> (top-right) for best experience</p>
            <p style="margin-bottom: 0; font-size: 14px; opacity: 0.8;">Tap anywhere to continue...</p>
        `;
        
        document.body.appendChild(mobileInstructions);
        
        // Hide instructions on first touch/click
        const hideInstructions = () => {
            mobileInstructions.style.display = 'none';
            document.removeEventListener('touchstart', hideInstructions);
            document.removeEventListener('click', hideInstructions);
        };
        
        setTimeout(() => {
            document.addEventListener('touchstart', hideInstructions);
            document.addEventListener('click', hideInstructions);
        }, 1000);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (mobileInstructions.style.display !== 'none') {
                hideInstructions();
            }
        }, 8000);
    }
    
    initializeJoystick() {
        if (!window.nipplejs) {
            console.warn('📱 nipplejs not loaded, loading from CDN...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js';
            script.onload = () => this.createJoystick();
            document.head.appendChild(script);
        } else {
            this.createJoystick();
        }
    }
    
    createJoystick() {
        if (!window.nipplejs || this.joystick) return;
        
        try {
            this.joystick = window.nipplejs.create(this.joystickConfig);
            
            this.joystick.on('start', (evt, data) => {
                console.log('🕹️ Joystick activated');
            });
            
            this.joystick.on('move', (evt, data) => {
                this.handleJoystickMove(data);
            });
            
            this.joystick.on('end', (evt, data) => {
                this.handleJoystickEnd();
            });
            
            console.log('🕹️ Enhanced joystick initialized successfully');
            
        } catch (error) {
            console.error('🕹️ Failed to initialize joystick:', error);
        }
    }
    
    // NEW: Enhanced joystick movement handling with analog input
    handleJoystickMove(data) {
        if (!data.vector) return;
        
        const settings = this.currentSpeedSettings;
        const deadZone = settings.deadZoneThreshold;
        const maxThreshold = settings.maxInputThreshold;
        
        // Get normalized joystick input (-1.0 to 1.0)
        let x = data.vector.x;
        let y = data.vector.y;
        
        // Calculate distance from center (0.0 to 1.0)
        const distance = Math.min(1.0, data.distance / 50); // Normalize nipplejs distance
        
        // Apply dead zone
        if (distance < deadZone) {
            this.analogInput = { x: 0, y: 0, intensity: 0 };
            this.touchState = { forward: false, backward: false, left: false, right: false };
            this.characterController.setInputState(this.touchState);
            return;
        }
        
        // Scale input based on distance, removing dead zone and capping at maxThreshold
        const scaledDistance = Math.min(1.0, (distance - deadZone) / (maxThreshold - deadZone));
        
        // Apply scaling to input vectors
        x *= scaledDistance;
        y *= scaledDistance;
        
        // Store analog input values
        this.analogInput = {
            x: x,
            y: y,
            intensity: scaledDistance
        };
        
        // Convert to binary input for character controller (with intensity consideration)
        const binaryThreshold = 0.1; // Very small threshold for direction detection
        
        this.touchState = {
            forward: y > binaryThreshold,
            backward: y < -binaryThreshold,
            left: x < -binaryThreshold,
            right: x > binaryThreshold
        };
        
        // NEW: Modify character controller speeds based on analog intensity
        this.applyAnalogSpeedModification();
        
        // Update character controller
        this.characterController.setInputState(this.touchState);
        
        // Visual feedback
        this.updateJoystickVisuals(data, scaledDistance);
    }
    
    // NEW: Apply analog speed modification to character controller
    applyAnalogSpeedModification() {
        if (!this.characterController.currentSettings) return;
        
        const intensity = this.analogInput.intensity;
        const baseSettings = this.characterController.movementSettings[this.characterController.currentPhase];
        
        // Temporarily modify the current settings based on analog input intensity
        // This creates progressive speed control based on how far the joystick is pushed
        const intensityMultiplier = 0.3 + (intensity * 0.7); // 30% to 100% of max speed
        
        this.characterController.currentSettings.maxMoveSpeed = baseSettings.maxMoveSpeed * intensityMultiplier;
        this.characterController.currentSettings.maxTurnSpeed = baseSettings.maxTurnSpeed * intensityMultiplier;
    }
    
    handleJoystickEnd() {
        // Reset all input
        this.analogInput = { x: 0, y: 0, intensity: 0 };
        this.touchState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // Restore original speeds
        if (this.characterController.currentSettings && this.characterController.movementSettings) {
            const baseSettings = this.characterController.movementSettings[this.characterController.currentPhase];
            this.characterController.currentSettings.maxMoveSpeed = baseSettings.maxMoveSpeed;
            this.characterController.currentSettings.maxTurnSpeed = baseSettings.maxTurnSpeed;
        }
        
        this.characterController.setInputState(this.touchState);
        console.log('🕹️ Joystick released - input reset');
    }
    
    updateJoystickVisuals(data, intensity) {
        const zone = document.getElementById('joystick-zone');
        if (!zone) return;
        
        // Update joystick zone appearance based on intensity
        const opacity = Math.min(0.8, 0.3 + intensity * 0.5);
        zone.style.background = `rgba(255, 215, 0, ${opacity})`;
        
        // Add directional indicators with intensity-based coloring
        const direction = data.angle ? (data.angle.degree + 90) % 360 : 0;
        const saturation = 50 + (intensity * 30); // 50% to 80% saturation
        zone.style.borderColor = `hsl(${direction}, ${saturation}%, 60%)`;
        
        // Add border thickness based on intensity
        const borderWidth = 2 + (intensity * 3); // 2px to 5px border
        zone.style.borderWidth = `${borderWidth}px`;
    }
    
    setupTouchEvents() {
        // Prevent default touch behaviors that interfere with game
        document.addEventListener('touchstart', (e) => {
            // Allow drawing area touches
            const target = e.target;
            if (target.tagName === 'CANVAS' || target.id === 'drawingTrail') {
                return;
            }
            
            // Prevent default for UI elements
            if (target.closest('#joystick-zone') || 
                target.closest('.popup') || 
                target.closest('#ui')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            // Allow drawing gestures
            const target = e.target;
            if (target.tagName === 'CANVAS' || target.id === 'drawingTrail') {
                return;
            }
            e.preventDefault();
        }, { passive: false });
    }
    
    updateUIForMobile() {
        document.body.classList.add('mobile-device');
        console.log('📱 Mobile UI styling applied');
    }
    
    createFullscreenButton() {
        if (document.getElementById('fullscreen-btn')) return;
        
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.title = 'Toggle Fullscreen';
        
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                fullscreenBtn.innerHTML = '✕';
            } else {
                document.exitFullscreen();
                fullscreenBtn.innerHTML = '⛶';
            }
        });
        
        document.body.appendChild(fullscreenBtn);
    }
    
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                console.log('📱 Orientation changed, updating UI...');
                // Refresh joystick config if needed
                if (this.joystick) {
                    this.joystick.destroy();
                    setTimeout(() => this.createJoystick(), 100);
                }
            }, 500);
        });
    }
    
    // Debug method to get current input state
    getInputInfo() {
        return {
            deviceType: this.getDeviceType(),
            analogInput: this.analogInput,
            touchState: this.touchState,
            speedSettings: this.currentSpeedSettings,
            joystickConfig: this.joystickConfig
        };
    }
    
    // Method to adjust mobile speed settings during runtime
    adjustMobileSpeeds(moveMultiplier = 1.0, turnMultiplier = 1.0) {
        this.currentSpeedSettings.moveSpeedMultiplier *= moveMultiplier;
        this.currentSpeedSettings.turnSpeedMultiplier *= turnMultiplier;
        
        // Re-apply settings
        this.applyMobileSpeedSettings();
        
        console.log(`📱 Mobile speeds adjusted: Move x${moveMultiplier}, Turn x${turnMultiplier}`);
        console.log(`📱 New settings:`, this.currentSpeedSettings);
    }
}
