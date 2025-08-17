import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';
import AudioManager from '../managers/AudioManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.audioManager = new AudioManager(this);
        this.audioManager.playBackgroundMusic('ocean');
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_ocean');

        const titleText = this.add.text(GAME_WIDTH / 2, 150, '🦭 SEAL OF APPROVAL', {
            fontSize: '48px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        titleText.setOrigin(0.5);

        const startButton = this.add.text(GAME_WIDTH / 2, 380, 'PRESS SPACE TO START', {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00'
        });
        startButton.setOrigin(0.5);

        this.tweens.add({
            targets: startButton,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });

        const highScore = localStorage.getItem('sealHighScore') || 0;
        const highScoreText = this.add.text(GAME_WIDTH / 2, 480, `HIGH SCORE: ${highScore}`, {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        });
        highScoreText.setOrigin(0.5);

        const instructionsText = this.add.text(GAME_WIDTH / 2, 560, 'USE ← → TO MOVE, SPACE TO JUMP', {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        });
        instructionsText.setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.startGame();
        });

        const sealSprite = this.add.image(GAME_WIDTH / 2, 280, 'seal');
        sealSprite.setScale(4);
        
        this.tweens.add({
            targets: sealSprite,
            y: 260,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        this.createFishAnimation();
    }

    createFishAnimation() {
        for (let i = 0; i < 5; i++) {
            const fish = this.add.image(-30, 100 + Math.random() * 120, 'fish');
            fish.setScale(0.8);
            
            this.tweens.add({
                targets: fish,
                x: GAME_WIDTH + 30,
                duration: 8000 + Math.random() * 4000,
                delay: i * 1500,
                repeat: -1,
                onRepeat: () => {
                    fish.y = 100 + Math.random() * 120;
                }
            });
        }
    }

    startGame() {
        this.audioManager.stopBackgroundMusic();
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene', { level: 1 });
        });
    }
}