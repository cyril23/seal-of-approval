import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEMES } from '../utils/constants.js';

export default class DevMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DevMenuScene' });
    }

    init(data) {
        this.currentLevel = data.currentLevel || 1;
        this.parentScene = data.parentScene;
        this.selectedLevel = this.currentLevel;
    }

    create() {
        // Semi-transparent background overlay
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
        
        // Title
        const titleStyle = {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        };
        
        this.add.text(GAME_WIDTH / 2, 50, 'DEVELOPER MENU', titleStyle).setOrigin(0.5);
        
        // Instructions
        const instructionStyle = {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        };
        
        this.add.text(GAME_WIDTH / 2, 100, 'USE ↑↓ TO SELECT LEVEL', instructionStyle).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, 130, 'ENTER TO JUMP TO LEVEL', instructionStyle).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, 160, 'ESC TO CLOSE', instructionStyle).setOrigin(0.5);
        
        // Create level list container
        this.levelListContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        
        // Generate level list
        this.createLevelList();
        
        // Current selection indicator (add as child of container)
        this.selectionIndicator = this.add.text(-230, 0, '>', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00'
        });
        this.levelListContainer.add(this.selectionIndicator);
        
        // Setup controls
        this.setupControls();
        
        this.updateSelection();
    }
    
    createLevelList() {
        const themeKeys = Object.keys(THEMES);
        const listStyle = {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        };
        
        // Show 20 levels before and after current level
        const startLevel = Math.max(1, this.currentLevel - 20);
        const endLevel = this.currentLevel + 20;
        
        this.levelTexts = [];
        
        for (let level = startLevel; level <= endLevel; level++) {
            const themeIndex = (level - 1) % themeKeys.length;
            const themeName = themeKeys[themeIndex];
            const theme = THEMES[themeName];
            
            // Position in list
            const yPos = (level - this.currentLevel) * 25;
            
            // Level number and theme
            const levelText = this.add.text(-200, yPos, `Level ${level.toString().padStart(3, ' ')}`, listStyle);
            levelText.setData('level', level);
            
            // Theme name with color indicator
            const themeText = this.add.text(0, yPos, themeName.toUpperCase(), {
                ...listStyle,
                color: this.getThemeColor(themeName)
            });
            
            // Add current level indicator
            if (level === this.currentLevel) {
                const currentText = this.add.text(200, yPos, '← CURRENT', {
                    ...listStyle,
                    color: '#00ff00'
                });
                this.levelListContainer.add(currentText);
            }
            
            this.levelListContainer.add([levelText, themeText]);
            this.levelTexts.push({ level, levelText, themeText, yPos });
        }
    }
    
    getThemeColor(themeName) {
        // Return a color that represents each theme
        switch(themeName) {
            case 'beach': return '#F4E4C1';
            case 'city': return '#8B8B8B';
            case 'ocean': return '#4A90E2';
            case 'harbor': return '#7B8D8E';
            default: return '#ffffff';
        }
    }
    
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Level selection with arrow keys
        this.input.keyboard.on('keydown-UP', () => {
            if (this.selectedLevel > 1) {
                this.selectedLevel--;
                this.updateSelection();
                this.scrollList();
            }
        });
        
        this.input.keyboard.on('keydown-DOWN', () => {
            this.selectedLevel++;
            this.updateSelection();
            this.scrollList();
        });
        
        // Quick jump with number keys (1-9 for levels 1-9)
        for (let i = 1; i <= 9; i++) {
            this.input.keyboard.on(`keydown-${i}`, () => {
                this.selectedLevel = i;
                this.updateSelection();
                this.scrollList();
            });
        }
        
        // Jump to selected level
        this.input.keyboard.on('keydown-ENTER', () => {
            this.jumpToLevel();
        });
        
        // Close menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.closeMenu();
        });
    }
    
    updateSelection() {
        // Find the text object for the selected level
        const selectedItem = this.levelTexts.find(item => item.level === this.selectedLevel);
        
        if (selectedItem) {
            // Position the selection indicator (now using local coordinates)
            this.selectionIndicator.setY(selectedItem.yPos);
            
            // Highlight selected level
            this.levelTexts.forEach(item => {
                if (item.level === this.selectedLevel) {
                    item.levelText.setColor('#ffff00');
                    item.themeText.setScale(1.1);
                } else {
                    item.levelText.setColor('#ffffff');
                    item.themeText.setScale(1);
                }
            });
        }
    }
    
    scrollList() {
        // Smoothly scroll the list to keep selected level visible
        const targetY = GAME_HEIGHT / 2 + 20 - (this.selectedLevel - this.currentLevel) * 25;
        
        this.tweens.add({
            targets: this.levelListContainer,
            y: targetY,
            duration: 200,
            ease: 'Power2'
        });
    }
    
    jumpToLevel() {
        console.log(`Jumping to level ${this.selectedLevel}`);
        
        // Stop the parent scene completely
        this.scene.stop('GameScene');
        
        // Close this menu
        this.scene.stop();
        
        // Restart game scene with the selected level
        this.scene.start('GameScene', { level: this.selectedLevel });
    }
    
    closeMenu() {
        // Resume the parent scene
        if (this.parentScene) {
            this.scene.resume('GameScene');
        }
        
        // Stop this scene
        this.scene.stop();
    }
}