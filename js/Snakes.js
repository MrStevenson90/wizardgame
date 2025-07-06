// js/Snakes.js - Enhanced for Better Battle Drawing

export class SnakeManager {
    constructor(scene) {
        this.scene = scene;
        this.snakes = [];
        this.meshes = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3; // FIXED: Faster spawning (was 8)
        this.isSpawning = false;
        this.runeTexture = this.createRuneTexture();
        
        // Battle system with 5 snakes total
        this.maxSnakes = 5;
        this.spawnedCount = 0;
        this.defeatedCount = 0;
        this.battleComplete = false;
        
        // ENHANCED: Improved rune properties for better targeting
        this.runeSize = { width: 12, height: 12 }; // Larger for easier targeting
        this.runeProximityTolerance = 150; // Increased tolerance
        this.runeOverlapTolerance = 60; // Increased for easier tracing
        
        // Template path for 'S' rune accuracy checking (same as scenes 1&2)
        this.runeTemplatePath = this.createRuneTemplatePath();
        
        // Visual feedback properties
        this.highlightedSnake = null;
        this.feedbackEffects = [];
        
        // Score tracking
        this.currentScore = 0;
        
        // Targeting improvements
        this.lastHighlightUpdate = 0;
        this.highlightUpdateInterval = 100; // ms
        
        // ADDED: Force spawn all snakes at once for reliable battle
        this.allSnakesSpawned = false;
        this.lastAliveCount = 0;
    }

    startSpawning() {
        this.isSpawning = true;
        this.spawnedCount = 0;
        this.defeatedCount = 0;
        this.currentScore = 0;
        this.battleComplete = false;
        this.allSnakesSpawned = false;
        
        console.log("🐍 Battle begins! Spawning all 5 serpents...");
        
        // FIXED: Spawn all snakes immediately for reliable battle
        setTimeout(() => {
            this.spawnAllSnakes();
        }, 1000);
        
        // Dispatch battle start event
        window.dispatchEvent(new CustomEvent('battleStart', {
            detail: { totalSnakes: this.maxSnakes }
        }));
    }
    
    // NEW: Spawn all snakes at once for reliable battle
    spawnAllSnakes() {
        console.log("🐍 Spawning all serpents at once...");
        
        for (let i = 0; i < this.maxSnakes; i++) {
            setTimeout(() => {
                this.createNewSnake();
                
                // After last snake, mark as complete
                if (i === this.maxSnakes - 1) {
                    this.allSnakesSpawned = true;
                    this.isSpawning = false;
                    console.log(`✅ All ${this.maxSnakes} serpents spawned successfully`);
                    
                    // Debug check
                    setTimeout(() => {
                        const aliveCount = this.getAliveSnakes().length;
                        console.log(`🔍 Final check: ${aliveCount} snakes alive and ready for battle`);
                    }, 500);
                }
            }, i * 800); // Stagger spawning by 0.8 seconds each
        }
    }
    
    // ENHANCED: Better snake targeting with screen space calculations
    getSnakeInView(camera) {
        let bestSnake = null;
        let bestScore = -Infinity;

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        this.snakes.forEach(snake => {
            if (!snake.userData.alive) return;
            
            // Check if snake is in front of camera
            const snakeDirection = snake.position.clone().sub(camera.position).normalize();
            const angle = cameraDirection.angleTo(snakeDirection);
            
            if (angle > 1.2) return; // Too far from camera direction
            
            // Get screen position
            const runeScreenPos = this.getSnakeRuneScreenPosition(snake, camera, window.gameInstance.gameManager.renderer);
            if (!runeScreenPos) return;
            
            // Calculate score based on multiple factors
            let score = 0;
            
            // Favor snakes closer to screen center
            const distanceFromCenter = Math.sqrt(
                Math.pow(runeScreenPos.x - screenCenter.x, 2) + 
                Math.pow(runeScreenPos.y - screenCenter.y, 2)
            );
            score += Math.max(0, 400 - distanceFromCenter); // Max 400 points for center
            
            // Favor snakes closer to camera
            const distanceFromCamera = snake.position.distanceTo(camera.position);
            score += Math.max(0, 100 - distanceFromCamera); // Max 100 points for proximity
            
            // Favor snakes more directly in front
            score += Math.max(0, 50 - angle * 50); // Max 50 points for being in front
            
            if (score > bestScore) {
                bestScore = score;
                bestSnake = snake;
            }
        });
        
        return bestSnake;
    }
    
