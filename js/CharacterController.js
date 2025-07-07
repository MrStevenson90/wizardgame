// js/CharacterController.js - Enhanced with smooth movement and speed limits

export class CharacterController {
    constructor(player) {
        this.player = player;
        
        this.inputState = { forward: false, backward: false, left: false, right: false };
        
        // Enhanced movement settings with acceleration and max speeds
        this.movementSettings = {
            chamber: { 
                maxMoveSpeed: 200.0,        // Reduced from 294 for smoother exploration
                maxTurnSpeed: 15.0,         // Reduced from 23.52 for smoother turning
                acceleration: 800.0,        // Speed of acceleration
                deceleration: 1200.0,       // Speed of deceleration (faster than acceleration)
                turnAcceleration: 60.0,     // Turn acceleration
                turnDeceleration: 80.0,     // Turn deceleration (faster than acceleration)
                bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }
            },
            practice: { 
                maxMoveSpeed: 400.0,        // Reduced from 600 for better control
                maxTurnSpeed: 30.0,         // Reduced from 48 for smoother turning
                acceleration: 1000.0,
                deceleration: 1400.0,
                turnAcceleration: 120.0,
                turnDeceleration: 160.0,
                bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }
            },
            battle: { 
                maxMoveSpeed: 450.0,        // Slightly faster than practice but still controlled
                maxTurnSpeed: 35.0,         // Faster turning for combat but still smooth
                acceleration: 1200.0,       // Faster acceleration for combat responsiveness
                deceleration: 1600.0,
                turnAcceleration: 140.0,
                turnDeceleration: 180.0,
                bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }
            }
        };
        
        // Current velocity and turn velocity (for smooth movement)
        this.currentMoveSpeed = 0.0;
        this.currentTurnSpeed = 0.0;
        
        // Track current phase for movement direction handling
        this.currentPhase = 'chamber';
        this.currentSettings = this.movementSettings.chamber;
        this.currentRotation = 0;
        
        // Optional: Velocity smoothing factor (0.0 = no smoothing, 1.0 = maximum smoothing)
        this.velocitySmoothing = 0.15;  // Slight smoothing for extra polish
    }

    setPhase(phase) {
        if (this.movementSettings[phase]) {
            this.currentPhase = phase;
            this.currentSettings = this.movementSettings[phase];
            console.log(`🎮 Character controller set to phase: ${phase} (Max Speed: ${this.currentSettings.maxMoveSpeed}, Max Turn: ${this.currentSettings.maxTurnSpeed})`);
        }
    }

    setInputState(inputKeys) {
        this.inputState = { ...inputKeys };
    }

    update(deltaTime, rock) {
        this.updateRotationWithLimits(deltaTime);
        this.updateMovementWithLimits(deltaTime, rock);
    }

    updateRotationWithLimits(deltaTime) {
        const settings = this.currentSettings;
        let targetTurnSpeed = 0;
        
        // Determine target turn speed based on input
        if (this.inputState.left) targetTurnSpeed += settings.maxTurnSpeed;
        if (this.inputState.right) targetTurnSpeed -= settings.maxTurnSpeed;
        
        // Smoothly accelerate/decelerate turn speed
        if (targetTurnSpeed !== 0) {
            // Accelerating towards target speed
            const acceleration = settings.turnAcceleration * deltaTime;
            if (Math.abs(this.currentTurnSpeed) < Math.abs(targetTurnSpeed)) {
                this.currentTurnSpeed = this.moveTowards(this.currentTurnSpeed, targetTurnSpeed, acceleration);
            }
        } else {
            // Decelerating to stop
            const deceleration = settings.turnDeceleration * deltaTime;
            this.currentTurnSpeed = this.moveTowards(this.currentTurnSpeed, 0, deceleration);
        }
        
        // Apply velocity smoothing (optional, for extra polish)
        if (this.velocitySmoothing > 0) {
            this.currentTurnSpeed = this.lerp(this.currentTurnSpeed, targetTurnSpeed, this.velocitySmoothing);
        }
        
        // Apply rotation if there's any turn speed
        if (Math.abs(this.currentTurnSpeed) > 0.01) {
            this.currentRotation += this.currentTurnSpeed * deltaTime;
            this.player.rotation.y = this.currentRotation;
        }
    }

    updateMovementWithLimits(deltaTime, rock) {
        const settings = this.currentSettings;
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        // Check if we're in first-person mode (practice or battle phases)
        const isFirstPerson = (this.currentPhase === 'practice' || this.currentPhase === 'battle');
        
        // Calculate target movement direction
        if (isFirstPerson) {
            // FIRST-PERSON: Invert Z direction for natural feel
            if (this.inputState.forward) moveDirection.z -= 1;   // Forward (negative Z)
            if (this.inputState.backward) moveDirection.z += 1;  // Backward (positive Z)
        } else {
            // THIRD-PERSON: Standard movement directions
            if (this.inputState.forward) moveDirection.z += 1;   // Forward
            if (this.inputState.backward) moveDirection.z -= 1;  // Backward
        }
        
        // Normalize direction and calculate target speed
        let targetMoveSpeed = 0;
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            targetMoveSpeed = settings.maxMoveSpeed;
        }
        
        // Smoothly accelerate/decelerate movement speed
        if (targetMoveSpeed > 0) {
            // Accelerating towards max speed
            const acceleration = settings.acceleration * deltaTime;
            this.currentMoveSpeed = this.moveTowards(this.currentMoveSpeed, targetMoveSpeed, acceleration);
        } else {
            // Decelerating to stop
            const deceleration = settings.deceleration * deltaTime;
            this.currentMoveSpeed = this.moveTowards(this.currentMoveSpeed, 0, deceleration);
        }
        
        // Apply velocity smoothing (optional, for extra polish)
        if (this.velocitySmoothing > 0 && targetMoveSpeed > 0) {
            this.currentMoveSpeed = this.lerp(this.currentMoveSpeed, targetMoveSpeed, this.velocitySmoothing);
        }
        
        // Apply movement if there's any speed
        if (this.currentMoveSpeed > 0.01 && moveDirection.length() > 0) {
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);
            
            const movement = moveDirection.multiplyScalar(this.currentMoveSpeed * deltaTime);
            const nextPosition = this.player.position.clone().add(movement);

            // Rock collision detection
            if (rock && rock.boundingBox && rock.boundingBox.containsPoint(nextPosition)) {
                // Stop movement on collision
                this.currentMoveSpeed = 0;
                return;
            }

            this.player.position.copy(nextPosition);

            // Apply boundary constraints
            const bounds = settings.bounds;
            this.player.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.position.x));
            this.player.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.player.position.z));
        }
    }

    // Helper function to move a value towards a target at a given rate
    moveTowards(current, target, rate) {
        if (Math.abs(target - current) <= rate) {
            return target;
        }
        return current + Math.sign(target - current) * rate;
    }
    
    // Helper function for linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    stop() {
        this.inputState.forward = this.inputState.backward = this.inputState.left = this.inputState.right = false;
        // Optionally, you can force immediate stop:
        // this.currentMoveSpeed = 0;
        // this.currentTurnSpeed = 0;
    }
    
    // Get current movement info for debugging
    getMovementInfo() {
        return {
            phase: this.currentPhase,
            isFirstPerson: (this.currentPhase === 'practice' || this.currentPhase === 'battle'),
            inputState: { ...this.inputState },
            rotation: this.currentRotation,
            position: this.player.position.clone(),
            currentMoveSpeed: this.currentMoveSpeed,
            currentTurnSpeed: this.currentTurnSpeed,
            maxMoveSpeed: this.currentSettings.maxMoveSpeed,
            maxTurnSpeed: this.currentSettings.maxTurnSpeed
        };
    }
    
    // Set position directly (useful for teleporting between phases)
    setPosition(x, y, z) {
        this.player.position.set(x, y, z);
        // Reset velocities when teleporting
        this.currentMoveSpeed = 0;
        this.currentTurnSpeed = 0;
    }
    
    // Set rotation directly
    setRotation(rotation) {
        this.currentRotation = rotation;
        this.player.rotation.y = this.currentRotation;
        this.currentTurnSpeed = 0; // Reset turn velocity
    }

    // Optional: Adjust smoothing factor during runtime
    setVelocitySmoothing(smoothing) {
        this.velocitySmoothing = Math.max(0, Math.min(1, smoothing));
        console.log(`🎮 Velocity smoothing set to: ${this.velocitySmoothing}`);
    }

    // Optional: Quick settings adjustment for fine-tuning
    adjustMaxSpeeds(moveSpeedMultiplier = 1.0, turnSpeedMultiplier = 1.0) {
        Object.keys(this.movementSettings).forEach(phase => {
            this.movementSettings[phase].maxMoveSpeed *= moveSpeedMultiplier;
            this.movementSettings[phase].maxTurnSpeed *= turnSpeedMultiplier;
        });
        console.log(`🎮 Speed adjusted: Move x${moveSpeedMultiplier}, Turn x${turnSpeedMultiplier}`);
    }
}
