// js/cameraSystem.js
export class CameraSystem {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;

        // UPDATED: Phase-specific camera configurations with first-person support
        this.configurations = {
            chamber: { 
                type: 'follow', 
                localOffset: new THREE.Vector3(0, 10, -16), // UPDATED: Behind player facing south (180°)
                lookAtOffset: new THREE.Vector3(0, 2, 0), 
                smoothness: 0.1 
            },
            practice: { 
                type: 'firstPerson', 
                headOffset: new THREE.Vector3(0, 3.7, 0.0), // Eye level height (1.7m)
                smoothness: 0.15, // Responsive but not jittery
                mouseSensitivity: 0.002, // For potential mouse look
                // NEW: Scene 2 specific positioning
                playerStartPosition: new THREE.Vector3(-15, 0, 0), // Further back from rock
                rockPosition: new THREE.Vector3(3, 2, -8), // Rock location for reference
            },
            battle: { 
                type: 'firstPerson', 
                headOffset: new THREE.Vector3(0, 3.7, 0.0), // Same eye level
                smoothness: 0.15, // Consistent feel with practice
                mouseSensitivity: 0.002
            },
        };

        this.currentPhase = 'chamber';
        this.currentConfig = this.configurations.chamber;
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        
        // First-person specific properties
        this.firstPersonRotation = { x: 0, y: 0 };
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.transitionDuration = 1000; // 1 second transition
        
