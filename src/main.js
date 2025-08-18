import Phaser from 'phaser';
import config from './config.js';

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
    
    // Expose game instance for testing
    window.game = game;
    
    // Add test helper function to jump directly to any level
    window.jumpToLevel = function(levelNumber) {
        if (!window.game || !window.game.scene) {
            console.error('Game not initialized');
            return false;
        }
        
        // Stop any active GameScene
        const scenes = window.game.scene.scenes;
        const gameScene = scenes.find(scene => scene.scene.key === 'GameScene');
        
        if (gameScene && gameScene.scene.isActive()) {
            // Stop audio to prevent overlap
            if (gameScene.audioManager) {
                gameScene.audioManager.stopBackgroundMusic();
            }
            window.game.scene.stop('GameScene');
        }
        
        // Also stop DevMenuScene if it's running
        const devMenuScene = scenes.find(scene => scene.scene.key === 'DevMenuScene');
        if (devMenuScene && devMenuScene.scene.isActive()) {
            window.game.scene.stop('DevMenuScene');
        }
        
        // Start GameScene with the specified level
        window.game.scene.start('GameScene', { level: levelNumber });
        console.log(`Jumped to level ${levelNumber}`);
        return true;
    };
    
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });
});