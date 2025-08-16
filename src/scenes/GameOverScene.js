import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalLevel = data.level || 1;
    }

    create() {
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_ocean');
        
        const gameOverText = this.add.text(GAME_WIDTH / 2, 120, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        gameOverText.setOrigin(0.5);
        
        const scoreText = this.add.text(GAME_WIDTH / 2, 240, `FINAL SCORE: ${this.finalScore}`, {
            fontSize: '28px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        });
        scoreText.setOrigin(0.5);
        
        const levelText = this.add.text(GAME_WIDTH / 2, 300, `REACHED LEVEL: ${this.finalLevel}`, {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        });
        levelText.setOrigin(0.5);
        
        const highScore = localStorage.getItem('sealHighScore') || 0;
        let highScoreMessage = '';
        
        if (this.finalScore > highScore) {
            localStorage.setItem('sealHighScore', this.finalScore);
            highScoreMessage = 'NEW HIGH SCORE!';
            
            const newHighScoreText = this.add.text(GAME_WIDTH / 2, 380, highScoreMessage, {
                fontSize: '28px',
                fontFamily: '"Press Start 2P", monospace',
                color: '#ffff00'
            });
            newHighScoreText.setOrigin(0.5);
            
            this.tweens.add({
                targets: newHighScoreText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                ease: 'Power2',
                yoyo: true,
                repeat: -1
            });
        } else {
            const highScoreText = this.add.text(GAME_WIDTH / 2, 380, `HIGH SCORE: ${highScore}`, {
                fontSize: '20px',
                fontFamily: '"Press Start 2P", monospace',
                color: '#aaaaaa'
            });
            highScoreText.setOrigin(0.5);
        }
        
        const restartText = this.add.text(GAME_WIDTH / 2, 480, 'PRESS SPACE TO PLAY AGAIN', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00'
        });
        restartText.setOrigin(0.5);
        
        this.tweens.add({
            targets: restartText,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
        
        const menuText = this.add.text(GAME_WIDTH / 2, 540, 'PRESS ESC FOR MENU', {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        });
        menuText.setOrigin(0.5);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
        
        this.createSadSeal();
    }

    createSadSeal() {
        const seal = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '🦭', {
            fontSize: '96px'
        });
        seal.setOrigin(0.5);
        seal.setRotation(0.3);
        
        this.tweens.add({
            targets: seal,
            rotation: -0.3,
            duration: 2000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}