        // NEW: Reference to game world for positioning
        this.gameWorld = null;
    }

    // NEW: Set reference to game world for player positioning
    setGameWorld(gameWorld) {
        this.gameWorld = gameWorld;
    }

    setPhase(phase) {
        if (this.configurations[phase]) {
            const previousPhase = this.currentPhase;
            const previousConfig = this.currentConfig;
            
            this.currentPhase = phase;
            this.currentConfig = this.configurations[phase];
            
            console.log(`🎥 Camera switching from ${previousConfig.type} to ${this.currentConfig.type} for phase: ${phase}`);
            
            // NEW: Handle Scene 2 player positioning and rotation
            if (phase === 'practice') {
                this.setupScene2PlayerPosition();
            }
            
            // Handle transitions between camera types
            if (previousConfig.type !== this.currentConfig.type) {
                this.startCameraTransition(previousConfig, this.currentConfig);
            }
            
            // Initialize first-person rotation to match current player rotation
            if (this.currentConfig.type === 'firstPerson' && this.player) {
                this.firstPersonRotation.y = this.player.rotation.y;
                this.firstPersonRotation.x = 0; // Start looking straight ahead
            }
        }
    }

    // NEW: Setup Scene 2 player positioning and rotation
    setupScene2PlayerPosition() {
        if (!this.player) return;

        const config = this.currentConfig;
        
        // Position player further back from rock for straight-line approach
        if (config.playerStartPosition) {
            console.log(`🎯 Positioning player for Scene 2 at:`, config.playerStartPosition);
            
            // Set player position
            this.player.position.copy(config.playerStartPosition);
            
            // Update terrain height if ground is available
            if (this.gameWorld && this.gameWorld.ground && typeof this.gameWorld.ground.getTerrainHeightAtPosition === 'function') {
                const groundHeight = this.gameWorld.ground.getTerrainHeightAtPosition(
                    config.playerStartPosition.x, 
                    config.playerStartPosition.z
                );
                this.player.position.y = groundHeight + 1.0;
            }
            
            // Calculate rotation to face toward rock
            if (config.faceTowardRock && config.rockPosition) {
                const directionToRock = new THREE.Vector3().subVectors(config.rockPosition, this.player.position);
                const angleToRock = Math.atan2(directionToRock.x, directionToRock.z);
                
                console.log(`🎯 Rotating player to face rock. Angle: ${angleToRock} radians (${(angleToRock * 180 / Math.PI).toFixed(1)}°)`);
                
                // Set player rotation to face rock
                this.player.rotation.y = angleToRock;
                
                // Update character controller rotation if available
                if (this.player.controller && typeof this.player.controller.setRotation === 'function') {
                    this.player.controller.setRotation(angleToRock);
                }
                
                // Sync first-person rotation
                this.firstPersonRotation.y = angleToRock;
                this.firstPersonRotation.x = 0;
            }
        }
    }

    startCameraTransition(fromConfig, toConfig) {
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        this.fromConfig = fromConfig;
        this.toConfig = toConfig;
        
        console.log(`🎥 Starting camera transition from ${fromConfig.type} to ${toConfig.type}`);
    }

    update() {
        if (this.isTransitioning) {
            this.updateTransition();
        } else if (this.currentConfig.type === 'follow') {
            this.updateFollowCamera();
        } else if (this.currentConfig.type === 'firstPerson') {
            this.updateFirstPersonCamera();
        } else {
            this.updateStaticCamera();
        }
    }

    updateTransition() {
        const elapsed = Date.now() - this.transitionStartTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1.0);
        
        // Use easing function for smooth transition
        const easedProgress = this.easeInOutCubic(progress);
        
        if (this.fromConfig.type === 'follow' && this.toConfig.type === 'firstPerson') {
            this.transitionToFirstPerson(easedProgress);
        } else if (this.fromConfig.type === 'firstPerson' && this.toConfig.type === 'follow') {
            this.transitionToFollow(easedProgress);
        } else {
            // Direct transition for same types
            if (progress >= 1.0) {
                this.isTransitioning = false;
            }
        }
        
        if (progress >= 1.0) {
            this.isTransitioning = false;
            console.log(`🎥 Camera transition completed`);
        }
    }

    transitionToFirstPerson(progress) {
        if (!this.player) return;
        
        // Calculate positions
        const followWorldOffset = this.fromConfig.localOffset.clone().applyQuaternion(this.player.quaternion);
        const followPosition = this.player.position.clone().add(followWorldOffset);
        const firstPersonPosition = this.player.position.clone().add(this.toConfig.headOffset);
        
        // Interpolate position
        const currentPosition = followPosition.clone().lerp(firstPersonPosition, progress);
        this.camera.position.copy(currentPosition);
        
        // Interpolate rotation to match player's Y rotation
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
        
        this.camera.quaternion.slerp(targetQuaternion, progress);
        
        // Update first-person rotation for when transition completes
        this.firstPersonRotation.y = this.player.rotation.y;
        this.firstPersonRotation.x = 0;
    }

    transitionToFollow(progress) {
        if (!this.player) return;
        
        // Calculate positions
        const firstPersonPosition = this.player.position.clone().add(this.fromConfig.headOffset);
        const followWorldOffset = this.toConfig.localOffset.clone().applyQuaternion(this.player.quaternion);
        const followPosition = this.player.position.clone().add(followWorldOffset);
        
        // Interpolate position
        const currentPosition = firstPersonPosition.clone().lerp(followPosition, progress);
        this.camera.position.copy(currentPosition);
        
        // Interpolate to look at player
        const lookAtTarget = this.player.position.clone().add(this.toConfig.lookAtOffset);
        const tempCamera = this.camera.clone();
        tempCamera.lookAt(lookAtTarget);
        
        this.camera.quaternion.slerp(tempCamera.quaternion, progress);
    }

    updateFollowCamera() {
        if (!this.player) return;

        // Convert local offset to world coordinates based on player's rotation
        const worldOffset = this.currentConfig.localOffset.clone().applyQuaternion(this.player.quaternion);
        this.targetPosition.copy(this.player.position).add(worldOffset);

        this.targetLookAt.copy(this.player.position).add(this.currentConfig.lookAtOffset);

        // Lerp (linear interpolate) for smooth camera movement
        this.camera.position.lerp(this.targetPosition, this.currentConfig.smoothness);
        
        // Smoothly look at the target
        const targetQuaternion = new THREE.Quaternion();
        const tempCamera = this.camera.clone();
        tempCamera.lookAt(this.targetLookAt);
        targetQuaternion.copy(tempCamera.quaternion);

        // Slerp (spherical linear interpolate) the camera's quaternion for smooth rotation
        this.camera.quaternion.slerp(targetQuaternion, this.currentConfig.smoothness);
    }

    updateFirstPersonCamera() {
        if (!this.player) return;

        // Position camera at player's head level
        const headPosition = this.player.position.clone().add(this.currentConfig.headOffset);
        
        // FIXED: No smoothing for position - camera moves exactly with character
        // This prevents the character from appearing in view during fast movement
        this.camera.position.copy(headPosition);
        
        // Sync first-person rotation with player's rotation
        this.firstPersonRotation.y = this.player.rotation.y;
        
        // Apply rotation to camera
        const targetQuaternion = new THREE.Quaternion();
        
        // Combine Y rotation (from player movement) with X rotation (looking up/down)
        const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.firstPersonRotation.y);
        const xRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.firstPersonRotation.x);
        
        // Apply Y rotation first, then X rotation
        targetQuaternion.multiplyQuaternions(yRotation, xRotation);
        
        // FIXED: Reduced rotation smoothing for more responsive first-person feel
        this.camera.quaternion.slerp(targetQuaternion, 0.8);
    }

    updateStaticCamera() {
        if (this.currentConfig.position && this.currentConfig.lookAt) {
            this.camera.position.lerp(this.currentConfig.position, 0.05);
            this.camera.lookAt(this.currentConfig.lookAt);
        }
    }

    // Easing function for smooth transitions
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Method to manually adjust first-person look direction (for mouse look if implemented)
    adjustFirstPersonLook(deltaX, deltaY) {
        if (this.currentConfig.type !== 'firstPerson') return;
        
        const sensitivity = this.currentConfig.mouseSensitivity;
        
        // Update rotation
        this.firstPersonRotation.y -= deltaX * sensitivity;
        this.firstPersonRotation.x -= deltaY * sensitivity;
        
        // Clamp vertical rotation to prevent over-rotation
        this.firstPersonRotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.firstPersonRotation.x));
    }

    // NEW: Method to get calculated angle to rock (for debugging)
    getAngleToRock() {
        if (!this.player || !this.currentConfig.rockPosition) return null;
        
        const directionToRock = new THREE.Vector3().subVectors(this.currentConfig.rockPosition, this.player.position);
        const angleToRock = Math.atan2(directionToRock.x, directionToRock.z);
        
        return {
            angleRadians: angleToRock,
            angleDegrees: angleToRock * 180 / Math.PI,
            direction: directionToRock,
            distance: directionToRock.length()
        };
    }

    // Get current camera information for debugging
    getCameraInfo() {
        return {
            phase: this.currentPhase,
            type: this.currentConfig.type,
            position: this.camera.position.clone(),
            rotation: this.camera.rotation.clone(),
            isTransitioning: this.isTransitioning,
            playerPosition: this.player ? this.player.position.clone() : null,
            playerRotation: this.player ? this.player.rotation.y : null,
            angleToRock: this.getAngleToRock()
        };
    }

    // Force immediate camera position (useful for teleporting)
    setImmediatePosition(position, lookAt = null) {
        this.camera.position.copy(position);
        if (lookAt) {
            this.camera.lookAt(lookAt);
        }
        this.isTransitioning = false;
    }

    // NEW: Method to manually set player position and rotation (for debugging)
    setPlayerPositionAndRotation(position, rotation) {
        if (!this.player) return;
        
        this.player.position.copy(position);
        this.player.rotation.y = rotation;
        
        // Update character controller if available
        if (this.player.controller) {
            if (typeof this.player.controller.setPosition === 'function') {
                this.player.controller.setPosition(position.x, position.y, position.z);
            }
            if (typeof this.player.controller.setRotation === 'function') {
                this.player.controller.setRotation(rotation);
            }
        }
        
        // Update first-person rotation
        this.firstPersonRotation.y = rotation;
        this.firstPersonRotation.x = 0;
        
        console.log(`🎯 Manually set player position to:`, position, `rotation:`, rotation);
    }
}