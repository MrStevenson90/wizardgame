// js/Trees_rocks.js - Enhanced Magical Forest System
export class TreesRocks {
    constructor() {
        this.meshes = [];
        this.trees = [];
        this.rocks = [];
        this.magicalEffects = [];
        
        // Enhanced magical materials
        this.materials = {
            // Magical Tree Materials
            mysticTrunk: new THREE.MeshLambertMaterial({ 
                color: 0x4A3C28,
                emissive: 0x221100,
                emissiveIntensity: 0.1
            }),
            enchantedLeaves: new THREE.MeshLambertMaterial({ 
                color: 0x2E8B2E,
                emissive: 0x004400,
                emissiveIntensity: 0.15
            }),
            
            // Crystal Tree Materials
            crystalTrunk: new THREE.MeshLambertMaterial({ 
                color: 0x6A5ACD,
                emissive: 0x2F1B69,
                emissiveIntensity: 0.2
            }),
            crystalLeaves: new THREE.MeshLambertMaterial({ 
                color: 0x00FFFF,
                emissive: 0x004444,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.8
            }),
            
            // Ancient Tree Materials
            ancientTrunk: new THREE.MeshLambertMaterial({ 
                color: 0x8B4513,
                emissive: 0x331100,
                emissiveIntensity: 0.05
            }),
            ancientLeaves: new THREE.MeshLambertMaterial({ 
                color: 0xFFD700,
                emissive: 0x443300,
                emissiveIntensity: 0.2
            }),
            
            // Ethereal Tree Materials
            etherealTrunk: new THREE.MeshLambertMaterial({ 
                color: 0xDDA0DD,
                emissive: 0x443344,
                emissiveIntensity: 0.25,
                transparent: true,
                opacity: 0.9
            }),
            etherealLeaves: new THREE.MeshLambertMaterial({ 
                color: 0xFF69B4,
                emissive: 0x441144,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.7
            }),
            
            // Elemental Tree Materials
            flameTrunk: new THREE.MeshLambertMaterial({ 
                color: 0x8B0000,
                emissive: 0x440000,
                emissiveIntensity: 0.3
            }),
            flameLeaves: new THREE.MeshLambertMaterial({ 
                color: 0xFF4500,
                emissive: 0x441100,
                emissiveIntensity: 0.5
            }),
            
            iceTrunk: new THREE.MeshLambertMaterial({ 
                color: 0x87CEEB,
                emissive: 0x224466,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.9
            }),
            iceLeaves: new THREE.MeshLambertMaterial({ 
                color: 0xE0FFFF,
                emissive: 0x002244,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.8
            }),
            
            // Enhanced Rock Materials
            magicalRock: new THREE.MeshLambertMaterial({ 
                color: 0x696969,
                emissive: 0x111122,
                emissiveIntensity: 0.1
            }),
            enchantedStone: new THREE.MeshLambertMaterial({ 
                color: 0x4682B4,
                emissive: 0x001122,
                emissiveIntensity: 0.15
            }),
            crystalRock: new THREE.MeshLambertMaterial({ 
                color: 0x9370DB,
                emissive: 0x221144,
                emissiveIntensity: 0.25,
                transparent: true,
                opacity: 0.9
            }),
            obsidianRock: new THREE.MeshLambertMaterial({ 
                color: 0x2F2F2F,
                emissive: 0x440044,
                emissiveIntensity: 0.2
            })
        };
        
        // Magical tree type definitions
        this.MAGICAL_TREE_TYPES = {
            MYSTIC_OAK: {
                name: 'Mystic Oak',
                trunkMaterial: 'mysticTrunk',
                leavesMaterial: 'enchantedLeaves',
                trunkGeometry: { radiusTop: 0.8, radiusBottom: 1.2, height: 8 },
                leavesGeometry: { radius: 4, widthSegments: 8, heightSegments: 6 },
                leafLayers: 3,
                baseScale: { min: 1.0, max: 2.5 },
                magicalIntensity: 0.3,
                hasAura: true
            },
            
            CRYSTAL_WILLOW: {
                name: 'Crystal Willow',
                trunkMaterial: 'crystalTrunk',
                leavesMaterial: 'crystalLeaves',
                trunkGeometry: { radiusTop: 0.6, radiusBottom: 1.0, height: 12 },
                leavesGeometry: { radius: 3, widthSegments: 8, heightSegments: 6 },
                leafLayers: 5,
                baseScale: { min: 1.2, max: 3.0 },
                magicalIntensity: 0.5,
                hasAura: true,
                hasSparkles: true
            },
            
            ANCIENT_GUARDIAN: {
                name: 'Ancient Guardian',
                trunkMaterial: 'ancientTrunk',
                leavesMaterial: 'ancientLeaves',
                trunkGeometry: { radiusTop: 1.5, radiusBottom: 2.0, height: 15 },
                leavesGeometry: { radius: 6, widthSegments: 12, heightSegments: 8 },
                leafLayers: 4,
                baseScale: { min: 2.0, max: 4.0 },
                magicalIntensity: 0.7,
                hasAura: true,
                hasRunes: true
            },
            
            ETHEREAL_BIRCH: {
                name: 'Ethereal Birch',
                trunkMaterial: 'etherealTrunk',
                leavesMaterial: 'etherealLeaves',
                trunkGeometry: { radiusTop: 0.4, radiusBottom: 0.6, height: 10 },
                leavesGeometry: { radius: 2.5, widthSegments: 6, heightSegments: 4 },
                leafLayers: 4,
                baseScale: { min: 0.8, max: 2.0 },
                magicalIntensity: 0.6,
                hasAura: true,
                transparent: true
            },
            
            FLAME_MAPLE: {
                name: 'Flame Maple',
                trunkMaterial: 'flameTrunk',
                leavesMaterial: 'flameLeaves',
                trunkGeometry: { radiusTop: 0.7, radiusBottom: 1.1, height: 9 },
                leavesGeometry: { radius: 3.5, widthSegments: 8, heightSegments: 6 },
                leafLayers: 3,
                baseScale: { min: 1.0, max: 2.2 },
                magicalIntensity: 0.8,
                hasAura: true,
                hasEmbers: true
            },
            
            FROST_PINE: {
                name: 'Frost Pine',
                trunkMaterial: 'iceTrunk',
                leavesMaterial: 'iceLeaves',
                trunkGeometry: { radiusTop: 0.5, radiusBottom: 0.8, height: 14 },
                leavesGeometry: { radius: 2, widthSegments: 6, heightSegments: 4 },
                leafLayers: 6,
                baseScale: { min: 1.1, max: 2.8 },
                magicalIntensity: 0.4,
                hasAura: true,
                hasSnow: true
            },
            
            RAINBOW_EUCALYPTUS: {
                name: 'Rainbow Eucalyptus',
                trunkMaterial: 'mysticTrunk',
                leavesMaterial: 'enchantedLeaves',
                trunkGeometry: { radiusTop: 0.6, radiusBottom: 0.9, height: 16 },
                leavesGeometry: { radius: 3, widthSegments: 8, heightSegments: 6 },
                leafLayers: 4,
                baseScale: { min: 1.3, max: 3.2 },
                magicalIntensity: 0.9,
                hasAura: true,
                hasRainbow: true
            },
            
            SHADOW_CYPRESS: {
                name: 'Shadow Cypress',
                trunkMaterial: 'ancientTrunk',
                leavesMaterial: 'mysticTrunk', // Dark leaves
                trunkGeometry: { radiusTop: 0.8, radiusBottom: 1.3, height: 18 },
                leavesGeometry: { radius: 4, widthSegments: 8, heightSegments: 6 },
                leafLayers: 5,
                baseScale: { min: 1.5, max: 3.5 },
                magicalIntensity: 0.3,
                hasAura: true,
                isDark: true
            }
        };
        
        this.ROCK_TYPES = {
            MAGICAL_BOULDER: {
                name: 'Magical Boulder',
                material: 'magicalRock',
                geometry: { radius: 2, detail: 1 },
                baseScale: { min: 1.0, max: 2.5 },
                hasGlow: true
            },
            ENCHANTED_STONE: {
                name: 'Enchanted Stone',
                material: 'enchantedStone',
                geometry: { radius: 1.5, detail: 0 },
                baseScale: { min: 0.8, max: 2.0 },
                hasGlow: true,
                hasPulse: true
            },
            CRYSTAL_FORMATION: {
                name: 'Crystal Formation',
                material: 'crystalRock',
                geometry: { radius: 1.8, detail: 2 },
                baseScale: { min: 1.2, max: 3.0 },
                hasGlow: true,
                hasSparkle: true
            },
            OBSIDIAN_SHARD: {
                name: 'Obsidian Shard',
                material: 'obsidianRock',
                geometry: { radius: 1.3, detail: 1 },
                baseScale: { min: 0.9, max: 2.2 },
                hasGlow: true,
                isDark: true
            }
        };
        
        this.createEnvironment();
    }
    
