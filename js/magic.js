// js/magic.js
export class Magic {
    constructor(scene) {
        this.scene = scene;
        this.effects = [];
    }

    /**
     * Creates a particle effect at a given position.
     * @param {THREE.Vector3} position - The world position to create the effect at.
     */
    createSpellEffect(position) {
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const pMaterial = new THREE.PointsMaterial({
            color: 0xFFD700,
            size: 0.5,
            map: this.createParticleTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.8
        });

        const pPositions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Start all particles at the effect's center
            const vertex = position.clone();
            vertex.toArray(pPositions, i * 3);

            // Assign a random velocity for the particle to travel
            velocities.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                )
            );
        }

        particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

        const particleSystem = new THREE.Points(particles, pMaterial);
        particleSystem.userData = {
            velocities: velocities,
            lifetime: 1.0 // Effect lasts for 1 second
        };
        
        this.scene.add(particleSystem);
        this.effects.push(particleSystem);
    }

    /**
     * Generates a canvas texture for the particles to give them a soft, glowing look.
     */
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,150,1)');
        gradient.addColorStop(0.4, 'rgba(255,215,0,0.8)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Updates all active spell effects. Called in the main game loop.
     * @param {number} deltaTime - The time since the last frame.
     */
    update(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            // Decrease lifetime
            effect.userData.lifetime -= deltaTime;
            
            // If lifetime is over, remove the effect
            if (effect.userData.lifetime <= 0) {
                this.scene.remove(effect);
                this.effects.splice(i, 1);
                continue;
            }

            // Animate particles by moving them based on their velocity
            const positions = effect.geometry.attributes.position.array;
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] += effect.userData.velocities[j/3].x;
                positions[j+1] += effect.userData.velocities[j/3].y;
                positions[j+2] += effect.userData.velocities[j/3].z;
            }
            effect.geometry.attributes.position.needsUpdate = true;
            // Fade out the effect as it dies
            effect.material.opacity = effect.userData.lifetime;
        }
    }
}
