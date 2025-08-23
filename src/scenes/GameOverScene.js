import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.baseScore = data.score || 0; // Score before distance bonus
        this.finalScore = data.score || 0; // Will be updated after animation
        this.finalLevel = data.level || 1;
        this.progressDistance = data.progressDistance || 0;
        this.progressPoints = data.progressPoints || 0;
        this.scoreManager = data.scoreManager; // Receive ScoreManager for animation
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
        
        // Create score text that will be updated after animation
        this.scoreText = this.add.text(GAME_WIDTH / 2, 240, `FINAL SCORE: ${this.finalScore}`, {
            fontSize: '28px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        });
        this.scoreText.setOrigin(0.5);
        
        const levelText = this.add.text(GAME_WIDTH / 2, 300, `REACHED LEVEL: ${this.finalLevel}`, {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        });
        levelText.setOrigin(0.5);
        
        // Instead of displaying static text, animate the distance bonus if present
        if (this.progressPoints > 0 && this.scoreManager) {
            // Add game over sound
            if (this.scoreManager.scene && this.scoreManager.scene.audioManager) {
                this.scoreManager.scene.audioManager.playSound('gameOver');
            }
            
            // Wait a moment then animate the distance bonus
            this.time.delayedCall(1500, () => {
                // Set the scene context for ScoreManager animations
                this.scoreManager.scene = this;
                
                // Create a temporary audioManager reference for sound effects
                this.audioManager = this.scoreManager.scene.audioManager || {
                    playSound: (name) => {
                        // Fallback: create temporary audio context for bonus sounds
                        if (name === 'bonusTick') {
                            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                            const oscillator = audioContext.createOscillator();
                            const gainNode = audioContext.createGain();
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContext.destination);
                            oscillator.type = 'sine';
                            oscillator.frequency.value = 1000;
                            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.05);
                        }
                    }
                };
                
                // Animate the distance bonus
                this.scoreManager.animateBonusPoints(this.progressPoints, 'DISTANCE', () => {
                    // Update final score display after animation
                    this.finalScore = this.scoreManager.score;
                    this.scoreText.setText(`FINAL SCORE: ${this.finalScore}`);
                    
                    // Flash the score text
                    this.scoreText.setColor('#00ff00');
                    this.tweens.add({
                        targets: this.scoreText,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 300,
                        yoyo: true,
                        onComplete: () => {
                            this.scoreText.setColor('#ffffff');
                        }
                    });
                    
                    // Check and save high score after bonus
                    this.scoreManager.saveHighScore();
                    this.checkHighScore();
                });
            });
        } else {
            // No distance bonus, play game over sound immediately
            if (this.scoreManager && this.scoreManager.scene && this.scoreManager.scene.audioManager) {
                this.scoreManager.scene.audioManager.playSound('gameOver');
            }
            this.checkHighScore();
        }
        
        // Create UI method to update score display during animation
        this.updateUI = () => {
            if (this.scoreManager) {
                this.scoreText.setText(`FINAL SCORE: ${this.scoreManager.score}`);
            }
        };
        
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
            this.scene.start('GameScene', { level: 1 });
        });
        
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
        
        this.createSadSeal();
    }
    
    checkHighScore() {
        const highScore = localStorage.getItem('sealHighScore') || 0;
        
        if (this.finalScore > highScore) {
            const newHighScoreText = this.add.text(GAME_WIDTH / 2, 420, 'NEW HIGH SCORE!', {
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
            const highScoreText = this.add.text(GAME_WIDTH / 2, 420, `HIGH SCORE: ${highScore}`, {
                fontSize: '20px',
                fontFamily: '"Press Start 2P", monospace',
                color: '#aaaaaa'
            });
            highScoreText.setOrigin(0.5);
        }
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