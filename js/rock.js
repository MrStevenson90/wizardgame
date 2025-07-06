// js/rock.js
export class Rock {
    constructor() {
        this.spellCount = 0;
        
        // NEW: Track the 'S' rune for drawing system integration (MOVED BEFORE createRock)
        this.runePosition = new THREE.Vector3(0, 1, 3.6);
        this.runeSize = { width: 6, height: 6 };
        this.isGlowing = false;
        
        this.createRock();
        
        // Enhanced bounding box for collision and proximity detection
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
        
        // NEW: Template path for the 'S' rune in 3D space for accuracy checking
        this.runeTemplatePath = this.createRuneTemplatePath();
        
        // NEW: Visual feedback enhancement
        this.pulseAnimation = { active: false, intensity: 0 };
    }

    createRock() {
        const group = new THREE.Group();

        // Base Rock - Enhanced for better visibility
        let geometry = new THREE.IcosahedronGeometry(4, 2);
        geometry = this._displaceGeometryVertices(geometry, 0.8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x6c757d,
            roughness: 0.7,
            metalness: 0.2,
            // NEW: Enhanced material for better lighting
            emissive: 0x111111,
            emissiveIntensity: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        group.add(this.mesh);

        // Enhanced 'S' Rune on the rock
        const runeTexture = this.createRuneTexture();
        const runeMaterial = new THREE.MeshStandardMaterial({
            map: runeTexture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            // NEW: Enhanced rune material with glow effect
            emissive: 0x004444,
            emissiveIntensity: 2.5, // More visible
            roughness: 0.1,
            metalness: 0.1,
            opacity: 0.9 // Ensure visibility
        });
        
        // Enhanced rune geometry - larger and better positioned
        const runeGeometry = new THREE.PlaneGeometry(this.runeSize.width, this.runeSize.height);
        this.runeMesh = new THREE.Mesh(runeGeometry, runeMaterial);
        this.runeMesh.position.copy(this.runePosition);
        this.runeMesh.lookAt(group.position.clone().add(new THREE.Vector3(0, 0, 10)));
        this.runeMesh.userData.type = 'rune';
        this.runeMesh.userData.rock = this;
        group.add(this.runeMesh);

        // Enhanced magical light for spell effects
        this.glowLight = new THREE.PointLight(0x00ffff, 0, 30);
        this.glowLight.position.y = 2;
        group.add(this.glowLight);
        
        // NEW: Ambient glow around the rune
        this.ambientGlow = new THREE.PointLight(0xffd700, 0.2, 15);
        this.ambientGlow.position.copy(this.runePosition);
        group.add(this.ambientGlow);
        
        group.position.set(0, 1, -20);
        this.group = group;
    }
    
    _displaceGeometryVertices(geometry, noiseFactor) {
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const displacement = new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            ).multiplyScalar(noiseFactor);
            vertices[i] += displacement.x;
            vertices[i+1] += displacement.y;
            vertices[i+2] += displacement.z;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
    }

    // Enhanced 'S' texture creation with the same shape as Scene 1
    createRuneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Higher resolution for crisp rendering
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Scale factor to fit the 1024x1024 canvas (roughly 3.4x scale from 300x300)
        const scale = 3.4;
        
        // Create glowing 'S' effect with the same shape as popup
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 40; // Thicker for better visibility
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Outer glow
        ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
        ctx.shadowBlur = 50;
        
        // Draw the proper S-shape path (scaled up for 1024x1024)
        ctx.beginPath();
        ctx.moveTo(220 * scale, 60 * scale); // Start point
        // First curve: top part of S
        ctx.bezierCurveTo(180 * scale, 60 * scale, 120 * scale, 60 * scale, 120 * scale, 100 * scale);
        // Second curve: middle part of S  
        ctx.bezierCurveTo(120 * scale, 140 * scale, 180 * scale, 140 * scale, 180 * scale, 180 * scale);
        // Third curve: bottom part of S
        ctx.bezierCurveTo(180 * scale, 220 * scale, 120 * scale, 220 * scale, 80 * scale, 220 * scale);
        ctx.stroke();
        
