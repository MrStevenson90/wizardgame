// js/Cage.js
export class Cage {
    constructor() {
        this.createCage();
    }
    
    createCage() {
        this.mesh = new THREE.Group();
        
        // Enhanced materials for realism
        const barMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8,
            metalness: 0.3
        });
        
        const rustMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a3728,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.7,
            metalness: 0.4
        });
        
        // Base/Floor of the cage
        const baseGeometry = new THREE.CylinderGeometry(2.3, 2.5, 0.3);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Vertical bars (more bars for realism)
        const barCount = 12; // Increased from 8 to 12 for more realistic density
        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            const radius = 2.1;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Main vertical bar
            const barGeometry = new THREE.CylinderGeometry(0.08, 0.08, 5.5);
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.set(x, 3.05, z);
            bar.castShadow = true;
            bar.receiveShadow = true;
            this.mesh.add(bar);
            
            // Add some variation with slightly rusty bars
            if (i % 3 === 0) {
                bar.material = rustMaterial;
            }
        }
        
        // Horizontal connecting rings (FIXED: proper circular rings)
        for (let ring = 0; ring < 4; ring++) {
            const y = ring * 1.3 + 0.8; // Better spacing
            
            // Create circular ring using multiple small cylinders
            const ringBarCount = 24; // Number of segments for smooth circle
            for (let i = 0; i < ringBarCount; i++) {
                const angle = (i / ringBarCount) * Math.PI * 2;
                const nextAngle = ((i + 1) / ringBarCount) * Math.PI * 2;
                
                const radius = 2.1;
                const x1 = Math.cos(angle) * radius;
                const z1 = Math.sin(angle) * radius;
                const x2 = Math.cos(nextAngle) * radius;
                const z2 = Math.sin(nextAngle) * radius;
                
                // Calculate segment length and position
                const segmentLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
                const centerX = (x1 + x2) / 2;
                const centerZ = (z1 + z2) / 2;
                
                const ringSegmentGeometry = new THREE.CylinderGeometry(0.04, 0.04, segmentLength);
                const ringSegment = new THREE.Mesh(ringSegmentGeometry, barMaterial);
                
                // Position and rotate the segment
                ringSegment.position.set(centerX, y, centerZ);
                ringSegment.rotation.z = Math.PI / 2; // Rotate to horizontal
                ringSegment.rotation.y = angle + Math.PI / 2; // Align with circle
                
                ringSegment.castShadow = true;
                ringSegment.receiveShadow = true;
                this.mesh.add(ringSegment);
            }
        }
        
        // Enhanced top with decorative elements
        const topGeometry = new THREE.CylinderGeometry(2.4, 2.2, 0.25);
        const top = new THREE.Mesh(topGeometry, baseMaterial);
        top.position.y = 5.9;
        top.castShadow = true;
        top.receiveShadow = true;
        this.mesh.add(top);
        
        // Decorative top spikes
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 2.2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const spikeGeometry = new THREE.ConeGeometry(0.1, 0.5);
            const spike = new THREE.Mesh(spikeGeometry, rustMaterial);
            spike.position.set(x, 6.3, z);
            spike.castShadow = true;
            this.mesh.add(spike);
        }
        
        // Central locking mechanism
        const lockGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.15);
        const lock = new THREE.Mesh(lockGeometry, rustMaterial);
        lock.position.set(2.1, 3, 0);
        lock.castShadow = true;
        this.mesh.add(lock);
        
        // Lock chain
        const chainGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
        const chain = new THREE.Mesh(chainGeometry, barMaterial);
        chain.position.set(2.1, 2.5, 0);
        chain.castShadow = true;
        this.mesh.add(chain);
        
        // Door frame (subtle indication of where the door would be)
        const doorFrameGeometry = new THREE.BoxGeometry(0.12, 5.5, 0.08);
        const doorFrame1 = new THREE.Mesh(doorFrameGeometry, baseMaterial);
        doorFrame1.position.set(1.8, 3.05, 0.5);
        doorFrame1.castShadow = true;
        this.mesh.add(doorFrame1);
        
        const doorFrame2 = new THREE.Mesh(doorFrameGeometry, baseMaterial);
        doorFrame2.position.set(1.8, 3.05, -0.5);
        doorFrame2.castShadow = true;
        this.mesh.add(doorFrame2);
        
        // Add some magical glow effect around the base
        const glowGeometry = new THREE.RingGeometry(2.6, 3.2, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.1;
        this.mesh.add(glow);
        
        // Add some wear and tear details
        for (let i = 0; i < 5; i++) {
            const wearGeometry = new THREE.SphereGeometry(0.05, 6, 6);
            const wear = new THREE.Mesh(wearGeometry, rustMaterial);
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.8 + Math.random() * 0.6;
            const height = Math.random() * 4 + 1;
            
            wear.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            wear.scale.setScalar(0.5 + Math.random() * 0.5);
            this.mesh.add(wear);
        }
        
        // Position the entire cage
        this.mesh.position.y = 0;
    }
    
    // Method to animate the magical glow
    update(deltaTime) {
        if (this.mesh) {
            // Find the glow ring and animate it
            const glowRing = this.mesh.children.find(child => 
                child.material && child.material.transparent && child.material.opacity < 0.2
            );
            
            if (glowRing) {
                const time = Date.now() * 0.001;
                glowRing.material.opacity = 0.05 + Math.sin(time * 2) * 0.05;
                glowRing.rotation.z = time * 0.1;
            }
        }
    }
    
    // Method to enhance the magical effect when unlocking
    startUnlockEffect() {
        if (this.mesh) {
            const glowRing = this.mesh.children.find(child => 
                child.material && child.material.transparent && child.material.opacity < 0.2
            );
            
            if (glowRing) {
                // Increase glow intensity during unlock
                glowRing.material.opacity = 0.3;
                glowRing.material.color.setHex(0x44ff44); // Change to green during unlock
            }
        }
    }
}