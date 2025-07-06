// js/Scenes.js
import { Sky } from './Sky.js';
import { Ground } from './Ground.js';
import { Wizard } from './Wizard.js';
import { Cage } from './Cage.js';
import { Rock } from './rock.js'; // CHANGED: Importing Rock instead of Stone
import { SnakeManager } from './Snakes.js';
import { TreesRocks } from './Trees_rocks.js';

export class Scenes {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentPhase = null;
        
        this.world = {};
        
        this.setupUnifiedWorld();
    }

    setupUnifiedWorld() {
        console.log("Setting up persistent unified world...");
        this.gameManager.clearScene(); 

        this.world.sky = new Sky();
        this.world.ground = new Ground();
        this.world.treesRocks = new TreesRocks();
        
        this.gameManager.scene.add(this.world.sky.mesh);
        this.gameManager.scene.add(this.world.ground.mesh);
        this.world.treesRocks.meshes.forEach(mesh => this.gameManager.scene.add(mesh));
        
        this.world.wizard = new Wizard();
        this.world.cage = new Cage();
        this.world.rock = new Rock(); // CHANGED: Using new Rock class
        this.world.snakes = new SnakeManager(this.gameManager.scene);
        
        this.gameManager.scene.add(this.world.wizard.mesh);
        this.gameManager.scene.add(this.world.cage.mesh);
        this.gameManager.scene.add(this.world.rock.group); // CHANGED: rock instead of stone

        this.setAllInteractiveObjectsVisible(false);
        console.log("Unified world created.");
    }

    setAllInteractiveObjectsVisible(isVisible) {
        this.world.wizard.mesh.visible = isVisible;
        this.world.cage.mesh.visible = isVisible;
        this.world.rock.group.visible = isVisible; // CHANGED: rock instead of stone
    }
    
    loadScene(sceneNumber) {
        this.currentPhase = sceneNumber;
        this.setAllInteractiveObjectsVisible(false);
        this.world.snakes.isSpawning = false;

        const updateY = (mesh, x, z) => {
            if (this.world.ground && typeof this.world.ground.getTerrainHeightAtPosition === 'function') {
                mesh.position.y = this.world.ground.getTerrainHeightAtPosition(x, z) + 1;
            }
        };
        
        switch(sceneNumber) {
            case 1: // Wizard in cage
                this.world.wizard.mesh.position.set(10, 0, -10);
                updateY(this.world.wizard.mesh, 10, -10);
                this.world.cage.mesh.position.copy(this.world.wizard.mesh.position);
                this.world.cage.mesh.position.y -= 1;
                
                this.world.wizard.mesh.visible = true;
                this.world.cage.mesh.visible = true;
                break;
                
            case 2: // Spell casting on rock
                this.world.wizard.mesh.position.set(-5, 0, 0);
                updateY(this.world.wizard.mesh, -5, 0);
                this.world.rock.group.position.set(3, 2, 0); // CHANGED: rock instead of stone
                
                this.world.wizard.mesh.visible = true;
                this.world.rock.group.visible = true; // CHANGED: rock instead of stone
                break;
                
            case 3: // Defend against snakes
                this.world.wizard.mesh.position.set(0, 0, 5);
                updateY(this.world.wizard.mesh, 0, 5);
                this.world.wizard.mesh.visible = true;

                this.world.snakes.isSpawning = true;
                break;
        }

        this.gameManager.setUpdateables([this.world.sky, this.world.ground, this.world.snakes]);
    }
}