    // ENHANCED: Better proximity checking with screen space
    isNearSnakeRune(snake, screenPos, camera, renderer) {
        const runeScreenPos = this.getSnakeRuneScreenPosition(snake, camera, renderer);
        if (!runeScreenPos) return false;
        
        const distance = Math.sqrt(
            Math.pow(screenPos.x - runeScreenPos.x, 2) + 
            Math.pow(screenPos.y - runeScreenPos.y, 2)
        );
        
        const isNear = distance <= this.runeProximityTolerance;
        if (isNear) {
            console.log(`🎯 Snake ${snake.userData.spawnOrder} rune is ${Math.round(distance)}px away (within ${this.runeProximityTolerance}px)`);
        }
        
        return isNear;
    }
    
    // ENHANCED: More accurate screen position calculation
    getSnakeRuneScreenPosition(snake, camera, renderer) {
        const runeSprite = snake.children.find(child => child instanceof THREE.Sprite);
        if (!runeSprite || !snake.userData.alive) return null;
        
        // Calculate world position of the rune (accounting for animation)
        const worldPos = snake.position.clone();
        worldPos.y += runeSprite.position.y; // Add the animated Y offset
        
        // Project to screen space
        const screenPos = worldPos.clone().project(camera);
        
        // Check if behind camera or outside view frustum
        if (screenPos.z > 1 || screenPos.z < -1) return null;
        
        // Convert to pixel coordinates
        const x = (screenPos.x + 1) * renderer.domElement.width / 2;
        const y = (-screenPos.y + 1) * renderer.domElement.height / 2;
        
        // Check if on screen
        if (x < 0 || x > renderer.domElement.width || y < 0 || y > renderer.domElement.height) {
            return null;
        }
        
        return {
            x: x,
            y: y,
            worldPos: worldPos,
            distance: camera.position.distanceTo(worldPos)
        };
    }
    
    // ENHANCED: Better template path generation with proper scaling
    getSnakeRuneTemplatePath(snake, camera, renderer) {
        const runeScreenPos = this.getSnakeRuneScreenPosition(snake, camera, renderer);
        if (!runeScreenPos) {
            console.log(`❌ No screen position for snake ${snake.userData.spawnOrder}`);
            return [];
        }
        
        // Scale based on distance from camera for consistent size
        const baseScale = 100;
        const distanceScale = Math.max(0.5, Math.min(2.0, 30 / runeScreenPos.distance));
        const finalScale = baseScale * distanceScale;
        
        console.log(`📐 Snake ${snake.userData.spawnOrder} template: scale=${Math.round(finalScale)}, distance=${Math.round(runeScreenPos.distance)}`);
        
        return this.runeTemplatePath.map(point => ({
            x: runeScreenPos.x + point.x * finalScale,
            y: runeScreenPos.y + point.y * finalScale
        }));
    }
    
    // Get snake by screen position for drawing system
    getSnakeAtScreenPosition(screenPos, camera, renderer) {
        for (const snake of this.snakes) {
            if (snake.userData.alive && this.isNearSnakeRune(snake, screenPos, camera, renderer)) {
                return snake;
            }
        }
        return null;
    }

    update(deltaTime) {
        // REMOVED: Timer-based spawning since we spawn all at once now
        // The spawning is handled by spawnAllSnakes() method instead
        
        // Update existing snakes
        this.snakes.forEach(snake => {
            if (snake.userData.alive) {
                // ENHANCED: Slower, more predictable movement
                const direction = new THREE.Vector3(0, 0, 0).sub(snake.position).normalize();
                snake.position.add(direction.multiplyScalar(snake.userData.speed * deltaTime * 40));

                // Enhanced floating animation with more predictable pattern
                const time = Date.now() * 0.003;
                snake.position.y = 0.8 + Math.sin(time + snake.userData.angle) * 0.3;
                snake.rotation.y = Math.atan2(direction.x, direction.z);
                
                // FIXED: Less distracting rune animation
                const runeSprite = snake.children.find(child => child instanceof THREE.Sprite);
                if (runeSprite) {
                    // Gentler vertical animation
                    runeSprite.position.y = 4.5 + Math.sin(time + snake.userData.angle) * 0.2;
                    
                    // FIXED: Stable, non-flashing rune
                    runeSprite.scale.setScalar(this.runeSize.width);
                    runeSprite.material.opacity = 1.0;
                    
                    // Only subtle highlight for targeted snake
                    if (this.highlightedSnake === snake) {
                        runeSprite.material.color.setHex(0xffff88); // Slight yellow tint
                    } else {
                        runeSprite.material.color.setHex(0xffffff); // Pure white
                    }
                }

                // Check if snake reached the player/wizard (game over condition)
                if (snake.position.distanceTo(new THREE.Vector3(0, 0, 5)) < 4) {
                    window.dispatchEvent(new CustomEvent('gameOver', {
                        detail: { 
                            won: false, 
                            score: this.currentScore,
                            reason: 'A serpent reached your mentor!'
                        }
                    }));
                }
            }
        });
        
        // Update feedback effects
        this.updateFeedbackEffects(deltaTime);
        
        // Check for battle completion
        this.checkBattleCompletion();
        
        // Update highlighting based on camera view
        this.updateSnakeHighlighting();
    }
    
