// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0f0f23',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false  // Disabled - collision fixed!
        }
    },
    scene: [MenuScene, GameScene]
};

// Global audio manager
const audioManager = new AudioManager();

// High score management
const HighScore = {
    get: () => parseInt(localStorage.getItem('pixelRPG_highScore') || '0'),
    set: (score) => {
        const current = HighScore.get();
        if (score > current) {
            localStorage.setItem('pixelRPG_highScore', score.toString());
            return true; // New high score!
        }
        return false;
    }
};

// Start the game
const game = new Phaser.Game(config);