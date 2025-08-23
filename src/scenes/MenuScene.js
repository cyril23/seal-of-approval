import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Use global AudioManager and set scene context
        this.audioManager = this.game.audioManager;
        this.audioManager.setScene(this);
        this.audioManager.currentTheme = 'ocean'; // Store theme for unmute
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

        // M key is now handled globally in main.js

        // Create mute indicator
        this.createMuteIndicator();

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
            const fish = this.add.image(GAME_WIDTH + 30, 100 + Math.random() * 120, 'fish');
            fish.setScale(0.8);
            
            this.tweens.add({
                targets: fish,
                x: -30,
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

    createMuteIndicator() {
        // Create background for better visibility
        const bgPadding = 8;
        this.muteIndicatorBg = this.add.rectangle(
            GAME_WIDTH - 40, 
            40,
            40 + bgPadding * 2,
            40 + bgPadding * 2,
            0x000000, 
            0.5
        );
        this.muteIndicatorBg.setOrigin(0.5);

        // Create mute icon text (only shows when muted)
        this.muteIndicator = this.add.text(
            GAME_WIDTH - 40,
            40,
            '🔇',
            {
                fontSize: '24px',
                fontFamily: '"Press Start 2P", monospace'
            }
        );
        this.muteIndicator.setOrigin(0.5);
        
        // Only show if currently muted
        this.muteIndicatorBg.setVisible(this.audioManager.isMuted);
        this.muteIndicator.setVisible(this.audioManager.isMuted);
    }

    updateMuteIndicator() {
        if (this.muteIndicator && this.muteIndicatorBg) {
            // Show indicator only when muted
            this.muteIndicatorBg.setVisible(this.audioManager.isMuted);
            this.muteIndicator.setVisible(this.audioManager.isMuted);
        }
    }
}