    // NEW: Update snake highlighting based on what's in view
    updateSnakeHighlighting() {
        const now = Date.now();
        if (now - this.lastHighlightUpdate < this.highlightUpdateInterval) return;
        this.lastHighlightUpdate = now;
        
        // Clear previous highlight
        if (this.highlightedSnake) {
            this.unhighlightSnake(this.highlightedSnake);
        }
        
        // Highlight the best snake in view
        const gameInstance = window.gameInstance;
        if (gameInstance && gameInstance.phase === 'battle') {
            const bestSnake = this.getSnakeInView(gameInstance.gameManager.camera);
            if (bestSnake) {
                this.highlightSnake(bestSnake);
            }
        }
    }
    
    // ENHANCED: Create better rune texture with improved visibility
    createRuneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas with slight background for better visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale factor for 512x512 canvas
        const scale = 1.7;
        
        // Create glowing effect with enhanced visibility
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Outer glow (larger)
        ctx.strokeStyle = '#FF2222';
        ctx.lineWidth = 35;
        ctx.shadowColor = "rgba(255, 50, 50, 1.0)";
        ctx.shadowBlur = 50;
        this.drawSShape(ctx, scale);
        
        // Middle glow
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 25;
        ctx.shadowBlur = 30;
        this.drawSShape(ctx, scale);
        
        // Inner bright line
        ctx.strokeStyle = '#FF8888';
        ctx.lineWidth = 18;
        ctx.shadowBlur = 15;
        this.drawSShape(ctx, scale);
        
        // Core bright line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 12;
        ctx.shadowBlur = 5;
        this.drawSShape(ctx, scale);
        
        // Add a subtle pulsing border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 0;
        this.drawSShape(ctx, scale);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    // Helper method to draw S-shape consistently
    drawSShape(ctx, scale) {
        ctx.beginPath();
        ctx.moveTo(220 * scale, 60 * scale);
        ctx.bezierCurveTo(180 * scale, 60 * scale, 120 * scale, 60 * scale, 120 * scale, 100 * scale);
        ctx.bezierCurveTo(120 * scale, 140 * scale, 180 * scale, 140 * scale, 180 * scale, 180 * scale);
        ctx.bezierCurveTo(180 * scale, 220 * scale, 120 * scale, 220 * scale, 80 * scale, 220 * scale);
        ctx.stroke();
    }
    
