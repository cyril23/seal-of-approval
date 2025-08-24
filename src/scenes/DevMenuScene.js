import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEMES } from '../utils/constants.js';
import logger from '../utils/logger.js';

export default class DevMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DevMenuScene' });
    }

    init(data) {
        this.currentLevel = data.currentLevel || 1;
        this.parentScene = data.parentScene;
        
        // Menu state management
        this.menuState = 'main'; // 'main', 'levelSelect', 'levelEntry', or 'physicsDebug'
        this.mainMenuIndex = 0;
        this.selectedLevel = this.currentLevel;
        
        // Check if developer mode is currently active
        this.isGodModeActive = this.parentScene?.player?.developerMode || false;
        
        // Check if physics debug is currently active
        this.isPhysicsDebugActive = this.parentScene?.player?.physicsDebugEnabled || false;
        
        // Dynamic loading properties
        this.loadedStartLevel = 1;
        this.loadedEndLevel = 1;
        this.loadBatchSize = 50; // Load 50 levels at a time
        this.maxTotalLevels = 999999; // Effectively unlimited
        this.levelTextMap = new Map(); // Map to track text objects by level
        
        // Throttle timing for PAGE_UP/DOWN keys to prevent browser crash
        this.lastPageNavTime = 0;
        this.pageNavThrottleDelay = 100; // Only process page navigation every 100ms
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
        
        // Create container for level entry submenu
        this.levelEntryContainer = this.add.container(0, 0);
        this.levelEntryContainer.setVisible(false);
        
        // Create all menus
        this.createMainMenu();
        this.createLevelMenu();
        this.createLevelEntryMenu();
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
        
        // Option 2: Browse Levels
        this.browseLevelsText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing, 
            'Browse Levels', menuStyle);
        this.browseLevelsText.setOrigin(0.5);
        
        // Option 3: Enter Level
        this.enterLevelText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing * 2, 
            'Enter Level', menuStyle);
        this.enterLevelText.setOrigin(0.5);
        
        // Option 4: Physics Debug Settings
        const physicsDebugStatus = this.isPhysicsDebugActive ? '[ON]' : '[OFF]';
        this.physicsDebugText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing * 3, 
            `Physics Debug Settings ${physicsDebugStatus}`, menuStyle);
        this.physicsDebugText.setOrigin(0.5);
        
        // Option 5: Reset High Score
        this.resetScoreText = this.add.text(GAME_WIDTH / 2, menuY + optionSpacing * 4, 
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
            this.browseLevelsText,
            this.enterLevelText,
            this.physicsDebugText,
            this.resetScoreText,
            this.mainSelectionIndicator,
            this.mainInstructions,
            this.confirmationText
        ]);
        
        // Store menu options for easy access
        this.mainMenuOptions = [
            this.godModeText,
            this.browseLevelsText,
            this.enterLevelText,
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
            'USE ↑↓ TO SELECT   PAGE UP/DOWN FOR ±30   ENTER TO JUMP   ESC TO GO BACK', 
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
    
    createLevelEntryMenu() {
        const titleStyle = {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        };
        
        const numberStyle = {
            fontSize: '48px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        };
        
        const instructionStyle = {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa'
        };
        
        // Title
        this.levelEntryTitle = this.add.text(GAME_WIDTH / 2, 150, 'ENTER LEVEL NUMBER', titleStyle);
        this.levelEntryTitle.setOrigin(0.5);
        
        // Level number display with cursor
        this.enteredLevel = '';
        this.levelNumberText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '_', numberStyle);
        this.levelNumberText.setOrigin(0.5);
        
        // Instructions
        this.levelEntryInstructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 
            'TYPE LEVEL NUMBER   ENTER TO JUMP   ESC TO CANCEL', 
            instructionStyle);
        this.levelEntryInstructions.setOrigin(0.5);
        
        // Error message (initially hidden)
        this.levelEntryError = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '', {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.levelEntryError.setOrigin(0.5);
        
        // Add all to level entry container
        this.levelEntryContainer.add([
            this.levelEntryTitle,
            this.levelNumberText,
            this.levelEntryInstructions,
            this.levelEntryError
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
    
    showLevelEntryMenu() {
        this.menuState = 'levelEntry';
        this.mainMenuContainer.setVisible(false);
        this.levelMenuContainer.setVisible(false);
        this.physicsDebugContainer.setVisible(false);
        this.levelEntryContainer.setVisible(true);
        this.titleText.setText('DEVELOPER MENU');
        this.enteredLevel = '';
        this.levelNumberText.setText('_');
        this.levelEntryError.setText('');
    }
    
    showPhysicsDebugMenu() {
        this.menuState = 'physicsDebug';
        this.mainMenuContainer.setVisible(false);
        this.levelMenuContainer.setVisible(false);
        this.levelEntryContainer.setVisible(false);
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
        // Initialize styles for reuse
        this.listStyle = {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff'
        };
        
        // Enemy emoji mapping - matches EMOJIS from constants.js
        this.enemyEmojis = {
            'crab': '🦀',
            'hawk': '🦅',
            'human': '🚶',
            'orca': '🐋',
            'polarbear': '🐻‍❄️'
        };
        
        // Initialize level texts array
        this.levelTexts = [];
        
        // Load initial batch centered around current level
        const initialStart = Math.max(1, this.currentLevel - this.loadBatchSize);
        const initialEnd = Math.min(this.currentLevel + this.maxTotalLevels, this.currentLevel + this.loadBatchSize);
        
        this.loadLevelBatch(initialStart, initialEnd);
        
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
    
    loadLevelBatch(startLevel, endLevel) {
        const themeKeys = Object.keys(THEMES);
        
        logger.debug(`[DD MENU] Loading level batch: ${startLevel} to ${endLevel}`);
        
        // Update loaded range
        this.loadedStartLevel = Math.min(this.loadedStartLevel || startLevel, startLevel);
        this.loadedEndLevel = Math.max(this.loadedEndLevel || endLevel, endLevel);
        
        let loadedCount = 0;
        for (let level = startLevel; level <= endLevel; level++) {
            // Skip if already loaded
            if (this.levelTextMap.has(level)) continue;
            
            const themeIndex = (level - 1) % themeKeys.length;
            const themeName = themeKeys[themeIndex];
            const theme = THEMES[themeName];
            
            // Position in list
            const yPos = (level - this.currentLevel) * 25;
            
            // Level number and theme
            const levelText = this.add.text(-300, yPos, `Level ${level.toString().padStart(3, ' ')}`, this.listStyle);
            levelText.setData('level', level);
            
            // Theme name with color indicator
            const themeText = this.add.text(-100, yPos, themeName.toUpperCase(), {
                ...this.listStyle,
                color: this.getThemeColor(themeName)
            });
            
            // Enemy types
            const enemies = theme.enemies || [];
            const enemyString = enemies.map(e => this.enemyEmojis[e] || e.substr(0,3).toUpperCase()).join(' ');
            const enemyText = this.add.text(100, yPos, enemyString, {
                ...this.listStyle,
                fontSize: '14px',
                color: '#ff9999'
            });
            
            // Create level item object
            const levelItem = { 
                level, 
                levelText, 
                themeText, 
                enemyText, 
                yPos,
                currentText: null
            };
            
            // Add current level indicator
            if (level === this.currentLevel) {
                const currentText = this.add.text(250, yPos, '← CURRENT', {
                    ...this.listStyle,
                    color: '#00ff00'
                });
                levelItem.currentText = currentText;
                this.levelListContainer.add(currentText);
            }
            
            this.levelListContainer.add([levelText, themeText, enemyText]);
            this.levelTexts.push(levelItem);
            this.levelTextMap.set(level, levelItem);
            loadedCount++;
        }
        
        // Sort levelTexts array by level number
        this.levelTexts.sort((a, b) => a.level - b.level);
        
        logger.debug(`[DD MENU] Loaded ${loadedCount} levels. Total loaded range: ${this.loadedStartLevel} to ${this.loadedEndLevel} (${this.levelTextMap.size} total)`);
    }
    
    checkAndLoadMoreLevels() {
        const loadThreshold = 20; // Load more when within 20 levels of edge
        const cleanupDistance = 150; // Remove levels more than 150 away
        
        // Check if we need to load more levels at the boundaries
        if (this.selectedLevel - this.loadedStartLevel < loadThreshold && this.loadedStartLevel > 1) {
            const newStart = Math.max(1, this.loadedStartLevel - this.loadBatchSize);
            this.loadLevelBatch(newStart, this.loadedStartLevel - 1);
        }
        
        const maxLevel = this.currentLevel + this.maxTotalLevels;
        if (this.loadedEndLevel - this.selectedLevel < loadThreshold && this.loadedEndLevel < maxLevel) {
            const newEnd = Math.min(maxLevel, this.loadedEndLevel + this.loadBatchSize);
            this.loadLevelBatch(this.loadedEndLevel + 1, newEnd);
        }
        
        // Clean up distant levels to maintain performance
        const beforeCleanup = this.levelTexts.length;
        this.levelTexts = this.levelTexts.filter(item => {
            const distance = Math.abs(item.level - this.selectedLevel);
            if (distance > cleanupDistance) {
                // Remove from container and destroy
                item.levelText.destroy();
                item.themeText.destroy();
                item.enemyText.destroy();
                if (item.currentText) item.currentText.destroy();
                this.levelTextMap.delete(item.level);
                
                // Update loaded range
                if (item.level === this.loadedStartLevel) {
                    this.loadedStartLevel = Math.min(...this.levelTextMap.keys());
                }
                if (item.level === this.loadedEndLevel) {
                    this.loadedEndLevel = Math.max(...this.levelTextMap.keys());
                }
                
                return false;
            }
            return true;
        });
        
        const removedCount = beforeCleanup - this.levelTexts.length;
        if (removedCount > 0) {
            logger.debug(`[DD MENU] Cleaned up ${removedCount} distant levels. New range: ${this.loadedStartLevel} to ${this.loadedEndLevel} (${this.levelTextMap.size} total)`);
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
        
        // Page Up/Down navigation for level selection (30 levels at a time)
        // Throttled to prevent browser crash when keys are held down
        this.input.keyboard.on('keydown-PAGE_UP', () => {
            if (this.menuState === 'levelSelect') {
                const currentTime = Date.now();
                if (currentTime - this.lastPageNavTime >= this.pageNavThrottleDelay) {
                    this.lastPageNavTime = currentTime;
                    this.navigateLevelMenu(-30);
                }
            }
        });
        
        this.input.keyboard.on('keydown-PAGE_DOWN', () => {
            if (this.menuState === 'levelSelect') {
                const currentTime = Date.now();
                if (currentTime - this.lastPageNavTime >= this.pageNavThrottleDelay) {
                    this.lastPageNavTime = currentTime;
                    this.navigateLevelMenu(30);
                }
            }
        });
        
        // Enter key activation
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.menuState === 'main') {
                this.activateMainMenuOption();
            } else if (this.menuState === 'levelSelect') {
                this.jumpToLevel();
            } else if (this.menuState === 'levelEntry') {
                this.jumpToEnteredLevel();
            } else if (this.menuState === 'physicsDebug') {
                this.togglePhysicsDebug();
            }
        });
        
        // ESC key behavior
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.menuState === 'levelSelect' || this.menuState === 'levelEntry' || this.menuState === 'physicsDebug') {
                // Go back to main menu
                this.showMainMenu();
            } else {
                // Close entire menu
                this.closeMenu();
            }
        });
        
        // Number input for level entry
        const digitKeys = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
        const numpadKeys = ['NUMPAD_ZERO', 'NUMPAD_ONE', 'NUMPAD_TWO', 'NUMPAD_THREE', 'NUMPAD_FOUR', 
                            'NUMPAD_FIVE', 'NUMPAD_SIX', 'NUMPAD_SEVEN', 'NUMPAD_EIGHT', 'NUMPAD_NINE'];
        
        for (let i = 0; i <= 9; i++) {
            // Regular number keys
            this.input.keyboard.on(`keydown-${digitKeys[i]}`, () => {
                if (this.menuState === 'levelEntry' && this.enteredLevel.length < 7) {
                    this.enteredLevel += i.toString();
                    this.updateLevelEntryDisplay();
                }
            });
            
            // Numpad keys
            this.input.keyboard.on(`keydown-${numpadKeys[i]}`, () => {
                if (this.menuState === 'levelEntry' && this.enteredLevel.length < 7) {
                    this.enteredLevel += i.toString();
                    this.updateLevelEntryDisplay();
                }
            });
        }
        
        // Backspace for level entry
        this.input.keyboard.on('keydown-BACKSPACE', () => {
            if (this.menuState === 'levelEntry' && this.enteredLevel.length > 0) {
                this.enteredLevel = this.enteredLevel.slice(0, -1);
                this.updateLevelEntryDisplay();
            }
        });
    }
    
    navigateMainMenu(direction) {
        this.mainMenuIndex = Math.max(0, Math.min(4, this.mainMenuIndex + direction));
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
            case 1: // Browse Levels
                this.showLevelMenu();
                break;
            case 2: // Enter Level
                this.showLevelEntryMenu();
                break;
            case 3: // Physics Debug Settings
                this.showPhysicsDebugMenu();
                break;
            case 4: // Reset High Score
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
        this.levelEntryContainer.setVisible(false);
        this.physicsDebugContainer.setVisible(false);
        this.titleText.setText('DEVELOPER MENU');
        this.updateMainMenuSelection();
    }
    
    showLevelMenu() {
        this.menuState = 'levelSelect';
        this.mainMenuContainer.setVisible(false);
        this.levelMenuContainer.setVisible(true);
        this.titleText.setText('DEVELOPER MENU');
        
        // Ensure selected level is loaded
        if (!this.levelTextMap.has(this.selectedLevel)) {
            const batchStart = Math.max(1, this.selectedLevel - this.loadBatchSize / 2);
            const batchEnd = Math.min(this.currentLevel + this.maxTotalLevels, this.selectedLevel + this.loadBatchSize / 2);
            this.loadLevelBatch(batchStart, batchEnd);
        }
        
        this.updateLevelSelection();
    }
    
    navigateLevelMenu(direction) {
        const oldLevel = this.selectedLevel;
        
        // Handle both single steps and page jumps
        if (direction < 0) {
            this.selectedLevel = Math.max(1, this.selectedLevel + direction);
        } else if (direction > 0) {
            // Don't go beyond the max level we're showing
            const maxLevel = this.currentLevel + this.maxTotalLevels;
            this.selectedLevel = Math.min(maxLevel, this.selectedLevel + direction);
        }
        
        // Only update if level actually changed
        if (this.selectedLevel !== oldLevel) {
            // Check if we need to load more levels
            this.checkAndLoadMoreLevels();
            
            // If selected level is not loaded yet, load a batch around it
            if (!this.levelTextMap.has(this.selectedLevel)) {
                const batchStart = Math.max(1, this.selectedLevel - this.loadBatchSize / 2);
                const batchEnd = Math.min(this.currentLevel + this.maxTotalLevels, this.selectedLevel + this.loadBatchSize / 2);
                this.loadLevelBatch(batchStart, batchEnd);
            }
            
            this.updateLevelSelection();
            this.scrollList();
        }
    }
    
    updateLevelSelection() {
        // Find the text object for the selected level
        const selectedItem = this.levelTextMap.get(this.selectedLevel);
        
        if (selectedItem) {
            // Recalculate Y positions for all visible items based on selected level
            this.levelTexts.forEach(item => {
                const newYPos = (item.level - this.selectedLevel) * 25;
                item.yPos = newYPos;
                item.levelText.setY(newYPos);
                item.themeText.setY(newYPos);
                item.enemyText.setY(newYPos);
                if (item.currentText) {
                    item.currentText.setY(newYPos);
                }
            });
            
            // Position the selection indicator at 0 (selected level position)
            this.levelSelectionIndicator.setY(0);
            
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
        // Center the container on screen since selected level is always at y=0
        const targetY = GAME_HEIGHT / 2 + 20;
        
        this.tweens.add({
            targets: this.levelListContainer,
            y: targetY,
            duration: 200,
            ease: 'Power2'
        });
    }
    
    jumpToLevel() {
        logger.info(`Jumping to level ${this.selectedLevel}`);
        
        // Clear the dev menu flag in parent scene before jumping
        // This ensures clean state transition
        if (this.parentScene) {
            this.parentScene.isDevMenuOpen = false;
            logger.debug('[DD MENU] Cleared isDevMenuOpen flag in parent scene before jump');
        }
        
        // Use the global jumpToLevel function for consistency
        if (window.jumpToLevel) {
            window.jumpToLevel(this.selectedLevel);
        } else {
            logger.error('Global jumpToLevel function not found');
        }
    }
    
    updateLevelEntryDisplay() {
        if (this.enteredLevel.length === 0) {
            this.levelNumberText.setText('_');
        } else {
            this.levelNumberText.setText(this.enteredLevel + '_');
        }
        this.levelEntryError.setText('');
    }
    
    jumpToEnteredLevel() {
        if (this.enteredLevel.length === 0) {
            this.levelEntryError.setText('Please enter a level number');
            return;
        }
        
        const levelNumber = parseInt(this.enteredLevel, 10);
        
        if (isNaN(levelNumber) || levelNumber < 1) {
            this.levelEntryError.setText('Invalid level number');
            return;
        }
        
        if (levelNumber > 9999999) {
            this.levelEntryError.setText('Level number too large');
            return;
        }
        
        logger.info(`Jumping to entered level ${levelNumber}`);
        
        // Clear the dev menu flag in parent scene before jumping
        if (this.parentScene) {
            this.parentScene.isDevMenuOpen = false;
            logger.debug('[DD MENU] Cleared isDevMenuOpen flag in parent scene before jump');
        }
        
        // Use the global jumpToLevel function for consistency
        if (window.jumpToLevel) {
            window.jumpToLevel(levelNumber);
        } else {
            logger.error('Global jumpToLevel function not found');
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