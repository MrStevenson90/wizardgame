// js/CharacterController.js

export class CharacterController {
    constructor(player) {
        this.player = player;
        
        this.inputState = { forward: false, backward: false, left: false, right: false };
        
        this.movementSettings = {
            // UPDATED: Further reduced to 70% of previous values for even smoother exploration (420 * 0.7 = 294, 33.6 * 0.7 = 23.52)
            chamber:  { moveSpeed: 294.0, turnSpeed: 23.52, bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }},
            practice: { moveSpeed: 600.0, turnSpeed: 48.0, bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }},
            battle:   { moveSpeed: 600.0, turnSpeed: 48.0, bounds: { minX: -95, maxX: 95, minZ: -95, maxZ: 95 }}
        };
        
        // ADDED: Track current phase for movement direction handling
        this.currentPhase = 'chamber';
        this.currentSettings = this.movementSettings.chamber;
        this.currentRotation = 0;
    }

    setPhase(phase) {
        if (this.movementSettings[phase]) {
            this.currentPhase = phase; // ADDED: Track current phase
            this.currentSettings = this.movementSettings[phase];
            console.log(`🎮 Character controller set to phase: ${phase}`);
        }
    }

    setInputState(inputKeys) {
        this.inputState = { ...inputKeys };
    }

    update(deltaTime, rock) {
        this.updateRotationUnlimited(deltaTime);
        this.updateMovement(deltaTime, rock);
    }

    updateRotationUnlimited(deltaTime) {
        let rotationChange = 0;
        const turnSpeed = this.currentSettings.turnSpeed;
        
        if (this.inputState.left) rotationChange += turnSpeed * deltaTime;
        if (this.inputState.right) rotationChange -= turnSpeed * deltaTime;
        
        if (rotationChange !== 0) {
            this.currentRotation += rotationChange;
            this.player.rotation.y = this.currentRotation;
        }
    }

    updateMovement(deltaTime, rock) {
        const moveSpeed = this.currentSettings.moveSpeed;
        const moveDirection = new THREE.Vector3(0, 0, 0);

        // UPDATED: Check if we're in first-person mode (practice or battle phases)
        const isFirstPerson = (this.currentPhase === 'practice' || this.currentPhase === 'battle');
        
        // FIXED: Adjust movement directions based on camera mode
        if (isFirstPerson) {
            // FIRST-PERSON: Invert Z direction for natural feel
            if (this.inputState.forward) moveDirection.z -= 1;   // Forward (negative Z)
            if (this.inputState.backward) moveDirection.z += 1;  // Backward (positive Z)
        } else {
            // THIRD-PERSON: Standard movement directions
            if (this.inputState.forward) moveDirection.z += 1;   // Forward
            if (this.inputState.backward) moveDirection.z -= 1;  // Backward
        }
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);
            
            const movement = moveDirection.multiplyScalar(moveSpeed * deltaTime);
            const nextPosition = this.player.position.clone().add(movement);

            // UPDATED: Rock collision detection for 4x larger rock
            if (rock && rock.boundingBox.containsPoint(nextPosition)) {
                return;
            }

            this.player.position.copy(nextPosition);

            const bounds = this.currentSettings.bounds;
            this.player.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.position.x));
            this.player.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.player.position.z));
        }
    }

    stop() {
        this.inputState.forward = this.inputState.backward = this.inputState.left = this.inputState.right = false;
    }
    
    // NEW: Get current movement info for debugging
    getMovementInfo() {
        return {
            phase: this.currentPhase,
            isFirstPerson: (this.currentPhase === 'practice' || this.currentPhase === 'battle'),
            inputState: { ...this.inputState },
            rotation: this.currentRotation,
            position: this.player.position.clone()
        };
    }
    
    // NEW: Set position directly (useful for teleporting between phases)
    setPosition(x, y, z) {
        this.player.position.set(x, y, z);
    }
    
    // NEW: Set rotation directly
    setRotation(rotation) {
        this.currentRotation = rotation;
        this.player.rotation.y = this.currentRotation;
    }
}