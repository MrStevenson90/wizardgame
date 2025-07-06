// js/MobileControls.js - Mobile and Tablet Control System
export class MobileControls {
    constructor(characterController) {
        this.characterController = characterController;
        this.joystick = null;
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isTouch = 'ontouchstart' in window;
        
        // Touch state tracking
        this.touchState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // Joystick configuration
        this.joystickConfig = {
            zone: null,
            mode: 'static',
            position: { left: '80px', bottom: '80px' },
            color: '#ffd700',
            size: 120,
            threshold: 0.1,
            fadeTime: 500,
            multitouch: false,
            maxNumberOfNipples: 1,
            dataOnly: false,
            restJoystick: true,
            restOpacity: 0.5,
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
    
    init() {
        console.log(`📱 Device detected: ${this.getDeviceType()}, Touch: ${this.isTouch}`);
        
        if (this.isMobile || this.isTablet) {
            this.createMobileUI();
            this.initializeJoystick();
            this.setupTouchEvents();
            this.updateUIForMobile();
        }
        
        this.createFullscreenButton();
        this.setupOrientationHandling();
    }
    
    createMobileUI() {
        // Create joystick container
        const joystickZone = document.createElement('div');
        joystickZone.id = 'joystick-zone';
        joystickZone.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 215, 0, 0.5);
            z-index: 1000;
            backdrop-filter: blur(5px);
            display: ${this.isMobile || this.isTablet ? 'block' : 'none'};
        `;
        document.body.appendChild(joystickZone);
        this.joystickConfig.zone = joystickZone;
        
        // Create mobile instruction overlay
        const mobileInstructions = document.createElement('div');
        mobileInstructions.id = 'mobile-instructions';
        mobileInstructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            border: 2px solid #ffd700;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
            z-index: 2000;
            text-align: center;
            max-width: 300px;
            backdrop-filter: blur(10px);
            font-family: Arial, sans-serif;
        `;
        mobileInstructions.innerHTML = `
            <h3 style="color: #ffd700; margin-bottom: 15px;">Mobile Controls</h3>
            <p style="margin-bottom: 10px;">🕹️ Use joystick to move around</p>
            <p style="margin-bottom: 10px;">✏️ Touch and drag to trace 'S' shapes</p>
            <p style="margin-bottom: 15px;">📱 Tap anywhere to continue</p>
            <div style="font-size: 12px; color: #cccccc;">For best experience, use fullscreen mode</div>
        `;
        
        document.body.appendChild(mobileInstructions);
        
        // Hide instructions on any touch
        const hideInstructions = () => {
            mobileInstructions.style.display = 'none';
            document.removeEventListener('touchstart', hideInstructions);
            document.removeEventListener('click', hideInstructions);
        };
        
        setTimeout(() => {
            document.addEventListener('touchstart', hideInstructions);
            document.addEventListener('click', hideInstructions);
        }, 1000);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (mobileInstructions.style.display !== 'none') {
                hideInstructions();
            }
        }, 5000);
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
                if (!data.vector) return;
                
                // Convert joystick vector to movement state
                const threshold = 0.3;
                const x = data.vector.x;
                const y = data.vector.y;
                
                // Reset all directions
                this.touchState = {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false
                };
                
                // Set directions based on joystick position
                if (Math.abs(y) > threshold) {
                    if (y > 0) this.touchState.forward = true;
                    if (y < 0) this.touchState.backward = true;
                }
                
                if (Math.abs(x) > threshold) {
                    if (x > 0) this.touchState.right = true;
                    if (x < 0) this.touchState.left = true;
                }
                
                // Update character controller
                this.characterController.setInputState(this.touchState);
                
