// js/GameManager.js
export class GameManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock(); // To manage deltaTime
        this.updateables = []; // NEW: Array to hold objects that need updates

        this.init();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a2e);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLighting();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // More robust lighting to support the new materials
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 80, 20);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
    }

    /**
     * NEW: The missing function that caused the error.
     * Stores a list of objects that have an `update` method.
     * @param {Array} updateableObjects - An array of objects to be updated each frame.
     */
    setUpdateables(updateableObjects) {
        this.updateables = updateableObjects;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // MODIFIED: The animate loop now handles updates.
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Get the time elapsed since the last frame
        const deltaTime = this.clock.getDelta();
        
        // Update all objects in the updateables list
        if (this.updateables && this.updateables.length > 0) {
            this.updateables.forEach(object => {
                if (object && typeof object.update === 'function') {
                    object.update(deltaTime);
                }
            });
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    clearScene() {
        while(this.scene.children.length > 0) { 
            const child = this.scene.children[0];
            this.scene.remove(child);
            
            // Proper disposal of geometry and material
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        // Re-add lighting after clearing
        this.setupLighting();
    }
}