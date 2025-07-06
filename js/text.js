// js/Text.js
export class Text {
    constructor() {
        this.score = 0;
        this.level = 1;
    }
    
    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }
    
    updateLevel(level) {
        this.level = level;
    }
    
    showMessage(message, duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: #ffd700;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            z-index: 1000;
            animation: fadeIn 0.5s ease-out;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, duration);
    }
}