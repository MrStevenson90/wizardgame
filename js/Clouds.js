// js/Clouds.js
export class Clouds {
    constructor() {
        // This class is now deprecated.
        // Cloud generation is handled by the advanced shader in Sky.js for better performance and visuals.
        this.meshes = [];
        console.warn("Clouds.js is deprecated. Clouds are now part of the Sky.js shader.");
    }
    
    createClouds() { /* No longer creates mesh objects */ }
    animateClouds() { /* No longer animates mesh objects */ }
}