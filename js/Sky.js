// js/Sky.js - Ultra-Magical Sky with Integrated Mountain Ranges
export class Sky {
    constructor() {
        this.mesh = this.createUltraMagicalSkyWithMountains();
        this.uniformTime = 0;
    }

    createUltraMagicalSkyWithMountains() {
        const geometry = new THREE.SphereGeometry(1000, 64, 64); // Higher resolution for mountain details

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying float vMagicalIntensity;
                varying float vMountainMask;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    
                    // Calculate magical intensity based on position
                    vMagicalIntensity = smoothstep(-0.5, 1.0, position.y / 1000.0);
                    
                    // Create mountain mask based on horizon
                    vMountainMask = smoothstep(-0.2, 0.3, position.y / 1000.0);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying float vMagicalIntensity;
                varying float vMountainMask;
                uniform float uTime;

                // Enhanced mathematical functions for magical effects
                float hash(float n) { 
                    return fract(sin(n) * 43758.5453123); 
                }
                
                float hash2(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                }
                
                vec2 hash22(vec2 p) {
                    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
                    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
                }

                // Improved multi-octave noise
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);

                    return mix(
                        mix(hash2(i + vec2(0.0, 0.0)), hash2(i + vec2(1.0, 0.0)), u.x),
                        mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
                        u.y
                    );
                }

                // Magical swirling noise
                float swirlingNoise(vec2 p, float time) {
                    float angle = time * 0.1 + length(p) * 0.1;
                    vec2 swirl = vec2(cos(angle), sin(angle));
                    return noise(p + swirl * 2.0);
                }

                // Ultra-enhanced FBM with magical properties
                float magicalFbm(vec2 p, float time) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    float swirl = sin(time * 0.05) * 0.5;

                    for (int i = 0; i < 8; i++) {
                        vec2 swirlOffset = vec2(cos(time * 0.02 + float(i)), sin(time * 0.03 + float(i))) * swirl;
                        value += amplitude * swirlingNoise(p * frequency + swirlOffset, time);
                        frequency *= 2.0;
                        amplitude *= 0.45;
                    }
                    return value;
                }

                // Ridged noise for dramatic mountain formations
                float ridgedNoise(vec2 p) {
                    return 1.0 - abs(noise(p) * 2.0 - 1.0);
                }

                // MOUNTAIN GENERATION FUNCTIONS - ENHANCED VISIBILITY
                
                // Creates highly visible mountain silhouettes at horizon
                float distantMountains(vec2 uv, float time) {
                    // Only show mountains in the bottom portion of the sky
                    if (uv.y > 0.4) return 0.0;
                    
                    float mountains = 0.0;
                    
                    // Create prominent mountain silhouette
                    float mountainNoise = ridgedNoise(vec2(uv.x * 15.0, uv.y * 5.0 + time * 0.001));
                    mountainNoise = pow(mountainNoise, 1.5);
                    
                    // Base mountain height - much more prominent
                    float baseHeight = 0.25;
                    float peakHeight = mountainNoise * 0.15;
                    float totalHeight = baseHeight + peakHeight;
                    
                    // Create clear mountain silhouette
                    float mountainMask = step(uv.y, totalHeight);
                    
                    // Add secondary mountain range for depth
                    float secondRange = ridgedNoise(vec2(uv.x * 12.0 + 5.0, uv.y * 4.0));
                    secondRange = pow(secondRange, 2.0);
                    float secondHeight = 0.2 + secondRange * 0.1;
                    float secondMask = step(uv.y, secondHeight);
                    
                    // Combine mountain ranges
                    mountains = max(mountainMask, secondMask * 0.8);
                    
                    return clamp(mountains, 0.0, 1.0);
                }

                // Creates visible floating islands
                float floatingMountainIslands(vec2 uv, float time) {
                    float islands = 0.0;
                    
                    // Create 3 clear floating islands
                    for (int i = 0; i < 3; i++) {
                        float islandTime = time * 0.02 + float(i) * 2.0;
                        
                        // Island positions - more spread out and visible
                        vec2 islandCenter = vec2(
                            float(i) * 0.6 - 0.8 + sin(islandTime) * 0.1,
                            0.6 + float(i) * 0.1 + cos(islandTime * 0.7) * 0.03
                        );
                        
                        // Much simpler, more visible island shape
                        float islandDist = distance(uv, islandCenter);
                        float islandSize = 0.08 + float(i) * 0.02;
                        
                        // Create solid island silhouette
                        float islandMask = smoothstep(islandSize + 0.02, islandSize - 0.01, islandDist);
                        
                        // Add some texture but keep it simple
                        float islandTexture = noise(uv * 30.0) * 0.3 + 0.7;
                        islands += islandMask * islandTexture;
                    }
                    
                    return clamp(islands, 0.0, 1.0);
                }

                // Simple snow caps that are clearly visible
                float mountainSnowCaps(vec2 uv, float mountainMask, float time) {
                    if (mountainMask < 0.5 || uv.y < 0.2) return 0.0;
                    
                    // Clear snow line
                    float snowLine = 0.2;
                    float snowMask = smoothstep(snowLine, snowLine + 0.05, uv.y);
                    snowMask *= mountainMask;
                    
                    // Add sparkle to snow
                    float sparkle = noise(uv * 80.0 + time * 0.1) * 0.4 + 0.6;
                    
                    return snowMask * sparkle;
                }

                // Visible mountain glow effects
                float mountainAura(vec2 uv, float mountainMask, float time) {
                    if (mountainMask < 0.3) return 0.0;
                    
                    // Simple pulsing glow
                    float pulse = sin(time * 0.5 + uv.x * 8.0) * 0.3 + 0.7;
                    float glow = mountainMask * pulse * 0.4;
                    
                    return glow;
                }

                // Clear aurora effects above mountains
                float mountainAurora(vec2 uv, float mountainMask, float time) {
                    if (mountainMask < 0.1) return 0.0;
                    
                    // Aurora ribbons above mountains
                    float wave = sin(uv.x * 10.0 + time * 0.3) * 0.5 + 0.5;
                    float heightMask = smoothstep(0.25, 0.5, uv.y);
                    float mountainInfluence = smoothstep(0.1, 0.8, mountainMask);
                    
                    return wave * heightMask * mountainInfluence * 0.5;
                }

                // Magical aurora generation (enhanced)
                float skyAurora(vec2 uv, float time) {
                    float wave1 = sin(uv.x * 8.0 + time * 0.5) * 0.5 + 0.5;
                    float wave2 = sin(uv.x * 12.0 + time * 0.3 + 1.5) * 0.5 + 0.5;
                    float wave3 = sin(uv.x * 6.0 + time * 0.7 + 3.0) * 0.5 + 0.5;
                    
                    float waves = (wave1 + wave2 + wave3) / 3.0;
                    float auroraIntensity = pow(waves, 3.0);
                    
                    float heightMask = smoothstep(0.4, 0.9, uv.y);
                    return auroraIntensity * heightMask;
                }

                // Floating magical orbs (enhanced)
                float magicalOrbs(vec2 uv, float time) {
                    float orbs = 0.0;
                    
                    for (int i = 0; i < 6; i++) {
                        float orbTime = time * (0.08 + float(i) * 0.03);
                        vec2 orbPos = vec2(
                            sin(orbTime + float(i) * 2.0) * 0.4,
                            cos(orbTime * 0.7 + float(i) * 1.5) * 0.25 + 0.6
                        );
                        
                        float dist = distance(uv, orbPos);
                        float orb = exp(-dist * 25.0) * (sin(time * 2.0 + float(i)) * 0.3 + 0.7);
                        orbs += orb;
                    }
                    
                    return orbs;
                }

                // Simple magical stars
                float simpleStars(vec2 uv, float time) {
                    float stars = 0.0;
                    
                    float starNoise = noise(uv * 100.0);
                    float starMask = step(0.98, starNoise);
                    float twinkle = sin(time * 4.0 + starNoise * 20.0) * 0.3 + 0.7;
                    
                    stars = starMask * twinkle * smoothstep(0.5, 1.0, uv.y);
                    
                    return stars;
                }

                // Smooth magical energy flows
                float smoothEnergyFlows(vec2 uv, float time) {
                    float energy = 0.0;
                    
                    for (int i = 0; i < 3; i++) {
                        float flowTime = time * (0.1 + float(i) * 0.05);
                        vec2 flowDirection = vec2(sin(flowTime + float(i)), cos(flowTime * 0.7 + float(i)));
                        
                        float flow = noise(uv * 5.0 + flowDirection * flowTime);
                        float flowMask = smoothstep(0.6, 0.8, flow);
                        
                        energy += flowMask * 0.2;
                    }
                    
                    return energy * smoothstep(0.3, 0.8, uv.y);
                }

                void main() {
                    vec2 uv = vUv;
                    float time = uTime;
                    
                    // Enhanced sky gradient with magical color shifts
                    float skyGradient = smoothstep(-1.0, 1.0, vPosition.y / 1000.0);
                    
                    // Dynamic magical color palette
                    float colorShift = sin(time * 0.08) * 0.5 + 0.5;
                    float magicalPhase = sin(time * 0.03) * 0.3 + 0.7;
                    
                    // Base sky colors with magical enhancement
                    vec3 horizonColor = mix(
                        vec3(0.9, 0.7, 1.0),     // Magical purple-pink
                        vec3(0.7, 0.9, 1.0),     // Magical blue-cyan
                        colorShift
                    );
                    vec3 midSkyColor = mix(
                        vec3(0.6, 0.4, 0.9),     // Deep magical purple
                        vec3(0.4, 0.7, 0.95),    // Magical sky blue
                        colorShift
                    ) * magicalPhase;
                    vec3 zenithColor = mix(
                        vec3(0.2, 0.1, 0.6),     // Deep night purple
                        vec3(0.1, 0.3, 0.7),     // Deep magical blue
                        colorShift
                    );
                    
                    // Multi-stage gradient
                    vec3 baseColor = mix(horizonColor, midSkyColor, smoothstep(0.0, 0.5, skyGradient));
                    baseColor = mix(baseColor, zenithColor, smoothstep(0.5, 1.0, skyGradient));
                    
                    // ===== MOUNTAIN INTEGRATION - ENHANCED VISIBILITY =====
                    
                    // Generate mountain layers with much higher contrast
                    float distantMountainMask = distantMountains(uv, time);
                    float floatingIslands = floatingMountainIslands(uv, time);
                    
                    // Mountain colors - MUCH MORE CONTRASTED and visible
                    vec3 distantMountainColor = vec3(0.1, 0.1, 0.2); // Very dark silhouettes
                    vec3 floatingIslandColor = vec3(0.15, 0.1, 0.25); // Dark purple islands
                    
                    // Apply mountain base colors with HIGH CONTRAST
                    vec3 skyWithMountains = mix(baseColor, distantMountainColor, distantMountainMask);
                    skyWithMountains = mix(skyWithMountains, floatingIslandColor, floatingIslands);
                    
                    // Add highly visible snow caps
                    float mountainSnow = mountainSnowCaps(uv, distantMountainMask, time);
                    vec3 snowColor = vec3(1.0, 1.0, 1.0); // Pure white snow
                    skyWithMountains = mix(skyWithMountains, snowColor, mountainSnow);
                    
                    // Bright mountain aura effects
                    float mountainGlow = mountainAura(uv, distantMountainMask, time);
                    vec3 auraColor = mix(
                        vec3(1.0, 0.5, 1.0),     // Bright purple mountain aura
                        vec3(0.5, 1.0, 1.0),     // Bright cyan mountain aura
                        colorShift
                    );
                    skyWithMountains += auraColor * mountainGlow;
                    
                    // Bright aurora effects around mountains
                    float mountainAuroraEffect = mountainAurora(uv, distantMountainMask, time);
                    vec3 mountainAuroraColor = mix(
                        vec3(0.0, 1.0, 0.8),     // Bright green mountain aurora
                        vec3(0.8, 0.0, 1.0),     // Bright purple mountain aurora
                        sin(time * 0.15) * 0.5 + 0.5
                    );
                    skyWithMountains += mountainAuroraColor * mountainAuroraEffect;
                    
                    // ===== CLOUD SYSTEM =====
                    
                    float cloudScale = 2.5;
                    float timeScale = 0.004;
                    
                    float mainClouds = magicalFbm(uv * cloudScale, time * timeScale);
                    float detailClouds = magicalFbm(uv * cloudScale * 2.5, time * timeScale * 1.5);
                    float wisps = magicalFbm(uv * cloudScale * 0.8, time * timeScale * 0.5);
                    
                    float clouds = mainClouds * 0.5 + detailClouds * 0.3 + wisps * 0.2;
                    float cloudMask = smoothstep(0.35, 0.8, clouds);
                    
                    // Magical cloud colors
                    vec3 cloudColor = mix(
                        vec3(0.9, 0.85, 1.0),    // Magical white-purple
                        vec3(0.85, 0.9, 1.0),    // Magical white-blue
                        colorShift
                    );
                    
                    skyWithMountains = mix(skyWithMountains, cloudColor, cloudMask * 0.7);
                    
                    // ===== MAGICAL SKY EFFECTS =====
                    
                    // Sky Aurora
                    float auroraEffect = skyAurora(uv, time);
                    vec3 skyAuroraColor = mix(
                        vec3(0.0, 1.0, 0.5),     // Green aurora
                        vec3(0.5, 0.0, 1.0),     // Purple aurora
                        sin(time * 0.1) * 0.5 + 0.5
                    );
                    skyWithMountains += skyAuroraColor * auroraEffect * 0.4;
                    
                    // Floating Magical Orbs
                    float orbs = magicalOrbs(uv, time);
                    vec3 orbColor = mix(
                        vec3(1.0, 0.8, 0.2),     // Golden orbs
                        vec3(0.2, 0.8, 1.0),     // Blue orbs
                        sin(time * 0.15) * 0.5 + 0.5
                    );
                    skyWithMountains += orbColor * orbs * 0.6;
                    
                    // Simple Magical Stars
                    float stars = simpleStars(uv, time);
                    vec3 starColor = vec3(1.0, 1.0, 0.8) + vec3(sin(time * 0.2), cos(time * 0.25), sin(time * 0.18)) * 0.2;
                    skyWithMountains += starColor * stars * 0.5;
                    
                    // Smooth Energy Flows
                    float flows = smoothEnergyFlows(uv, time);
                    vec3 flowColor = mix(
                        vec3(0.0, 1.0, 1.0),     // Cyan flows
                        vec3(1.0, 0.0, 1.0),     // Magenta flows
                        sin(time * 0.12) * 0.5 + 0.5
                    );
                    skyWithMountains += flowColor * flows * vMagicalIntensity;
                    
                    // Enhanced Magical Sparkles
                    float sparkleThreshold = 0.9985;
                    float sparkleSize = 0.997;
                    float sparkle = step(sparkleSize, hash2(floor(uv * 800.0) + floor(time * 2.0)));
                    sparkle *= step(sparkleThreshold, hash2(floor(uv * 400.0) + floor(time * 0.7)));
                    
                    float twinkle = sin(time * 8.0 + hash2(floor(uv * 800.0)) * 20.0) * 0.5 + 0.5;
                    sparkle *= twinkle;
                    
                    vec3 sparkleColor = mix(
                        vec3(1.0, 1.0, 0.7),     // Golden sparkles
                        vec3(0.7, 1.0, 1.0),     // Diamond sparkles
                        hash2(floor(uv * 800.0))
                    );
                    skyWithMountains += sparkleColor * sparkle * vMagicalIntensity * 0.8;
                    
                    // Final magical atmosphere enhancement
                    float atmosphericGlow = pow(1.0 - skyGradient, 2.0) * 0.15;
                    vec3 atmosphereColor = mix(
                        vec3(1.0, 0.7, 1.0),     // Purple atmosphere
                        vec3(0.7, 1.0, 1.0),     // Cyan atmosphere
                        colorShift
                    );
                    skyWithMountains += atmosphereColor * atmosphericGlow;
                    
                    // Final color grading for maximum magical impact
                    skyWithMountains = pow(skyWithMountains, vec3(0.9));
                    skyWithMountains = mix(skyWithMountains, skyWithMountains * skyWithMountains, 0.15);
                    skyWithMountains *= 1.1;
                    
                    skyWithMountains = min(skyWithMountains, vec3(1.0));

                    gl_FragColor = vec4(skyWithMountains, 1.0);
                }
            `,
            uniforms: {
                uTime: { value: 0.0 }
            },
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false
        });

        const skyMesh = new THREE.Mesh(geometry, material);
        skyMesh.renderOrder = -1000;
        skyMesh.name = 'ultraMagicalSkyWithMountains';
        
        return skyMesh;
    }
    
    update(deltaTime) {
        this.uniformTime += deltaTime;
        if (this.mesh.material.uniforms.uTime) {
            this.mesh.material.uniforms.uTime.value = this.uniformTime;
        }
    }
    
    dispose() {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
    }
}