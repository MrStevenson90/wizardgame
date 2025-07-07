import { Wizard } from './Wizard.js';
import { CharacterController } from './CharacterController.js';

export class Player {
    constructor(scene) {
        this.mesh = new Wizard().mesh;
        this.mesh.position.set(0, 1, 30);  // Keep same position
        this.mesh.rotation.y = Math.PI;    // ADD: Rotate 180 degrees
        scene.add(this.mesh);

        this.controller = new CharacterController(this.mesh);
    }

    // MODIFIED: Update now accepts the rock for collision detection
    update(deltaTime, ground, rock) {
        this.controller.update(deltaTime, rock);

        if (ground) {
            const groundHeight = ground.getTerrainHeightAtPosition(this.mesh.position.x, this.mesh.position.z);
            this.mesh.position.y = groundHeight + 1.0;
        }
    }

    setPhase(phase) {
        this.controller.setPhase(phase);
    }
    
    setInputState(inputState) {
        this.controller.setInputState(inputState);
    }
}