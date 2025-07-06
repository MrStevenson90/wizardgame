// js/Wizard.js

export class Wizard {
    constructor() {
        this.createWizard();
        this.animateWizard();
    }
    
    createWizard() {
        this.mesh = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a8a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.6, 16, 12);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.5;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Hat
        const hatGeometry = new THREE.ConeGeometry(0.8, 2, 8);
        const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a4a });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 4.8;
        hat.castShadow = true;
        this.mesh.add(hat);
        
        // Beard
        const beardGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const beardMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const beard = new THREE.Mesh(beardGeometry, beardMaterial);
        beard.position.set(0, 3.2, 0.3);
        beard.scale.set(1, 0.8, 0.6);
        this.mesh.add(beard);
        
        // Staff
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
        const staffMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(1.5, 2, 0);
        this.mesh.add(staff);
        
        // Crystal on staff
        const crystalGeometry = new THREE.OctahedronGeometry(0.3);
        const crystalMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x004444
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(1.5, 4, 0);
        this.mesh.add(crystal);
        
        this.crystal = crystal;
    }
    
    animateWizard() {
        const animate = () => {
            if (this.crystal) {
                this.crystal.rotation.y += 0.02;
                this.crystal.position.y = 4 + Math.sin(Date.now() * 0.002) * 0.1;
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Makes the wizard follow a target mesh.
     * @param {THREE.Mesh} target - The player or object to follow.
     * @param {number} deltaTime - The time since the last frame.
     */
    followTarget(target, deltaTime) {
        if (!target) return;

        const followDistance = 8; // How far to stay away from the target
        const speed = 150;        // Movement speed, slightly slower than the player

        const direction = target.position.clone().sub(this.mesh.position);
        const distance = direction.length();

        // Only move if the target is outside the follow distance
        if (distance > followDistance) {
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(speed * deltaTime));
        }

        // Always look at the target's position
        this.mesh.lookAt(target.position);
    }
}