    _displaceGeometryVertices(geometry, noiseFactor) {
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (Math.random() - 0.5) * noiseFactor;
            vertices[i+1] += (Math.random() - 0.5) * noiseFactor;
            vertices[i+2] += (Math.random() - 0.5) * noiseFactor;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
    }

    createEnvironment(treeCount = 30, rockCount = 20, areaSize = 180) {
        // Enhanced tree count (1.5x more trees for magical forest feel)
        const enhancedTreeCount = Math.floor(treeCount * 1.5);
        const enhancedRockCount = Math.floor(rockCount * 1.2);
        
        console.log(`🌳✨ Creating magical environment with ${enhancedTreeCount} trees and ${enhancedRockCount} rocks...`);
        
        // Create magical trees
        for (let i = 0; i < enhancedTreeCount; i++) {
            const x = (Math.random() - 0.5) * areaSize;
            const z = (Math.random() - 0.5) * areaSize;
            
            // Basic exclusion zone around the center
            if (Math.sqrt(x*x + z*z) < 25) continue;
            
            const treeGroup = this.createMagicalTree(x, z);
            if (treeGroup) {
                this.meshes.push(treeGroup);
                this.trees.push(treeGroup);
            }
        }
        
        // Create enhanced magical rocks
        for (let i = 0; i < enhancedRockCount; i++) {
            const x = (Math.random() - 0.5) * areaSize;
            const z = (Math.random() - 0.5) * areaSize;
            if (Math.sqrt(x*x + z*z) < 20) continue;

            const rock = this.createEnhancedRock(x, z);
            if (rock) {
                this.meshes.push(rock);
                this.rocks.push(rock);
            }
        }
        
        console.log(`🌳✨ Created magical environment: ${this.trees.length} trees, ${this.rocks.length} rocks`);
    }
    