        // Inner bright line
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 25;
        ctx.stroke();
        
        // Core bright line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        return new THREE.CanvasTexture(canvas);
    }
    
    // NEW: Create template path for the 'S' rune in world coordinates
    createRuneTemplatePath() {
        const path = [];
        // Create the same S-shape template as the popup, but normalized for 3D space
        // Using the same path: M 220 60 C 180 60, 120 60, 120 100 C 120 140, 180 140, 180 180 C 180 220, 120 220, 80 220
        
        // Normalize coordinates to -1 to 1 range for scaling flexibility
        const normalize = (x, y) => ({
            x: (x - 150) / 150, // Center around 150, scale to -1 to 1
            y: (y - 140) / 140  // Center around 140, scale to -1 to 1
        });
        
        // First curve: Top part of S (220,60 to 120,100)
        for(let t = 0; t <= 1; t += 0.02) {
            const x = Math.pow(1-t, 3) * 220 + 3*Math.pow(1-t, 2)*t * 180 + 3*(1-t)*Math.pow(t, 2) * 120 + Math.pow(t, 3) * 120;
            const y = Math.pow(1-t, 3) * 60 + 3*Math.pow(1-t, 2)*t * 60 + 3*(1-t)*Math.pow(t, 2) * 60 + Math.pow(t, 3) * 100;
            const normalized = normalize(x, y);
            path.push({
                x: normalized.x,
                y: normalized.y,
                worldPos: this.runePosition.clone().add(new THREE.Vector3(normalized.x, normalized.y, 0))
            });
        }
        
        // Second curve: Middle part of S (120,100 to 180,180)  
        for(let t = 0; t <= 1; t += 0.02) {
            const x = Math.pow(1-t, 3) * 120 + 3*Math.pow(1-t, 2)*t * 120 + 3*(1-t)*Math.pow(t, 2) * 180 + Math.pow(t, 3) * 180;
            const y = Math.pow(1-t, 3) * 100 + 3*Math.pow(1-t, 2)*t * 140 + 3*(1-t)*Math.pow(t, 2) * 140 + Math.pow(t, 3) * 180;
            const normalized = normalize(x, y);
            path.push({
                x: normalized.x,
                y: normalized.y,
                worldPos: this.runePosition.clone().add(new THREE.Vector3(normalized.x, normalized.y, 0))
            });
        }
        
        // Third curve: Bottom part of S (180,180 to 80,220)
        for(let t = 0; t <= 1; t += 0.02) {
            const x = Math.pow(1-t, 3) * 180 + 3*Math.pow(1-t, 2)*t * 180 + 3*(1-t)*Math.pow(t, 2) * 120 + Math.pow(t, 3) * 80;
            const y = Math.pow(1-t, 3) * 180 + 3*Math.pow(1-t, 2)*t * 220 + 3*(1-t)*Math.pow(t, 2) * 220 + Math.pow(t, 3) * 220;
            const normalized = normalize(x, y);
            path.push({
                x: normalized.x,
                y: normalized.y,
                worldPos: this.runePosition.clone().add(new THREE.Vector3(normalized.x, normalized.y, 0))
            });
        }
        
        return path;
    }
    
    // NEW: Get screen position of the rune for drawing system
    getRuneScreenPosition(camera, renderer) {
        const worldPos = this.group.position.clone().add(this.runePosition);
        const screenPos = worldPos.clone().project(camera);
        
        return {
            x: (screenPos.x + 1) * renderer.domElement.width / 2,
            y: (-screenPos.y + 1) * renderer.domElement.height / 2,
            worldPos: worldPos
        };
    }
    
    // NEW: Check if a screen position is near the rune
    isNearRune(screenPos, camera, renderer, tolerance = 50) {
        const runeScreenPos = this.getRuneScreenPosition(camera, renderer);
        const distance = Math.sqrt(
            Math.pow(screenPos.x - runeScreenPos.x, 2) + 
            Math.pow(screenPos.y - runeScreenPos.y, 2)
        );
        return distance <= tolerance;
    }
    
    // NEW: Get the template path in screen coordinates for drawing accuracy
    getRuneScreenTemplatePath(camera, renderer) {
        return this.runeTemplatePath.map(point => {
            const worldPos = this.group.position.clone().add(this.runePosition).add(new THREE.Vector3(point.x, point.y, 0));
            const screenPos = worldPos.clone().project(camera);
            
            return {
                x: (screenPos.x + 1) * renderer.domElement.width / 2,
                y: (-screenPos.y + 1) * renderer.domElement.height / 2
            };
        });
    }
    
    // Updates the bounding box based on the mesh's current position and size
    updateBoundingBox() {
        this.boundingBox.setFromObject(this.group);
        // Expand bounding box slightly for easier interaction
        this.boundingBox.expandByScalar(2);
    }

    // Enhanced spell effect with better visual feedback
    addSpellEffect() {
        this.spellCount++;
        this.isGlowing = true;
        
        // Main glow effect
        this.glowLight.intensity = 4.0;
        this.glowLight.distance = 35;
        
        // Enhanced ambient glow
        this.ambientGlow.intensity = 1.0;
        this.ambientGlow.distance = 20;
        
        // NEW: Pulse the rune material
        this.pulseAnimation.active = true;
        this.pulseAnimation.intensity = 1.0;
        
        // NEW: Enhanced fade-out with pulsing effect
        const fadeInterval = setInterval(() => {
            this.glowLight.intensity -= 0.1;
            this.ambientGlow.intensity -= 0.025;
            this.pulseAnimation.intensity -= 0.025;
            
            if (this.glowLight.intensity <= 0) {
                this.glowLight.intensity = 0;
                this.ambientGlow.intensity = 0.2; // Return to base ambient
                this.pulseAnimation.active = false;
                this.isGlowing = false;
                clearInterval(fadeInterval);
            }
            
            // Update rune material emissive based on pulse
            if (this.runeMesh && this.pulseAnimation.active) {
                const pulseValue = 0.3 + Math.sin(Date.now() * 0.01) * 0.2 * this.pulseAnimation.intensity;
                this.runeMesh.material.emissiveIntensity = pulseValue;
            } else if (this.runeMesh) {
                this.runeMesh.material.emissiveIntensity = 0.3;
            }
        }, 50);
    }
    
    // NEW: Animate the rock for visual feedback
    update(deltaTime) {
        if (this.pulseAnimation.active && this.runeMesh) {
            // Pulse animation for the rune
            const time = Date.now() * 0.005;
            const pulse = Math.sin(time) * 0.1 * this.pulseAnimation.intensity;
            this.runeMesh.scale.setScalar(1 + pulse);
            
            // Rotate the rune slightly for magical effect
            this.runeMesh.rotation.z = Math.sin(time * 0.5) * 0.05;
        }
        
        // Subtle floating animation for the entire rock
        if (this.group) {
            const time = Date.now() * 0.001;
            this.group.position.y = 1 + Math.sin(time) * 0.05;
            this.group.rotation.y = Math.sin(time * 0.3) * 0.02;
        }
    }
    
    // NEW: Highlight the rune when player is nearby
    highlightRune(isHighlighted) {
        if (this.runeMesh) {
            if (isHighlighted) {
                this.runeMesh.material.emissiveIntensity = 0.5;
                this.ambientGlow.intensity = 0.4;
            } else {
                this.runeMesh.material.emissiveIntensity = 0.3;
                this.ambientGlow.intensity = 0.2;
            }
        }
    }
    
    // NEW: Get distance to player for proximity-based effects
    getDistanceToPosition(position) {
        return this.group.position.distanceTo(position);
    }
}