import Phaser from 'phaser';
import config from './config.js';

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
    
    // Expose game instance for testing
    window.game = game;
    
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });
});