                // Visual feedback
                this.updateJoystickVisuals(data);
            });
            
            this.joystick.on('end', (evt, data) => {
                // Stop all movement
                this.touchState = {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false
                };
                this.characterController.setInputState(this.touchState);
                console.log('🕹️ Joystick released');
            });
            
            console.log('🕹️ Joystick initialized successfully');
            
        } catch (error) {
            console.error('🕹️ Failed to initialize joystick:', error);
        }
    }
    
    updateJoystickVisuals(data) {
        const zone = document.getElementById('joystick-zone');
        if (!zone) return;
        
        // Update joystick zone appearance based on intensity
        const intensity = data.distance / 50; // Normalize distance
        const opacity = Math.min(0.8, 0.3 + intensity * 0.5);
        zone.style.background = `rgba(255, 215, 0, ${opacity})`;
        
        // Add directional indicators
        const direction = data.angle ? (data.angle.degree + 90) % 360 : 0;
        zone.style.borderColor = `hsl(${direction}, 70%, 60%)`;
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
        
        // Prevent zoom gestures
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
    }
    
    setupOrientationHandling() {
        const handleOrientationChange = () => {
            setTimeout(() => {
                const isLandscape = window.innerWidth > window.innerHeight;
                this.updateLayoutForOrientation(isLandscape);
            }, 500); // Delay to allow orientation change to complete
        };
        
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        // Initial layout
        handleOrientationChange();
    }
    
    updateLayoutForOrientation(isLandscape) {
        const joystickZone = document.getElementById('joystick-zone');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        
        if (this.isMobile) {
            if (isLandscape) {
                // Landscape layout adjustments
                if (joystickZone) {
                    joystickZone.style.left = '30px';
                    joystickZone.style.bottom = '30px';
                    joystickZone.style.width = '140px';
                    joystickZone.style.height = '140px';
                }
                if (fullscreenBtn) {
                    fullscreenBtn.style.top = '15px';
                    fullscreenBtn.style.right = '15px';
                }
            } else {
                // Portrait layout adjustments
                if (joystickZone) {
                    joystickZone.style.left = '20px';
                    joystickZone.style.bottom = '20px';
                    joystickZone.style.width = '160px';
                    joystickZone.style.height = '160px';
                }
                if (fullscreenBtn) {
                    fullscreenBtn.style.top = '20px';
                    fullscreenBtn.style.right = '20px';
                }
            }
        }
        
        console.log(`📱 Layout updated for ${isLandscape ? 'landscape' : 'portrait'} orientation`);
    }
    
    createFullscreenButton() {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(40, 40, 40, 0.9));
            color: #ffd700;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 215, 0, 0.6);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        
        fullscreenBtn.addEventListener('click', this.toggleFullscreen.bind(this));
        fullscreenBtn.addEventListener('touchstart', (e) => e.stopPropagation());
        
        // Hover effect for non-touch devices
        if (!this.isTouch) {
            fullscreenBtn.addEventListener('mouseenter', () => {
                fullscreenBtn.style.transform = 'scale(1.1)';
                fullscreenBtn.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
            });
            
            fullscreenBtn.addEventListener('mouseleave', () => {
                fullscreenBtn.style.transform = 'scale(1)';
                fullscreenBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
            });
        }
        
        document.body.appendChild(fullscreenBtn);
        
        // Update fullscreen button state
        document.addEventListener('fullscreenchange', this.updateFullscreenButton.bind(this));
        document.addEventListener('webkitfullscreenchange', this.updateFullscreenButton.bind(this));
        document.addEventListener('mozfullscreenchange', this.updateFullscreenButton.bind(this));
        document.addEventListener('MSFullscreenChange', this.updateFullscreenButton.bind(this));
    }
    
    toggleFullscreen() {
        const elem = document.documentElement;
        
        if (!this.isFullscreen()) {
            // Enter fullscreen
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
            console.log('📱 Entering fullscreen mode');
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            console.log('📱 Exiting fullscreen mode');
        }
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }
    
    updateFullscreenButton() {
        const btn = document.getElementById('fullscreen-btn');
        if (btn) {
            btn.innerHTML = this.isFullscreen() ? '⛷' : '⛶';
            btn.title = this.isFullscreen() ? 'Exit Fullscreen' : 'Enter Fullscreen';
        }
    }
    
    updateUIForMobile() {
        // Adjust UI elements for mobile
        const ui = document.getElementById('ui');
        if (ui && this.isMobile) {
            ui.style.fontSize = '14px';
            ui.style.top = '10px';
            ui.style.left = '10px';
        }
        
        // Hide joystick on desktop
        const joystickZone = document.getElementById('joystick-zone');
        if (joystickZone) {
            joystickZone.style.display = (this.isMobile || this.isTablet) ? 'block' : 'none';
        }
        
        // Adjust help button position for mobile
        const helpButton = document.getElementById('helpButton');
        if (helpButton && this.isMobile) {
            helpButton.style.top = '70px'; // Move below fullscreen button
            helpButton.style.width = '40px';
            helpButton.style.height = '40px';
            helpButton.style.fontSize = '20px';
        }
    }
    
    // Method to check if device should use touch controls
    shouldUseTouchControls() {
        return this.isMobile || this.isTablet || this.isTouch;
    }
    
    // Method to get appropriate control instructions
    getControlInstructions(phase) {
        if (this.shouldUseTouchControls()) {
            switch(phase) {
                case 'exploration':
                    return "Use the joystick to move around and find your mentor.";
                case 'training':
                    return "Touch and drag to trace the 'S' shape on the rock. Need 5 perfect spells.";
                case 'battle':
                    return "Touch and drag to trace red 'S' runes above serpents to defeat them!";
                default:
                    return "Use joystick to move, touch to trace 'S' shapes.";
            }
        } else {
            // Return original desktop instructions
            switch(phase) {
                case 'exploration':
                    return "Find your mentor. Use WASD or arrow keys to move and turn.";
                case 'training':
                    return "Practice tracing 'S' shapes on the rock. Need 5 perfect spells.";
                case 'battle':
                    return "Battle: Defeat serpents by tracing their red 'S' runes!";
                default:
                    return "Use WASD to move, mouse to trace 'S' shapes.";
            }
        }
    }
    
    destroy() {
        if (this.joystick) {
            this.joystick.destroy();
        }
        
        const elementsToRemove = ['joystick-zone', 'mobile-instructions', 'fullscreen-btn'];
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }
}