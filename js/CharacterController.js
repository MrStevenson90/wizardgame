// js/CharacterController.js

export class CharacterController {
    constructor(player) {
        this.player = player;
        
        this.inputState = { forward: false, backward: false, left: false, right: false };
        
        this.movementSettings = {
            // REDUCED SPEEDS: Much smoother and natural movement
            // Chamber/Exploration phase - very slow for careful exploration
            chamber:  { 
                moveSpeed: 150.0,  // Reduced from 294.0 (≈50% slower)
                turnSpeed: 12.0,   // Reduced from 23.52 (≈50% slower)
                bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }
            },
            // Practice phase - slightly faster but still controlled
            practice: { 
                moveSpeed: 300.0,  // Reduced from 600.0 (50% slower)
                turnSpeed: 24.0,   // Reduced from 48.0 (50% slower)
                bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }
            },
            // Battle phase - moderate speed for tactical combat
            battle:   { 
                moveSpeed: 350.0,  // Reduced from 600.0 (≈42% slower)
                turnSpeed: 28.0,   // Reduced from 48.0 (≈42% slower)
                bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }
            }
        };
        
        // ADDED: Smooth acceleration settings
        this.acceleration = {
            moveAccel: 8.0,    // How quickly player reaches max speed
            turnAccel: 10.0,   // How quickly player reaches max turn speed
            friction: 0.85     // Smooths out stopping (0-1, higher = less friction)
        };
        
        // Current velocity tracking for smooth movement
        this.currentVelocity = { move: 0, turn: 0 };
        
        // Track current phase for movement direction handling
        this.currentPhase = 'chamber';
        this.currentSettings = this.movementSettings.chamber;
        this.currentRotation = Math.PI;  // CHANGE: facing south (180 degrees)
}

    setPhase(phase) {
        if (this.movementSettings[phase]) {
            this.currentPhase = phase;
            this.currentSettings = this.movementSettings[phase];
            console.log(`🎮 Character controller set to phase: ${phase}`);
        }
    }

    setInputState(inputKeys) {
        this.inputState = { ...inputKeys };
    }

    update(deltaTime, rock) {
        this.updateRotationSmooth(deltaTime);
        this.updateMovementSmooth(deltaTime, rock);
    }

    updateRotationSmooth(deltaTime) {
        const turnSpeed = this.currentSettings.turnSpeed;
        let targetTurnVelocity = 0;
        
        if (this.inputState.left) targetTurnVelocity = turnSpeed;
        if (this.inputState.right) targetTurnVelocity = -turnSpeed;
        
        // Smooth acceleration/deceleration for turning
        const turnDiff = targetTurnVelocity - this.currentVelocity.turn;
        this.currentVelocity.turn += turnDiff * this.acceleration.turnAccel * deltaTime;
        
        // Apply friction when no input
        if (targetTurnVelocity === 0) {
            this.currentVelocity.turn *= this.acceleration.friction;
        }
        
        // Apply the smooth rotation
        if (Math.abs(this.currentVelocity.turn) > 0.01) {
            this.currentRotation += this.currentVelocity.turn * deltaTime;
            this.player.rotation.y = this.currentRotation;
        }
    }

    updateMovementSmooth(deltaTime, rock) {
        const moveSpeed = this.currentSettings.moveSpeed;
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        // Check if we're in first-person mode
        const isFirstPerson = (this.currentPhase === 'practice' || this.currentPhase === 'battle');
        
        // Calculate target velocity based on input
        let targetMoveVelocity = 0;
        
        if (isFirstPerson) {
            if (this.inputState.forward) {
                moveDirection.z -= 1;
                targetMoveVelocity = moveSpeed;
            }
            if (this.inputState.backward) {
                moveDirection.z += 1;
                targetMoveVelocity = moveSpeed;
            }
        } else {
            if (this.inputState.forward) {
                moveDirection.z += 1;
                targetMoveVelocity = moveSpeed;
            }
            if (this.inputState.backward) {
                moveDirection.z -= 1;
                targetMoveVelocity = moveSpeed;
            }
        }
        
        // Smooth acceleration/deceleration
        const moveDiff = targetMoveVelocity - this.currentVelocity.move;
        this.currentVelocity.move += moveDiff * this.acceleration.moveAccel * deltaTime;
        
        // Apply friction when no input
        if (targetMoveVelocity === 0) {
            this.currentVelocity.move *= this.acceleration.friction;
        }
        
        // Only move if velocity is significant
        if (Math.abs(this.currentVelocity.move) > 0.1 && moveDirection.length() > 0) {
            moveDirection.normalize();
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);
            
            const movement = moveDirection.multiplyScalar(this.currentVelocity.move * deltaTime);
            const nextPosition = this.player.position.clone().add(movement);

            // Rock collision detection
            if (rock && rock.boundingBox.containsPoint(nextPosition)) {
                // Stop movement smoothly on collision
                this.currentVelocity.move *= 0.5;
                return;
            }

            this.player.position.copy(nextPosition);

            // Apply bounds
            const bounds = this.currentSettings.bounds;
            this.player.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.position.x));
            this.player.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.player.position.z));
        }
    }

    stop() {
        this.inputState.forward = this.inputState.backward = this.inputState.left = this.inputState.right = false;
        // Gradually stop instead of instant stop
        this.currentVelocity.move *= 0.8;
        this.currentVelocity.turn *= 0.8;
    }
    
    // Get current movement info for debugging
    getMovementInfo() {
        return {
            phase: this.currentPhase,
            isFirstPerson: (this.currentPhase === 'practice' || this.currentPhase === 'battle'),
            inputState: { ...this.inputState },
            rotation: this.currentRotation,
            position: this.player.position.clone(),
            velocity: { ...this.currentVelocity }
        };
    }
    
    // Set position directly (useful for teleporting between phases)
    setPosition(x, y, z) {
        this.player.position.set(x, y, z);
        // Reset velocity when teleporting
        this.currentVelocity.move = 0;
        this.currentVelocity.turn = 0;
    }
    
    // Set rotation directly
    setRotation(rotation) {
        this.currentRotation = rotation;
        this.player.rotation.y = this.currentRotation;
        this.currentVelocity.turn = 0;
    }
}