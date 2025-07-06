// js/Drawing.js

// CHANGED: Renamed the class from 'Drawing' to 'DrawingSystem' to match the import in Main.js
export class DrawingSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isDrawing = false;
        this.drawPath = [];

        this.setupControls();
    }

    setupControls() {
        // Mouse controls for drawing
        this.gameManager.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.gameManager.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.gameManager.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Add click listener for snake interaction
        this.gameManager.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    }

    onMouseDown(event) {
        this.isDrawing = true;
        this.drawPath = [];
        this.updateMousePosition(event);
    }

    onMouseMove(event) {
        if (this.isDrawing) {
            this.updateMousePosition(event); // Update mouse position continuously while drawing
            this.drawPath.push({ x: this.gameManager.mouse.x, y: this.gameManager.mouse.y });
        }
    }

    onMouseUp(event) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.processDrawing();
        }
    }

    onClick(event) {
        if (!this.gameManager.mouse) this.gameManager.mouse = new THREE.Vector2();
        if (!this.gameManager.raycaster) this.gameManager.raycaster = new THREE.Raycaster();
        
        // Update mouse position for the click
        this.updateMousePosition(event);

        // Update the raycaster with the new mouse position
        this.gameManager.raycaster.setFromCamera(this.gameManager.mouse, this.gameManager.camera);
        
        // Check for intersections
        const intersects = this.gameManager.raycaster.intersectObjects(this.gameManager.scene.children, true);

        for (let intersect of intersects) {
            if (intersect.object.userData.type === 'snake' && intersect.object.userData.hit) {
                intersect.object.userData.hit();
                break; // Stop after hitting the first snake
            }
        }
    }

    updateMousePosition(event) {
        if (!this.gameManager.mouse) this.gameManager.mouse = new THREE.Vector2();
        this.gameManager.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.gameManager.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    processDrawing() {
        if (this.drawPath.length < 5) return;

        // Simple S-curve detection
        if (this.detectSCurve(this.drawPath)) {
            window.dispatchEvent(new CustomEvent('spellCast'));
        }
    }

    detectSCurve(path) {
        if (path.length < 8) return false;

        let changes = 0;
        let lastDirection = 0; // 0: none, 1: right, -1: left

        for (let i = 1; i < path.length; i++) {
            const deltaX = path[i].x - path[i-1].x;
            if (Math.abs(deltaX) > 0.01) {
                const direction = deltaX > 0 ? 1 : -1;
                if (lastDirection !== 0 && direction !== lastDirection) {
                    changes++;
                }
                lastDirection = direction;
            }
        }

        // An "S" shape should have at least two changes in horizontal direction.
        return changes >= 2;
    }
}