import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import DevMenuScene from './scenes/DevMenuScene.js';
import GlobalInputScene from './scenes/GlobalInputScene.js';

export default {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false  // toggle Phaser's built-in physics debug
        }
    },
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, DevMenuScene, GlobalInputScene]
};