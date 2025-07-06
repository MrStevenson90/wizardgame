// js/Stone.js
export class Stone {
    constructor() {
        this.spellCount = 0;
        this.createStone();
    }

    createStone() {
        const group = new THREE.Group();

        // Base Rock
        let geometry = new THREE.IcosahedronGeometry(6, 6); // Larger and more detailed base
        geometry = this._displaceGeometryVertices(geometry, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x795548,
            roughness: 0.75,
            metalness: 0.05
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        group.add(this.mesh);

        // Magical light for spell effects
        this.glowLight = new THREE.PointLight(0xffd700, 0, 20); // Initially off
        group.add(this.glowLight);
        
        group.position.y = 2;
        this.group = group; // Store the group
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

    addSpellEffect() {
        this.spellCount++;
        
        // Flash effect using the point light
        this.glowLight.intensity = 2.0;
        this.glowLight.distance = 25;
        
        // Fade out the light
        const fadeInterval = setInterval(() => {
            this.glowLight.intensity -= 0.1;
            if (this.glowLight.intensity <= 0) {
                this.glowLight.intensity = 0;
                clearInterval(fadeInterval);
            }
        }, 25);
    }
}