    createMagicalTree(x, z) {
        // Randomly select tree type
        const treeTypeKeys = Object.keys(this.MAGICAL_TREE_TYPES);
        const randomTypeKey = treeTypeKeys[Math.floor(Math.random() * treeTypeKeys.length)];
        const treeType = this.MAGICAL_TREE_TYPES[randomTypeKey];
        
        const group = new THREE.Group();
        
        // Create magical trunk
        const trunkGeometry = new THREE.CylinderGeometry(
            treeType.trunkGeometry.radiusTop,
            treeType.trunkGeometry.radiusBottom,
            treeType.trunkGeometry.height,
            8
        );
        const trunk = new THREE.Mesh(trunkGeometry, this.materials[treeType.trunkMaterial]);
        trunk.position.y = treeType.trunkGeometry.height / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Create magical leaf layers
        for (let i = 0; i < treeType.leafLayers; i++) {
            const leafGeometry = new THREE.SphereGeometry(
                treeType.leavesGeometry.radius,
                treeType.leavesGeometry.widthSegments,
                treeType.leavesGeometry.heightSegments
            );
            
            const foliage = new THREE.Mesh(leafGeometry, this.materials[treeType.leavesMaterial]);
            
            // Position leaf layers with variation
            const layerHeight = treeType.trunkGeometry.height * 0.6 + (i + 1) * 2;
            foliage.position.y = layerHeight;
            foliage.position.x += (Math.random() - 0.5) * 1.0;
            foliage.position.z += (Math.random() - 0.5) * 1.0;
            
            // Vary leaf size and flatten slightly for natural look
            const sizeVariation = 0.7 + Math.random() * 0.6;
            foliage.scale.set(sizeVariation, sizeVariation * 0.8, sizeVariation);
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            
            group.add(foliage);
        }
        
        // Apply magical scaling
        const scale = treeType.baseScale.min + 
                     Math.random() * (treeType.baseScale.max - treeType.baseScale.min);
        group.scale.setScalar(scale);
        
        group.position.set(x, 0, z);
        group.userData = {
            treeType: treeType.name,
            magicalIntensity: treeType.magicalIntensity,
            originalScale: scale
        };
        
        // Add magical effects
        this.addMagicalTreeEffects(group, treeType);
        
        return group;
    }
    