    // Create template path for 'S' rune (same as scenes 1&2)
    createRuneTemplatePath() {
        const path = [];
        // Use the exact same S-shape template as popup and rock
        // Normalized coordinates for scaling flexibility
        const normalize = (x, y) => ({
            x: (x - 150) / 150, // Center around 150, scale to -1 to 1
            y: (y - 140) / 140  // Center around 140, scale to -1 to 1
        });
        
        // First curve: Top part of S (220,60 to 120,100)
        for(let t = 0; t <= 1; t += 0.015) { // Slightly more points for better accuracy
            const x = Math.pow(1-t, 3) * 220 + 3*Math.pow(1-t, 2)*t * 180 + 3*(1-t)*Math.pow(t, 2) * 120 + Math.pow(t, 3) * 120;
            const y = Math.pow(1-t, 3) * 60 + 3*Math.pow(1-t, 2)*t * 60 + 3*(1-t)*Math.pow(t, 2) * 60 + Math.pow(t, 3) * 100;
            const normalized = normalize(x, y);
            path.push(normalized);
        }
        
        // Second curve: Middle part of S (120,100 to 180,180)  
        for(let t = 0; t <= 1; t += 0.015) {
            const x = Math.pow(1-t, 3) * 120 + 3*Math.pow(1-t, 2)*t * 120 + 3*(1-t)*Math.pow(t, 2) * 180 + Math.pow(t, 3) * 180;
            const y = Math.pow(1-t, 3) * 100 + 3*Math.pow(1-t, 2)*t * 140 + 3*(1-t)*Math.pow(t, 2) * 140 + Math.pow(t, 3) * 180;
            const normalized = normalize(x, y);
            path.push(normalized);
        }
        
        // Third curve: Bottom part of S (180,180 to 80,220)
        for(let t = 0; t <= 1; t += 0.015) {
            const x = Math.pow(1-t, 3) * 180 + 3*Math.pow(1-t, 2)*t * 180 + 3*(1-t)*Math.pow(t, 2) * 120 + Math.pow(t, 3) * 80;
            const y = Math.pow(1-t, 3) * 180 + 3*Math.pow(1-t, 2)*t * 220 + 3*(1-t)*Math.pow(t, 2) * 220 + Math.pow(t, 3) * 220;
            const normalized = normalize(x, y);
            path.push(normalized);
        }
        
        return path;
    }

    createNewSnake() {
        // FIXED: Allow spawning beyond limit for manual spawning
        const snakeGroup = this.createSnake();
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 15; // FIXED: Even closer spawn distance

        snakeGroup.position.set(
            Math.cos(angle) * radius,
            1.2, // FIXED: Higher Y position for better visibility
            Math.sin(angle) * radius
        );

        // CRITICAL: Ensure all userData is properly set
        snakeGroup.userData = {
            type: 'snake',
            alive: true, // CRITICAL: Ensure alive is set to true
            speed: 0.004 + Math.random() * 0.002, // FIXED: Slower for easier targeting
            angle: angle,
            hit: () => this.hitSnake(snakeGroup),
            id: `snake_${this.spawnedCount + 1}`,
            spawnOrder: this.spawnedCount + 1,
            created: Date.now() // ADDED: Track creation time
        };
        
        this.spawnedCount++;
        this.snakes.push(snakeGroup);
        this.meshes.push(snakeGroup);
        this.scene.add(snakeGroup);
        
        console.log(`🐍 Serpent ${this.spawnedCount}/${this.maxSnakes} spawned at (${Math.round(snakeGroup.position.x)}, ${Math.round(snakeGroup.position.z)}) - ID: ${snakeGroup.userData.id}`);
        
        // Dispatch spawn event for UI updates
        window.dispatchEvent(new CustomEvent('snakeSpawned', {
            detail: { 
                snakeNumber: this.spawnedCount,
                totalSnakes: this.maxSnakes,
                snakeId: snakeGroup.userData.id
            }
        }));
        
        // ADDED: Immediate verification
        setTimeout(() => {
            const isStillAlive = snakeGroup.userData.alive;
            const isInArray = this.snakes.includes(snakeGroup);
            console.log(`🔍 Snake ${snakeGroup.userData.spawnOrder} verification: alive=${isStillAlive}, inArray=${isInArray}`);
        }, 100);
        
        return snakeGroup;
    }

    createSnake() {
        const group = new THREE.Group();
        group.userData.type = 'snake';

        // Enhanced snake body with better materials and visibility
        const segmentCount = 10; // More segments for better appearance
        for (let i = 0; i < segmentCount; i++) {
            const radius = 0.4 - i * 0.02;
            const segmentGeometry = new THREE.SphereGeometry(radius, 8, 6);
            const hue = 0.25 + Math.sin(i * 0.5) * 0.1; // Slight color variation
            const segmentMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(hue, 0.8, 0.3 - i * 0.02),
                emissive: new THREE.Color().setHSL(hue, 0.5, 0.1)
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.z = -i * 0.5;
            segment.castShadow = true;
            segment.userData.type = 'snake';
            group.add(segment);
        }
        
        // ENHANCED: Larger, more visible rune sprite
        const runeMaterial = new THREE.SpriteMaterial({ 
            map: this.runeTexture, 
            depthWrite: false,
            transparent: true,
            alphaTest: 0.1,
            blending: THREE.AdditiveBlending,
            // ENHANCED: Better material properties
            opacity: 1.0,
            color: 0xffffff
        });
        const runeSprite = new THREE.Sprite(runeMaterial);
        runeSprite.position.y = 4;
        runeSprite.scale.set(this.runeSize.width, this.runeSize.height, 1);
        runeSprite.userData.type = 'snakeRune';
        runeSprite.userData.parent = group;
        group.add(runeSprite);
        
        return group;
    }
    
