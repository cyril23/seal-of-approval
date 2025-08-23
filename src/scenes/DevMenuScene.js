import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEMES } from '../utils/constants.js';

export default class DevMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DevMenuScene' });
    }

    init(data) {
        this.currentLevel = data.currentLevel || 1;
        this.parentScene = data.parentScene;
        
        // Menu state management
        this.menuState = 'main'; // 'main', 'levelSelect', or 'physicsDebug'
        this.mainMenuIndex = 0;
        this.selectedLevel = this.currentLevel;
        
        // Check if developer mode is currently active
        this.isGodModeActive = this.parentScene?.player?.developerMode || false;
        
        // Check if physics debug is currently active
        this.isPhysicsDebugActive = this.parentScene?.player?.physicsDebugEnabled || false;
    }

    create() {
        // Semi-transparent background overlay
        this.bgOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
        
        // Title
        const titleStyle = {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        };
        
        this.titleText = this.add.text(GAME_WIDTH / 2, 50, 'DEVELOPER MENU', titleStyle).setOrigin(0.5);
        
        // Create container for main menu
        this.mainMenuContainer = this.add.container(0, 0);
        
        // Create container for level selection submenu
        this.levelMenuContainer = this.add.container(0, 0);
        this.levelMenuContainer.setVisible(false);
        
        // Create container for physics debug submenu
        this.physicsDebugContainer = this.add.container(0, 0);
        this.physicsDebugContainer.setVisible(false);
        
        // Create all menus
        this.createMainMenu();
        this.createLevelMenu();
        this.createPhysicsDebugMenu();
        
        // Setup controls
        this.setupControls();
        
        // Show initial menu
        this.showMainMenu();
    }
    
    createMainMenu() {
        const menuStyle = {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        };
        
        const instructionStyle = {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        };
        
        // Main menu options
        const menuY = 200;
        const optionSpacing = 40;
        
        // Get current high score
        const highScore = localStorage.getItem('sealHighScore') || '0';
        
        // Option 1: Toggle God Mode
        const godModeStatus = this.isGodModeActive ? '[ON]' : '[OFF]';
        this.godModeText = this.add.text(GAME_WIDTH / 2, menuY, 
            `Toggle God Mode ${godModeStatus}`, menuStyle);
        this.godModeText.setOrigin(0.5);
        
        // Option 2: Change Level
        this.changeLevelText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing, 
            'Change Level', menuStyle);
        this.changeLevelText.setOrigin(0.5);
        
        // Option 3: Physics Debug Settings
        const physicsDebugStatus = this.isPhysicsDebugActive ? '[ON]' : '[OFF]';
        this.physicsDebugText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing * 2, 
            `Physics Debug Settings ${physicsDebugStatus}`, menuStyle);
        this.physicsDebugText.setOrigin(0.5);
        
        // Option 4: Reset High Score
        this.resetScoreText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing * 3, 
            `Reset High Score (${highScore})`, menuStyle);
        this.resetScoreText.setOrigin(0.5);
        
        // Selection indicator
        this.mainSelectionIndicator = this.add.text(GAME_WIDTH / 2 - 250, menuY, 
            '>', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00'
        });
        
        // Instructions
        this.mainInstructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 
            'USE ↑↓ TO SELECT   ENTER TO ACTIVATE   ESC TO CLOSE', 
            instructionStyle);
        this.mainInstructions.setOrigin(0.5);
        
        // Confirmation text (initially hidden)
        this.confirmationText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 150, '', {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.confirmationText.setOrigin(0.5);
        
        // Add all to main menu container
        this.mainMenuContainer.add([
            this.godModeText,
            this.changeLevelText,
            this.physicsDebugText,
            this.resetScoreText,
            this.mainSelectionIndicator,
            this.mainInstructions,
            this.confirmationText
        ]);
        
        // Store menu options for easy access
        this.mainMenuOptions = [
            this.godModeText,
            this.changeLevelText,
            this.physicsDebugText,
            this.resetScoreText
        ];
    }
    
    createLevelMenu() {
        const instructionStyle = {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        };
        
        // Subtitle for level selection
        this.levelSubtitle = this.add.text(GAME_WIDTH / 2, 100, 'SELECT LEVEL', {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.levelSubtitle.setOrigin(0.5);
        
        // Instructions
        this.levelInstructions = this.add.text(GAME_WIDTH / 2, 140, 
            'USE ↑↓ TO SELECT   ENTER TO JUMP   ESC TO GO BACK', 
            instructionStyle);
        this.levelInstructions.setOrigin(0.5);
        
        // Create level list container
        this.levelListContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        
        // Generate level list
        this.createLevelList();
        
        // Add to level menu container
        this.levelMenuContainer.add([
            this.levelSubtitle,
            this.levelInstructions,
            this.levelListContainer
        ]);
    }
    
    createPhysicsDebugMenu() {
        const menuStyle = {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        };
        
        const descStyle = {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa',
            align: 'center'
        };
        
        const instructionStyle = {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        };
        
        // Subtitle
        this.physicsSubtitle = this.add.text(GAME_WIDTH / 2, 100, 'PHYSICS DEBUG SETTINGS', {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.physicsSubtitle.setOrigin(0.5);
        
        // Toggle option
        const toggleY = 200;
        const physicsStatus = this.isPhysicsDebugActive ? '[ON]' : '[OFF]';
        this.physicsToggleText = this.add.text(GAME_WIDTH / 2, toggleY, 
            `Physics Debug Overlay ${physicsStatus}`, menuStyle);
        this.physicsToggleText.setOrigin(0.5);
        
        // Selection indicator
        this.physicsSelectionIndicator = this.add.text(GAME_WIDTH / 2 - 250, toggleY, 
            '>', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00'
        });
        
        // Description text
        const descY = 300;
        const lineHeight = 25;
        
        this.physicsDesc1 = this.add.text(GAME_WIDTH / 2, descY, 
            'When enabled, visualizes collision boundaries:', descStyle);
        this.physicsDesc1.setOrigin(0.5);
        
        this.physicsDesc2 = this.add.text(GAME_WIDTH / 2, descY + lineHeight * 1.5, 
            'GREEN RECTANGLE = Physics body collision box', {
            ...descStyle,
            color: '#00ff00'
        });
        this.physicsDesc2.setOrigin(0.5);
        
        this.physicsDesc3 = this.add.text(GAME_WIDTH / 2, descY + lineHeight * 2.5, 
            'GREEN DOT = Center point of physics body', {
            ...descStyle,
            color: '#00ff00'
        });
        this.physicsDesc3.setOrigin(0.5);
        
        this.physicsDesc4 = this.add.text(GAME_WIDTH / 2, descY + lineHeight * 3.5, 
            'BLUE RECTANGLE = Visual sprite bounds', {
            ...descStyle,
            color: '#0088ff'
        });
        this.physicsDesc4.setOrigin(0.5);
        
        // Instructions
        this.physicsInstructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 
            'ENTER TO TOGGLE   ESC TO GO BACK', 
            instructionStyle);
        this.physicsInstructions.setOrigin(0.5);
        
        // Add all to physics debug container
        this.physicsDebugContainer.add([
            this.physicsSubtitle,
            this.physicsToggleText,
            this.physicsSelectionIndicator,
            this.physicsDesc1,
            this.physicsDesc2,
            this.physicsDesc3,
            this.physicsDesc4,
            this.physicsInstructions
        ]);
    }
    
    showPhysicsDebugMenu() {
        this.menuState = 'physicsDebug';
        this.mainMenuContainer.setVisible(false);
        this.levelMenuContainer.setVisible(false);
        this.physicsDebugContainer.setVisible(true);
        this.titleText.setText('DEVELOPER MENU');
    }
    
    togglePhysicsDebug() {
        if (!this.parentScene || !this.parentScene.player) return;
        
        // Toggle the physics debug
        this.isPhysicsDebugActive = !this.isPhysicsDebugActive;
        this.parentScene.player.setPhysicsDebugEnabled(this.isPhysicsDebugActive);
        
        // Update display
        const physicsStatus = this.isPhysicsDebugActive ? '[ON]' : '[OFF]';
        this.physicsToggleText.setText(`Physics Debug Overlay ${physicsStatus}`);
        
        // Update main menu text too
        this.physicsDebugText.setText(`Physics Debug Settings ${physicsStatus}`);
        
        // Show confirmation
        const status = this.isPhysicsDebugActive ? 'ENABLED' : 'DISABLED';
        this.showConfirmation(`Physics Debug ${status}`, 0x00ff00);
    }
    
    createLevelList() {
        const themeKeys = Object.keys(THEMES);
        const listStyle = {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        };
        
        // Enemy emoji mapping - matches EMOJIS from constants.js
        const enemyEmojis = {
            'crab': '🦀',
            'hawk': '🦅',
            'human': '🚶',
            'orca': '🐋',
            'polarbear': '🐻‍❄️'
        };
        
        // Show levels 1 through current level + 100
        const startLevel = 1;
        const endLevel = this.currentLevel + 100;
        
        this.levelTexts = [];
        
        for (let level = startLevel; level <= endLevel; level++) {
            const themeIndex = (level - 1) % themeKeys.length;
            const themeName = themeKeys[themeIndex];
            const theme = THEMES[themeName];
            
            // Position in list
            const yPos = (level - this.currentLevel) * 25;
            
            // Level number and theme
            const levelText = this.add.text(-300, yPos, `Level ${level.toString().padStart(3, ' ')}`, listStyle);
            levelText.setData('level', level);
            
            // Theme name with color indicator
            const themeText = this.add.text(-100, yPos, themeName.toUpperCase(), {
                ...listStyle,
                color: this.getThemeColor(themeName)
            });
            
            // Enemy types
            const enemies = theme.enemies || [];
            const enemyString = enemies.map(e => enemyEmojis[e] || e.substr(0,3).toUpperCase()).join(' ');
            const enemyText = this.add.text(100, yPos, enemyString, {
                ...listStyle,
                fontSize: '14px',
                color: '#ff9999'
            });
            
            // Add current level indicator
            if (level === this.currentLevel) {
                const currentText = this.add.text(250, yPos, '← CURRENT', {
                    ...listStyle,
                    color: '#00ff00'
                });
                this.levelListContainer.add(currentText);
            }
            
            this.levelListContainer.add([levelText, themeText, enemyText]);
            this.levelTexts.push({ level, levelText, themeText, enemyText, yPos });
        }
        
        // Level selection indicator
        this.levelSelectionIndicator = this.add.text(-330, 0, '>', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00'
        });
        this.levelListContainer.add(this.levelSelectionIndicator);
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
        
        // Arrow key navigation
        this.input.keyboard.on('keydown-UP', () => {
            if (this.menuState === 'main') {
                this.navigateMainMenu(-1);
            } else if (this.menuState === 'levelSelect') {
                this.navigateLevelMenu(-1);
            }
        });
        
        this.input.keyboard.on('keydown-DOWN', () => {
            if (this.menuState === 'main') {
                this.navigateMainMenu(1);
            } else if (this.menuState === 'levelSelect') {
                this.navigateLevelMenu(1);
            }
        });
        
        // Enter key activation
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.menuState === 'main') {
                this.activateMainMenuOption();
            } else if (this.menuState === 'levelSelect') {
                this.jumpToLevel();
            } else if (this.menuState === 'physicsDebug') {
                this.togglePhysicsDebug();
            }
        });
        
        // ESC key behavior
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.menuState === 'levelSelect' || this.menuState === 'physicsDebug') {
                // Go back to main menu
                this.showMainMenu();
            } else {
                // Close entire menu
                this.closeMenu();
            }
        });
    }
    
    navigateMainMenu(direction) {
        this.mainMenuIndex = Math.max(0, Math.min(3, this.mainMenuIndex + direction));
        this.updateMainMenuSelection();
    }
    
    updateMainMenuSelection() {
        const menuY = 200;
        const optionSpacing = 40;
        this.mainSelectionIndicator.setY(menuY + (this.mainMenuIndex * optionSpacing));
        
        // Highlight selected option
        this.mainMenuOptions.forEach((option, index) => {
            if (index === this.mainMenuIndex) {
                option.setColor('#ffff00');
                option.setScale(1.1);
            } else {
                option.setColor('#ffffff');
                option.setScale(1);
            }
        });
    }
    
    activateMainMenuOption() {
        switch(this.mainMenuIndex) {
            case 0: // Toggle God Mode
                this.toggleGodMode();
                break;
            case 1: // Change Level
                this.showLevelMenu();
                break;
            case 2: // Physics Debug Settings
                this.showPhysicsDebugMenu();
                break;
            case 3: // Reset High Score
                this.resetHighScore();
                break;
        }
    }
    
    toggleGodMode() {
        if (!this.parentScene || !this.parentScene.player) return;
        
        // Toggle the mode
        this.isGodModeActive = !this.isGodModeActive;
        this.parentScene.toggleDeveloperMode();
        
        // Update display
        const godModeStatus = this.isGodModeActive ? '[ON]' : '[OFF]';
        this.godModeText.setText(`Toggle God Mode ${godModeStatus}`);
        
        // Show confirmation
        const status = this.isGodModeActive ? 'ENABLED' : 'DISABLED';
        this.showConfirmation(`God Mode ${status}`, 0xffff00);
    }
    
    resetHighScore() {
        // Get current high score
        const oldScore = localStorage.getItem('sealHighScore') || '0';
        
        // Reset to 0
        localStorage.setItem('sealHighScore', '0');
        
        // Update display
        this.resetScoreText.setText('Reset High Score (0)');
        
        // Show confirmation
        this.showConfirmation(`High Score Reset! (was ${oldScore})`, 0xff0000);
    }
    
    showConfirmation(text, color = 0xffff00) {
        this.confirmationText.setText(text);
        this.confirmationText.setColor('#' + color.toString(16).padStart(6, '0'));
        this.confirmationText.setAlpha(1);
        
        // Fade out after 2 seconds
        this.tweens.add({
            targets: this.confirmationText,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            ease: 'Power2'
        });
    }
    
    showMainMenu() {
        this.menuState = 'main';
        this.mainMenuContainer.setVisible(true);
        this.levelMenuContainer.setVisible(false);
        this.physicsDebugContainer.setVisible(false);
        this.titleText.setText('DEVELOPER MENU');
        this.updateMainMenuSelection();
    }
    
    showLevelMenu() {
        this.menuState = 'levelSelect';
        this.mainMenuContainer.setVisible(false);
        this.levelMenuContainer.setVisible(true);
        this.titleText.setText('DEVELOPER MENU');
        this.updateLevelSelection();
    }
    
    navigateLevelMenu(direction) {
        if (direction < 0 && this.selectedLevel > 1) {
            this.selectedLevel--;
        } else if (direction > 0) {
            this.selectedLevel++;
        }
        
        this.updateLevelSelection();
        this.scrollList();
    }
    
    updateLevelSelection() {
        // Find the text object for the selected level
        const selectedItem = this.levelTexts.find(item => item.level === this.selectedLevel);
        
        if (selectedItem) {
            // Position the selection indicator
            this.levelSelectionIndicator.setY(selectedItem.yPos);
            
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
        
        // Clear the dev menu flag in parent scene before jumping
        // This ensures clean state transition
        if (this.parentScene) {
            this.parentScene.isDevMenuOpen = false;
            console.log('[DD MENU] Cleared isDevMenuOpen flag in parent scene before jump');
        }
        
        // Use the global jumpToLevel function for consistency
        if (window.jumpToLevel) {
            window.jumpToLevel(this.selectedLevel);
        } else {
            console.error('Global jumpToLevel function not found');
        }
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