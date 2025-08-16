import Phaser from 'phaser';
import config from './config.js';

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
    
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });
});