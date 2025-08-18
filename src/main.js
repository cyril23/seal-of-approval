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
        
        // Stop the GameScene completely (same as dev menu)
        window.game.scene.stop('GameScene');
        
        // Stop DevMenuScene if it's running
        window.game.scene.stop('DevMenuScene');
        
        // Start GameScene with the specified level
        window.game.scene.start('GameScene', { level: levelNumber });
        return true;
    };
    
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });
});