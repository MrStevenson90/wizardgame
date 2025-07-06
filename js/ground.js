// js/Ground.js - Enhanced Magical Terrain with Animated Grass System
export class Ground {
    constructor() {
        this.mesh = this.createMagicalTerrain();
        this.grassMesh = null;
        this.uniformTime = 0;
        this.magicalEffects = [];
        
        // Create magical grass system
        this.createMagicalGrassSystem();
        
        // Create magical terrain effects
        this.createMagicalEffects();
    }

    createMagicalTerrain() {
        const geometry = new THREE.PlaneGeometry(200, 200, 200, 200); // Higher resolution for magic

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                varying float vElevation;
                varying vec3 vWorldPosition;
                varying float vMagicalIntensity;
                
                uniform float uTime;
                
                // Enhanced noise functions
                float hash(float n) { 
                    return fract(sin(n) * 43758.5453123); 
                }
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(hash(dot(i, vec2(127.1, 311.7))), hash(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))), u.x),
                        mix(hash(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))), hash(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))), u.x),
                        u.y
                    );
                }
                
                float terrainHeight(vec2 pos) {
                    float height = 0.0;
                    
                    // Base terrain waves
                    height += sin(pos.x * 0.02) * 1.5 + cos(pos.y * 0.025) * 1.2;
                    height += sin(pos.x * 0.08) * 0.5 + cos(pos.y * 0.09) * 0.4;
                    
                    // Magical undulation
                    height += sin(pos.x * 0.05 + uTime * 0.3) * 0.3;
                    height += cos(pos.y * 0.04 + uTime * 0.2) * 0.2;
                    
                    // Noise-based micro details
                    height += noise(pos * 0.1) * 0.8;
                    height += noise(pos * 0.05 + uTime * 0.1) * 0.4;
                    
                    return height;
                }
                
                void main() {
                    vUv = uv;
                    
                    // Calculate terrain elevation
                    float elevation = terrainHeight(position.xy);
                    vElevation = elevation;
                    
                    // Calculate magical intensity based on elevation and position
                    vMagicalIntensity = smoothstep(-1.0, 3.0, elevation) * 0.5 + 
                                       sin(uTime * 0.5 + position.x * 0.1 + position.y * 0.1) * 0.3 + 0.7;
                    
                    // Apply elevation to vertex position
                    vec3 newPosition = position + vec3(0.0, elevation, 0.0);
                    vWorldPosition = newPosition;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying float vElevation;
                varying vec3 vWorldPosition;
                varying float vMagicalIntensity;
                
                uniform float uTime;
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453123), 
                            fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453123), u.x),
                        mix(fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453123), 
                            fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453123), u.x),
                        u.y
                    );
                }
                
                void main() {
                    // Base magical terrain colors
                    vec3 deepGrassColor = vec3(0.1, 0.4, 0.2);    // Deep magical green
                    vec3 grassColor = vec3(0.3, 0.7, 0.4);       // Magical grass green
                    vec3 brightGrassColor = vec3(0.4, 0.9, 0.5); // Bright magical green
                    vec3 soilColor = vec3(0.4, 0.3, 0.2);        // Rich soil
                    vec3 rockColor = vec3(0.5, 0.5, 0.6);        // Stone outcrops
                    vec3 magicalGlow = vec3(0.6, 1.0, 0.8);      // Magical highlights
                    
                    // Elevation-based color mixing
                    float elevationFactor = smoothstep(-1.0, 3.0, vElevation);
                    
                    // Base color blend
                    vec3 baseColor = mix(deepGrassColor, grassColor, elevationFactor * 0.7);
                    baseColor = mix(baseColor, soilColor, smoothstep(1.5, 2.5, vElevation) * 0.4);
                    
                    // Add rock outcrops on high elevation
                    float rockiness = smoothstep(2.0, 3.5, vElevation);
                    baseColor = mix(baseColor, rockColor, rockiness * 0.6);
                    
                    // Magical enhancement based on noise patterns
                    float magicalNoise = noise(vWorldPosition.xz * 0.02 + uTime * 0.05);
                    float magicalPattern = noise(vWorldPosition.xz * 0.08 + uTime * 0.02);
                    
                    // Add magical glow areas
                    float glowIntensity = smoothstep(0.6, 0.9, magicalNoise) * vMagicalIntensity;
                    baseColor = mix(baseColor, magicalGlow, glowIntensity * 0.4);
                    
                    // Add bright magical grass patches
                    float brightGrassPattern = smoothstep(0.5, 0.8, magicalPattern);
                    baseColor = mix(baseColor, brightGrassColor, brightGrassPattern * 0.5);
                    
                    // Magical sparkle effect
                    float sparkle = noise(vWorldPosition.xz * 0.5 + uTime * 0.3);
                    sparkle = step(0.95, sparkle) * sin(uTime * 10.0) * 0.5 + 0.5;
                    baseColor += vec3(0.8, 1.0, 0.9) * sparkle * 0.3;
                    
                    // Magical pulsing based on distance from center
                    float distanceFromCenter = length(vWorldPosition.xz) * 0.01;
                    float pulse = sin(uTime * 2.0 - distanceFromCenter) * 0.1 + 0.9;
                    baseColor *= pulse;
                    
                    // Add magical aura around high-magical areas
                    if (vMagicalIntensity > 0.8) {
                        float aura = sin(uTime * 3.0 + vWorldPosition.x * 0.1) * 0.1 + 0.9;
                        baseColor += vec3(0.2, 0.4, 0.3) * aura * 0.3;
                    }
                    
                    gl_FragColor = vec4(baseColor, 1.0);
                }
            `,
            uniforms: {
                uTime: { value: 0.0 }
            },
            side: THREE.DoubleSide
        });

        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = 'magicalTerrain';
        
        return ground;
    }
    
    createMagicalGrassSystem() {
        console.log('🌱 Creating magical grass system...');
        
        // Create individual grass blade geometry
        const grassBladeGeometry = this.createGrassBladeGeometry();
        const instanceCount = 75000; // Magical abundance!
        
        // Enhanced magical grass material
        const grassMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                windStrength: { value: 0.15 },
                windFrequency: { value: 3.0 },
                magicalGlow: { value: 0.3 },
                baseColor: { value: new THREE.Color(0x228B22) },    // Forest green base
                tipColor: { value: new THREE.Color(0x32CD32) },     // Lime green tips
                magicalColor: { value: new THREE.Color(0x00FF88) }, // Magical cyan-green
                glowIntensity: { value: 0.4 }
            },
            vertexShader: `
                precision highp float;
                
                uniform float uTime;
                uniform float windStrength;
                uniform float windFrequency;
                uniform float magicalGlow;
                
                attribute vec3 position;
                attribute vec2 uv;
                attribute float bendWeight;
                attribute vec3 instancePosition;
                attribute float instanceScale;
                attribute float instanceRotation;
                attribute float magicalIntensity;
                
                varying vec2 vUv;
                varying float vBendWeight;
                varying float vMagicalIntensity;
                varying vec3 vWorldPosition;
                
                // Enhanced noise function
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                }
                
                void main() {
                    vUv = uv;
                    vBendWeight = bendWeight;
                    vMagicalIntensity = magicalIntensity;
                    
                    // Apply instance transformations
                    vec3 pos = position;
                    
                    // Scale the grass blade
                    pos *= instanceScale;
                    
                    // Rotate around Y axis
                    float s = sin(instanceRotation);
                    float c = cos(instanceRotation);
                    pos.xz = mat2(c, -s, s, c) * pos.xz;
                    
                    // Position in world
                    pos += instancePosition;
                    vWorldPosition = pos;
                    
                    // Enhanced wind animation with magical swirls
                    float noiseValue = noise(pos.xz * 0.05 + uTime * 0.02);
                    float windWave = sin(pos.x * windFrequency + uTime * 2.0 + noiseValue * 5.0) * windStrength;
                    
                    // Magical swirl effect
                    float magicalSwirl = sin(uTime * 1.5 + pos.z * 0.1) * cos(uTime * 1.8 + pos.x * 0.1) * magicalGlow;
                    
                    // Combined wind effect - only affects upper parts
                    float totalWind = (windWave + magicalSwirl) * bendWeight;
                    pos.x += totalWind;
                    pos.z += totalWind * 0.5;
                    
                    // Magical floating effect for high-magic grass
                    if (magicalIntensity > 0.7) {
                        pos.y += sin(uTime * 2.0 + pos.x * 0.2 + pos.z * 0.15) * 0.1 * bendWeight;
                    }
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                
                uniform float uTime;
                uniform vec3 baseColor;
                uniform vec3 tipColor;
                uniform vec3 magicalColor;
                uniform float glowIntensity;
                
                varying vec2 vUv;
                varying float vBendWeight;
                varying float vMagicalIntensity;
                varying vec3 vWorldPosition;
                
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                }
                
                void main() {
                    // Basic grass color gradient
                    vec3 grassColor = mix(baseColor, tipColor, vUv.y);
                    
                    // Add magical coloring based on magical intensity
                    if (vMagicalIntensity > 0.5) {
                        float magicalMix = smoothstep(0.5, 1.0, vMagicalIntensity);
                        grassColor = mix(grassColor, magicalColor, magicalMix * 0.6);
                        
                        // Add magical glow
                        float glow = sin(uTime * 3.0 + vWorldPosition.x * 0.1 + vWorldPosition.z * 0.1) * 0.3 + 0.7;
                        grassColor += magicalColor * glow * glowIntensity * magicalMix;
                    }
                    
                    // Add sparkle effects on grass tips
                    if (vUv.y > 0.8) {
                        float sparkle = noise(vWorldPosition.xz * 2.0 + uTime);
                        sparkle = step(0.9, sparkle) * sin(uTime * 8.0) * 0.5 + 0.5;
                        grassColor += vec3(1.0, 1.0, 0.8) * sparkle * 0.5;
                    }
                    
                    // Fade edges for natural look
                    float alpha = 1.0;
                    if (vUv.x < 0.1 || vUv.x > 0.9) {
                        alpha *= smoothstep(0.0, 0.1, min(vUv.x, 1.0 - vUv.x));
                    }
                    
                    gl_FragColor = vec4(grassColor, alpha);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.1
        });
        
        // Create instanced mesh
        this.grassMesh = new THREE.InstancedMesh(
            grassBladeGeometry,
            grassMaterial,
            instanceCount
        );
        
        // Setup grass instances
        this.setupGrassInstances(instanceCount);
        
        this.grassMesh.name = 'magicalGrass';
        console.log(`🌱 Created ${instanceCount} magical grass blades`);
    }
    
    createGrassBladeGeometry() {
        // Create a grass blade shape using a custom geometry
        const geometry = new THREE.PlaneGeometry(0.8, 3, 1, 4);
        
        const positions = geometry.attributes.position.array;
        const bendWeights = [];
        
        // Modify geometry to create blade shape and calculate bend weights
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            
            // Taper the blade towards the top
            const heightFactor = (y + 1.5) / 3; // Normalize to 0-1
            positions[i] *= (1.0 - heightFactor * 0.3); // Taper X
            
            // Slight curve to the blade
            positions[i] += Math.sin(heightFactor * Math.PI) * 0.1;
            
            // Calculate bend weight (0 at base, 1 at tip)
            const bendWeight = Math.max(0, heightFactor);
            bendWeights.push(bendWeight);
        }
        
        // Add custom attributes
        geometry.setAttribute('bendWeight', new THREE.Float32BufferAttribute(bendWeights, 1));
        
        return geometry;
    }
    
    setupGrassInstances(instanceCount) {
        const dummy = new THREE.Object3D();
        const instancePositions = [];
        const instanceScales = [];
        const instanceRotations = [];
        const magicalIntensities = [];
        
        // Distribute grass across the terrain
        for (let i = 0; i < instanceCount; i++) {
            // Random position within terrain bounds
            const x = (Math.random() - 0.5) * 190; // Slightly smaller than terrain
            const z = (Math.random() - 0.5) * 190;
            
            // Get terrain height at this position
            const y = this.getTerrainHeightAtPosition(x, z);
            
            // Position the grass blade
            dummy.position.set(x, y, z);
            
            // Random rotation
            const rotation = Math.random() * Math.PI * 2;
            dummy.rotation.y = rotation;
            
            // Random scale with variation
            const scale = 0.5 + Math.random() * 0.8;
            dummy.scale.set(scale, scale, scale);
            
            // Calculate magical intensity based on position and noise
            const distanceFromCenter = Math.sqrt(x * x + z * z) / 100;
            const magicalNoise = Math.sin(x * 0.02) * Math.cos(z * 0.03) * 0.5 + 0.5;
            const magicalIntensity = (1.0 - distanceFromCenter * 0.5) * magicalNoise + Math.random() * 0.3;
            
            dummy.updateMatrix();
            this.grassMesh.setMatrixAt(i, dummy.matrix);
            
            // Store additional instance data for shaders
            instancePositions.push(x, y, z);
            instanceScales.push(scale);
            instanceRotations.push(rotation);
            magicalIntensities.push(Math.max(0, Math.min(1, magicalIntensity)));
        }
        
        // Add instance attributes
        this.grassMesh.geometry.setAttribute(
            'instancePosition',
            new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3)
        );
        this.grassMesh.geometry.setAttribute(
            'instanceScale',
            new THREE.InstancedBufferAttribute(new Float32Array(instanceScales), 1)
        );
        this.grassMesh.geometry.setAttribute(
            'instanceRotation',
            new THREE.InstancedBufferAttribute(new Float32Array(instanceRotations), 1)
        );
        this.grassMesh.geometry.setAttribute(
            'magicalIntensity',
            new THREE.InstancedBufferAttribute(new Float32Array(magicalIntensities), 1)
        );
        
        this.grassMesh.instanceMatrix.needsUpdate = true;
    }
    
    createMagicalEffects() {
        console.log('✨ Creating magical terrain effects...');
        
        // Create magical flowers scattered across the terrain
        this.createMagicalFlowers();
        
        // Create glowing mushrooms
        this.createGlowingMushrooms();
        
        // Create magical mist effects
        this.createMagicalMist();
    }
    
    createMagicalFlowers() {
        const flowerCount = 200;
        const flowerGeometry = new THREE.SphereGeometry(0.2, 6, 4);
        
        for (let i = 0; i < flowerCount; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            const y = this.getTerrainHeightAtPosition(x, z);
            
            // Random magical flower colors
            const colors = [0xFF69B4, 0x00FFFF, 0xFFD700, 0x9370DB, 0x00FF88];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const flowerMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(x, y + 0.3, z);
            flower.scale.setScalar(0.5 + Math.random() * 0.5);
            
            flower.userData = {
                originalY: y + 0.3,
                floatSpeed: 1.0 + Math.random() * 2.0,
                glowIntensity: Math.random()
            };
            
            this.magicalEffects.push(flower);
        }
    }
    
    createGlowingMushrooms() {
        const mushroomCount = 50;
        
        for (let i = 0; i < mushroomCount; i++) {
            const x = (Math.random() - 0.5) * 170;
            const z = (Math.random() - 0.5) * 170;
            const y = this.getTerrainHeightAtPosition(x, z);
            
            // Mushroom group
            const mushroomGroup = new THREE.Group();
            
            // Stem
            const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1);
            const stemMaterial = new THREE.MeshBasicMaterial({ color: 0xF5DEB3 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.y = 0.5;
            mushroomGroup.add(stem);
            
            // Cap
            const capGeometry = new THREE.SphereGeometry(0.4, 8, 6);
            const capMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF4500,
                emissive: 0x221100,
                emissiveIntensity: 0.3
            });
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.y = 1;
            cap.scale.y = 0.6;
            mushroomGroup.add(cap);
            
            mushroomGroup.position.set(x, y, z);
            mushroomGroup.scale.setScalar(0.3 + Math.random() * 0.4);
            
            // Add glow effect
            const glowLight = new THREE.PointLight(0xFF4500, 0.2, 5);
            glowLight.position.set(x, y + 1, z);
            
            mushroomGroup.userData = {
                light: glowLight,
                originalIntensity: 0.2,
                pulseSpeed: 1.0 + Math.random()
            };
            
            this.magicalEffects.push(mushroomGroup);
            this.magicalEffects.push(glowLight);
        }
    }
    
    createMagicalMist() {
        // Create subtle magical mist particles
        const mistCount = 100;
        const mistGeometry = new THREE.SphereGeometry(0.5, 6, 4);
        
        for (let i = 0; i < mistCount; i++) {
            const mistMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.1
            });
            
            const mist = new THREE.Mesh(mistGeometry, mistMaterial);
            
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            const y = this.getTerrainHeightAtPosition(x, z) + Math.random() * 5 + 2;
            
            mist.position.set(x, y, z);
            mist.scale.setScalar(1 + Math.random() * 2);
            
            mist.userData = {
                originalPosition: { x, y, z },
                driftSpeed: 0.5 + Math.random() * 1.0,
                floatAmplitude: 0.5 + Math.random() * 1.0
            };
            
            this.magicalEffects.push(mist);
        }
    }

    getTerrainHeightAtPosition(x, z) {
        let height = 0.0;
        // This must exactly match the terrainHeight function in the vertex shader
        height += Math.sin(x * 0.02) * 1.5 + Math.cos(z * 0.025) * 1.2;
        height += Math.sin(x * 0.08) * 0.5 + Math.cos(z * 0.09) * 0.4;
        
        // Add some of the magical effects (simplified for CPU calculation)
        height += Math.sin(x * 0.05) * 0.2; // Approximate magical undulation
        height += Math.cos(z * 0.04) * 0.15;
        
        return height;
    }
    
    update(deltaTime) {
        this.uniformTime += deltaTime;
        
        // Update terrain shader
        if (this.mesh.material.uniforms.uTime) {
            this.mesh.material.uniforms.uTime.value = this.uniformTime;
        }
        
        // Update grass shader
        if (this.grassMesh && this.grassMesh.material.uniforms.uTime) {
            this.grassMesh.material.uniforms.uTime.value = this.uniformTime;
            
            // Dynamic wind effects
            const windVariation = Math.sin(this.uniformTime * 0.5) * 0.05 + 0.15;
            this.grassMesh.material.uniforms.windStrength.value = windVariation;
            
            // Magical glow variation
            const magicalVariation = Math.sin(this.uniformTime * 0.3) * 0.1 + 0.3;
            this.grassMesh.material.uniforms.magicalGlow.value = magicalVariation;
        }
        
        // Update magical effects
        this.updateMagicalEffects(deltaTime);
    }
    
    updateMagicalEffects(deltaTime) {
        const time = this.uniformTime;
        
        this.magicalEffects.forEach(effect => {
            // Update floating flowers
            if (effect.userData && effect.userData.originalY !== undefined) {
                const floatOffset = Math.sin(time * effect.userData.floatSpeed) * 0.2;
                effect.position.y = effect.userData.originalY + floatOffset;
                
                // Glowing effect
                if (effect.material) {
                    const glow = Math.sin(time * 2 + effect.userData.glowIntensity * 5) * 0.2 + 0.8;
                    effect.material.opacity = glow * 0.8;
                }
            }
            
            // Update mushroom glow
            if (effect.userData && effect.userData.light) {
                const pulse = Math.sin(time * effect.userData.pulseSpeed) * 0.1 + 0.9;
                effect.userData.light.intensity = effect.userData.originalIntensity * pulse;
            }
            
            // Update mist movement
            if (effect.userData && effect.userData.originalPosition) {
                const drift = time * effect.userData.driftSpeed * 0.1;
                const float = Math.sin(time * 0.5 + effect.userData.originalPosition.x * 0.01) * effect.userData.floatAmplitude;
                
                effect.position.x = effect.userData.originalPosition.x + Math.sin(drift) * 5;
                effect.position.z = effect.userData.originalPosition.z + Math.cos(drift) * 5;
                effect.position.y = effect.userData.originalPosition.y + float;
                
                // Fade in and out
                const fade = Math.sin(time * 0.3 + effect.userData.originalPosition.z * 0.01) * 0.05 + 0.1;
                if (effect.material) {
                    effect.material.opacity = Math.max(0.02, fade);
                }
            }
        });
    }
    
    // Method to get all meshes for scene addition
    getAllMeshes() {
        const allMeshes = [this.mesh];
        
        if (this.grassMesh) {
            allMeshes.push(this.grassMesh);
        }
        
        // Add magical effect meshes
        this.magicalEffects.forEach(effect => {
            if (effect.type !== 'PointLight') {
                allMeshes.push(effect);
            }
        });
        
        return allMeshes;
    }
    
    // Method to get lights for scene addition
    getMagicalLights() {
        return this.magicalEffects.filter(effect => effect.type === 'PointLight');
    }
    
    dispose() {
        // Dispose terrain
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
        
        // Dispose grass
        if (this.grassMesh) {
            if (this.grassMesh.geometry) this.grassMesh.geometry.dispose();
            if (this.grassMesh.material) this.grassMesh.material.dispose();
        }
        
        // Dispose magical effects
        this.magicalEffects.forEach(effect => {
            if (effect.geometry) effect.geometry.dispose();
            if (effect.material) {
                if (Array.isArray(effect.material)) {
                    effect.material.forEach(mat => mat.dispose());
                } else {
                    effect.material.dispose();
                }
            }
        });
        
        this.magicalEffects = [];
        
        console.log('🌱✨ Magical Ground resources disposed');
    }
}