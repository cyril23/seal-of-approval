import Phaser from 'phaser';
import config from './config.js';

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
    
    // Expose game instance for testing
    window.game = game;
    
    // Add test helper function to jump directly to any level
    // Uses the same proven logic as DevMenuScene.jumpToLevel()
    window.jumpToLevel = function(levelNumber) {
        if (!window.game || !window.game.scene) {
            console.error('Game not initialized');
            return false;
        }
        
        console.log(`Jumping to level ${levelNumber}`);
        
        // Try to preserve current lives if GameScene is active
        let currentLives = null;
        const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
        const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
        if (gameScene && gameScene.player) {
            currentLives = gameScene.player.lives;
            console.log(`Preserving ${currentLives} lives from current game`);
        }
        
        // Stop the GameScene completely (same as dev menu)
        window.game.scene.stop('GameScene');
        
        // Stop DevMenuScene if it's running
        window.game.scene.stop('DevMenuScene');
        
        // Start GameScene with the specified level and preserved lives
        window.game.scene.start('GameScene', { 
            level: levelNumber,
            lives: currentLives 
        });
        return true;
    };
    
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });
});