    // Highlight snake when targeted for drawing
    highlightSnake(snake) {
        if (this.highlightedSnake && this.highlightedSnake !== snake) {
            this.unhighlightSnake(this.highlightedSnake);
        }
        
        this.highlightedSnake = snake;
        const runeSprite = snake.children.find(child => child instanceof THREE.Sprite);
        if (runeSprite) {
            runeSprite.material.color.setHex(0xffff88); // Bright yellow highlight
            runeSprite.material.opacity = 1.0;
        }
    }
    
    // Remove highlight from snake
    unhighlightSnake(snake) {
        if (snake === this.highlightedSnake) {
            this.highlightedSnake = null;
        }
        
        const runeSprite = snake.children.find(child => child instanceof THREE.Sprite);
        if (runeSprite) {
            runeSprite.material.color.setHex(0xffffff); // White default
            runeSprite.material.opacity = 1.0;
        }
    }
    
    // Create feedback effects for successful tracing
    createSuccessEffect(position) {
        const effect = {
            position: position.clone(),
            age: 0,
            maxAge: 3.0,
            particles: []
        };
        
        // Create more impressive sparkle particles
        for (let i = 0; i < 25; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.2, 6, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.8), // Gold/yellow colors
                transparent: true
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 4,
                (Math.random() - 0.5) * 8
            );
            this.scene.add(particle);
            effect.particles.push(particle);
        }
        
        this.feedbackEffects.push(effect);
    }
    
    // Update feedback effects
    updateFeedbackEffects(deltaTime) {
        for (let i = this.feedbackEffects.length - 1; i >= 0; i--) {
            const effect = this.feedbackEffects[i];
            effect.age += deltaTime;
            
            const progress = effect.age / effect.maxAge;
            
            effect.particles.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                particle.velocity.y -= 12 * deltaTime; // Gravity
                particle.material.opacity = Math.max(0, 1 - progress);
                particle.scale.setScalar(Math.max(0.1, 1 - progress * 0.8));
            });
            
            if (effect.age >= effect.maxAge) {
                effect.particles.forEach(particle => {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                this.feedbackEffects.splice(i, 1);
            }
        }
    }

    // Enhanced hit snake method with better feedback
    hitSnake(snake) {
        if (!snake.userData.alive) {
            console.log(`⚠️ Snake ${snake.userData.spawnOrder} already defeated`);
            return;
        }
        
        console.log(`🎯 Snake ${snake.userData.spawnOrder} hit! Putting to sleep...`);
        
        // Remove highlight if this snake was highlighted
        if (this.highlightedSnake === snake) {
            this.highlightedSnake = null;
        }
        
        // Mark as defeated IMMEDIATELY
        snake.userData.alive = false;
        this.defeatedCount++;
        this.currentScore++;
        
        console.log(`💤 Snake ${snake.userData.spawnOrder} marked as defeated. Stats: ${this.currentScore}/${this.maxSnakes}`);

        // Hide the rune target immediately
        const runeSprite = snake.children.find(child => child instanceof THREE.Sprite);
        if (runeSprite) {
            runeSprite.visible = false;
        }
        
        // Create enhanced success effect
        this.createSuccessEffect(snake.position.clone().add(new THREE.Vector3(0, 3, 0)));

        // Create "Zzz" sleep particles with faster cleanup
        const zzzCanvas = document.createElement('canvas');
        zzzCanvas.width = 128;
        zzzCanvas.height = 128;
        const zzzCtx = zzzCanvas.getContext('2d');
        zzzCtx.font = 'bold 72px Arial';
        zzzCtx.fillStyle = 'white';
        zzzCtx.strokeStyle = 'black';
        zzzCtx.lineWidth = 4;
        zzzCtx.textAlign = 'center';
        zzzCtx.strokeText('Z', 64, 90);
        zzzCtx.fillText('Z', 64, 90);
        const zzzTexture = new THREE.CanvasTexture(zzzCanvas);
        
        for (let i = 0; i < 6; i++) {
            const zzzMaterial = new THREE.SpriteMaterial({ 
                map: zzzTexture, 
                depthWrite: false, 
                transparent: true 
            });
            const zzzSprite = new THREE.Sprite(zzzMaterial);
            zzzSprite.position.copy(snake.position).add(new THREE.Vector3(
                (Math.random() - 0.5) * 3, 
                2.5 + i * 1.2, 
                (Math.random() - 0.5) * 3
            ));
            zzzSprite.scale.set(3, 3, 3);
            this.scene.add(zzzSprite);

            // Faster animation
            new TWEEN.Tween(zzzSprite.position)
                .to({ y: zzzSprite.position.y + 6 }, 2000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
                
            new TWEEN.Tween(zzzSprite.material)
                .to({ opacity: 0 }, 2000)
                .easing(TWEEN.Easing.Quadratic.In)
                .onComplete(() => this.scene.remove(zzzSprite))
                .start();
        }

        // FIXED: Faster fade animation to keep snakes visible longer
        const materialsToFade = [];
        snake.traverse(child => {
            if (child.material) {
                child.material.transparent = true;
                materialsToFade.push(child.material);
            }
        });

        const fade = { opacity: 1.0, hue: 0.25 };
        new TWEEN.Tween(fade)
            .to({ opacity: 0.1, hue: 0.6 }, 4000) // Slower fade, keeps snake visible longer
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate(() => {
                materialsToFade.forEach(mat => {
                    mat.opacity = fade.opacity;
                    if (mat.color) {
                        mat.color.setHSL(fade.hue, 0.8, 0.4 * fade.opacity);
                    }
                });
            })
            .onComplete(() => {
                // FIXED: Clean up but keep in arrays until battle ends
                console.log(`🧹 Cleaning up snake ${snake.userData.spawnOrder}`);
                this.scene.remove(snake);
                
                // Don't remove from arrays immediately - let battle completion handle it
                // this.snakes = this.snakes.filter(s => s !== snake);
                // this.meshes = this.meshes.filter(m => m !== snake);
                
                // Dispatch individual defeat event
                window.dispatchEvent(new CustomEvent('snakeDefeated', {
                    detail: { 
                        snakeId: snake.userData.id,
                        spawnOrder: snake.userData.spawnOrder,
                        currentScore: this.currentScore,
                        totalSnakes: this.maxSnakes
                    }
                }));
            })
            .start();
    }
    
    // Check if battle is complete
    checkBattleCompletion() {
        if (!this.battleComplete && this.defeatedCount >= this.maxSnakes) {
            this.battleComplete = true;
            console.log(`🏆 Battle complete! Final score: ${this.currentScore}/${this.maxSnakes}`);
            
            // Dispatch battle completion
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('battleComplete', {
                    detail: { 
                        score: this.currentScore,
                        maxScore: this.maxSnakes,
                        success: this.currentScore >= this.maxSnakes
                    }
                }));
            }, 1000);
        }
    }
    
    // Get all alive snakes for drawing system
    getAliveSnakes() {
        const aliveSnakes = this.snakes.filter(snake => snake.userData && snake.userData.alive === true);
        
        // SIMPLIFIED: Only log when count changes
        if (this.lastAliveCount !== aliveSnakes.length) {
            console.log(`🔍 Alive snakes: ${aliveSnakes.length}/${this.snakes.length}`);
            this.lastAliveCount = aliveSnakes.length;
        }
        
        return aliveSnakes;
    }
    
    // Get current battle stats
    getBattleStats() {
        const aliveSnakes = this.getAliveSnakes();
        const stats = {
            spawnedCount: this.spawnedCount,
            defeatedCount: this.defeatedCount,
            currentScore: this.currentScore,
            maxSnakes: this.maxSnakes,
            aliveCount: aliveSnakes.length,
            battleComplete: this.battleComplete
        };
        
        return stats;
    }
    
    // Reset battle system
    resetBattle() {
        this.cleanup();
        this.spawnedCount = 0;
        this.defeatedCount = 0;
        this.currentScore = 0;
        this.battleComplete = false;
        this.isSpawning = false;
        this.spawnTimer = 0;
    }
    
    // Cleanup method
    cleanup() {
        this.feedbackEffects.forEach(effect => {
            effect.particles.forEach(particle => {
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            });
        });
        this.feedbackEffects = [];
        
        this.snakes.forEach(snake => {
            this.scene.remove(snake);
        });
        this.snakes = [];
        this.meshes = [];
        this.highlightedSnake = null;
    }
}