    addMagicalTreeEffects(treeGroup, treeType) {
        // Add magical aura
        if (treeType.hasAura) {
            const auraLight = new THREE.PointLight(
                treeType.hasRainbow ? 0xFFFFFF : 
                treeType.hasEmbers ? 0xFF4500 :
                treeType.hasSnow ? 0x87CEEB :
                treeType.isDark ? 0x4B0082 : 0x00FFAA,
                treeType.magicalIntensity * 0.3,
                20
            );
            auraLight.position.y = 8;
            treeGroup.add(auraLight);
        }
        
        // Add sparkle effects for crystal trees
        if (treeType.hasSparkles) {
            this.addSparkleEffect(treeGroup);
        }
        
        // Add floating runes for ancient trees
        if (treeType.hasRunes) {
            this.addRuneEffect(treeGroup);
        }
        
        // Add ember effects for flame trees
        if (treeType.hasEmbers) {
            this.addEmberEffect(treeGroup);
        }
        
        // Add snow effect for frost trees
        if (treeType.hasSnow) {
            this.addSnowEffect(treeGroup);
        }
        
        // Add rainbow effect
        if (treeType.hasRainbow) {
            this.addRainbowEffect(treeGroup);
        }
    }
    
    addSparkleEffect(treeGroup) {
        // Create small sparkle particles around the tree
        for (let i = 0; i < 8; i++) {
            const sparkleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const sparkleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.8
            });
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
            
            sparkle.position.set(
                (Math.random() - 0.5) * 8,
                Math.random() * 12 + 3,
                (Math.random() - 0.5) * 8
            );
            
            treeGroup.add(sparkle);
        }
    }
    
    addRuneEffect(treeGroup) {
        // Add floating magical runes around ancient trees
        const runeGeometry = new THREE.RingGeometry(0.5, 0.8, 6);
        const runeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 3; i++) {
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(
                (Math.random() - 0.5) * 6,
                Math.random() * 8 + 5,
                (Math.random() - 0.5) * 6
            );
            rune.rotation.x = Math.random() * Math.PI;
            rune.rotation.y = Math.random() * Math.PI;
            treeGroup.add(rune);
        }
    }
    
    addEmberEffect(treeGroup) {
        // Add glowing embers around flame trees
        for (let i = 0; i < 12; i++) {
            const emberGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const emberMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF6600,
                transparent: true,
                opacity: 0.9
            });
            const ember = new THREE.Mesh(emberGeometry, emberMaterial);
            
            ember.position.set(
                (Math.random() - 0.5) * 10,
                Math.random() * 15 + 2,
                (Math.random() - 0.5) * 10
            );
            
            treeGroup.add(ember);
        }
    }
    
    addSnowEffect(treeGroup) {
        // Add snow particles around frost trees
        for (let i = 0; i < 15; i++) {
            const snowGeometry = new THREE.SphereGeometry(0.08, 4, 4);
            const snowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.7
            });
            const snowflake = new THREE.Mesh(snowGeometry, snowMaterial);
            
            snowflake.position.set(
                (Math.random() - 0.5) * 12,
                Math.random() * 18 + 1,
                (Math.random() - 0.5) * 12
            );
            
            treeGroup.add(snowflake);
        }
    }
    
    addRainbowEffect(treeGroup) {
        // Add subtle rainbow shimmer to leaves
        treeGroup.children.forEach(child => {
            if (child.material && child.material.color && child !== treeGroup.children[0]) { // Skip trunk
                // Add rainbow tint by modifying emissive
                child.material.emissive.setRGB(
                    Math.random() * 0.1,
                    Math.random() * 0.1,
                    Math.random() * 0.1
                );
                child.material.emissiveIntensity = 0.3;
            }
        });
    }
    
    createEnhancedRock(x, z) {
        // Randomly select rock type
        const rockTypeKeys = Object.keys(this.ROCK_TYPES);
        const randomTypeKey = rockTypeKeys[Math.floor(Math.random() * rockTypeKeys.length)];
        const rockType = this.ROCK_TYPES[randomTypeKey];
        
        // Create more solid, detailed rock geometry
        let geometry = new THREE.IcosahedronGeometry(
            rockType.geometry.radius,
            rockType.geometry.detail
        );
        
        // Add displacement for natural rock texture
        geometry = this._displaceGeometryVertices(geometry, rockType.geometry.radius * 0.3);
        
        const mesh = new THREE.Mesh(geometry, this.materials[rockType.material]);
        
        // Apply scaling
        const scale = rockType.baseScale.min + 
                     Math.random() * (rockType.baseScale.max - rockType.baseScale.min);
        mesh.scale.setScalar(scale);
        
        mesh.position.set(x, scale * rockType.geometry.radius * 0.5, z);
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData = {
            rockType: rockType.name,
            originalScale: scale
        };
        
        // Add magical rock effects
        if (rockType.hasGlow) {
            this.addRockGlow(mesh, rockType);
        }
        
        if (rockType.hasSparkle) {
            this.addRockSparkle(mesh);
        }
        
        return mesh;
    }
    
    addRockGlow(rock, rockType) {
        // Add point light for glowing rocks
        const glowColor = rockType.isDark ? 0x4B0082 :
                         rockType.name.includes('Crystal') ? 0x9370DB :
                         rockType.name.includes('Enchanted') ? 0x4682B4 : 0x666666;
        
        const glowLight = new THREE.PointLight(glowColor, 0.2, 10);
        glowLight.position.copy(rock.position);
        glowLight.position.y += 1;
        
        // Add pulsing effect for certain rock types
        if (rockType.hasPulse) {
            glowLight.userData.isPulsing = true;
            glowLight.userData.originalIntensity = 0.2;
        }
        
        this.magicalEffects.push(glowLight);
        return glowLight;
    }
    
    addRockSparkle(rock) {
        // Add small sparkle effects around crystal rocks
        for (let i = 0; i < 5; i++) {
            const sparkleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const sparkleMaterial = new THREE.MeshBasicMaterial({
                color: 0x9370DB,
                transparent: true,
                opacity: 0.7
            });
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
            
            sparkle.position.copy(rock.position);
            sparkle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 3,
                (Math.random() - 0.5) * 4
            ));
            
            this.magicalEffects.push(sparkle);
        }
    }
    
    // Method to update magical effects over time
    update(deltaTime) {
        const time = Date.now() * 0.001;
        
        // Update pulsing rock effects
        this.magicalEffects.forEach(effect => {
            if (effect.userData && effect.userData.isPulsing) {
                const pulse = Math.sin(time * 2) * 0.1 + 0.9;
                effect.intensity = effect.userData.originalIntensity * pulse;
            }
        });
        
        // Animate tree sparkles
        this.trees.forEach(tree => {
            tree.children.forEach(child => {
                if (child.material && child.material.transparent && child.geometry.parameters && child.geometry.parameters.radius < 0.2) {
                    // Animate sparkles
                    child.rotation.y += deltaTime * 2;
                    child.position.y += Math.sin(time * 3 + child.position.x) * 0.02;
                    
                    // Twinkling opacity
                    child.material.opacity = 0.3 + Math.sin(time * 4 + child.position.z) * 0.5;
                }
            });
        });
        
        // Animate floating runes
        this.trees.forEach(tree => {
            if (tree.userData.treeType === 'Ancient Guardian') {
                tree.children.forEach(child => {
                    if (child.geometry && child.geometry.parameters && child.geometry.parameters.innerRadius !== undefined) {
                        // Rotate runes
                        child.rotation.z += deltaTime * 0.5;
                        child.position.y += Math.sin(time * 2 + child.position.x) * 0.01;
                    }
                });
            }
        });
    }
    
    // Method to get all meshes for scene addition
    getAllMeshes() {
        const allMeshes = [...this.meshes];
        
        // Add magical effect meshes
        this.magicalEffects.forEach(effect => {
            if (effect.type !== 'PointLight') { // Only add mesh effects, not lights
                allMeshes.push(effect);
            }
        });
        
        return allMeshes;
    }
    
    // Method to get all lights for scene addition
    getMagicalLights() {
        return this.magicalEffects.filter(effect => effect.type === 'PointLight');
    }
    
    // Enhanced disposal method
    dispose() {
        // Dispose trees
        this.trees.forEach(tree => {
            tree.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        
        // Dispose rocks
        this.rocks.forEach(rock => {
            if (rock.geometry) rock.geometry.dispose();
            if (rock.material) rock.material.dispose();
        });
        
        // Dispose magical effects
        this.magicalEffects.forEach(effect => {
            if (effect.geometry) effect.geometry.dispose();
            if (effect.material) effect.material.dispose();
        });
        
        // Dispose materials
        Object.values(this.materials).forEach(material => {
            if (material && typeof material.dispose === 'function') {
                material.dispose();
            }
        });
        
        this.meshes = [];
        this.trees = [];
        this.rocks = [];
        this.magicalEffects = [];
        this.materials = {};
        
        console.log('🌳✨ Magical TreesRocks resources disposed');
    }
}