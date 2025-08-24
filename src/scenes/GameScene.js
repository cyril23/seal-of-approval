import Phaser from 'phaser';
import Seal from '../entities/Seal.js';
import Enemy from '../entities/Enemy.js';
import Collectible from '../entities/Collectible.js';
import LevelGenerator from '../managers/LevelGenerator.js';
import ScoreManager from '../managers/ScoreManager.js';
import InfoOverlay from '../ui/InfoOverlay.js';
import { getLevelInfo, shouldShowInfo } from '../utils/gameInfo.js';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_WIDTH, LEVEL, THEMES, CAMERA, SCORING, DEBUG } from '../utils/constants.js';
import logger from '../utils/logger.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.isPaused = false;
        this.currentLevel = 1;
        this.timeRemaining = LEVEL.TIME_LIMIT;
        this.lastDKeyTime = 0;  // For double-D detection
        this.currentLevelInfo = null;  // Store level info for 'I' key
        this.restartConfirmDialog = null;  // Restart confirmation dialog
        this.isDevMenuOpen = false;  // Track if dev menu is open
        this.reachedCheckpoint = false;  // Track if player reached mid-level checkpoint
        this.checkpointX = 0;  // X position of checkpoint
        this.checkpointY = 0;  // Y position of checkpoint
    }

    init(data) {
        // Reset pause state on scene start/restart
        this.isPaused = false;

        // Receive level from scene restart or start fresh
        this.currentLevel = data?.level || 1;
        this.initialScore = data?.score || 0;
        this.initialLives = data?.lives || null;  // Lives from previous level, or null for level 1
        this.initialSize = data?.size || 1;  // Seal size from previous level, default to 1
        this.currentLevelInfo = null;  // Reset cached level info for new level

        // Check if this is a restart (R key) - if so, force size to 1
        const isRestart = data?.isRestart || false;
        if (isRestart) {
            this.initialSize = 1;  // Always reset to size 1 on restart
            logger.info('GameScene.init() - RESTART - Size reset to 1');
        }

        logger.info('GameScene.init() - Starting level:', this.currentLevel,
            'with score:', this.initialScore, 'lives:', this.initialLives, 'size:', this.initialSize);
    }

    create() {
        logger.debug('GameScene.create() starting...');

        // Reset goal reached flag when scene starts/restarts
        this.goalReached = false;
        
        // Reset player falling flag when scene starts/restarts
        this.playerFalling = false;
        
        // Reset checkpoint flag when scene starts/restarts
        this.reachedCheckpoint = false;
        
        // Explicitly reset dev menu flag when scene starts
        // This ensures it's always false regardless of how the scene was started
        this.isDevMenuOpen = false;
        logger.debug('[INIT] Dev menu flag reset to false');

        // Reset time remaining when scene starts/restarts
        this.timeRemaining = LEVEL.TIME_LIMIT;
        logger.debug('Starting level with time:', this.timeRemaining);

        // Set up world bounds for side-scrolling
        // Extend bottom boundary by 200px so seal visually falls off screen before dying
        // (Size 3 seal is 96px tall, center is 48px from bottom edge)
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT + 200);
        this.physics.world.gravity.y = 800;

        // Deterministic theme selection based on level
        const themeKeys = Object.keys(THEMES);
        const themeIndex = (this.currentLevel - 1) % themeKeys.length;
        this.currentTheme = THEMES[themeKeys[themeIndex]];
        logger.info(`Level ${this.currentLevel} - Theme: ${this.currentTheme.name}`);

        // Create tiling background
        logger.debug('Creating scrolling background...');
        this.createScrollingBackground();

        logger.debug('Initializing managers...');
        this.levelGenerator = new LevelGenerator(this);
        this.scoreManager = new ScoreManager(this, this.initialScore);
        // Use global AudioManager and set scene context
        this.audioManager = this.game.audioManager;
        this.audioManager.setScene(this);

        logger.debug('Creating physics groups...');
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.collectibles = this.physics.add.group();

        logger.debug('Generating level...');
        this.levelGenerator.generateLevel(this.currentTheme, this.currentLevel);

        logger.debug('Creating player...');
        // Start player at left side of level
        // Pass lives and size from previous level (size resets to 1 on restart)
        this.player = new Seal(this, 200, GAME_HEIGHT - 200, this.initialLives, this.initialSize);
        // Set player depth to be above platforms but below UI
        this.player.sprite.setDepth(5);
        
        // Reset all power-ups when starting/restarting level
        this.player.resetPowerUps();

        // Apply debug settings if enabled
        if (DEBUG.PHYSICS_ENABLED) {
            logger.debug('Enabling physics debug graphics by default');
            this.player.setPhysicsDebugEnabled(true);
        }

        // Enable world bounds detection for fall death
        // Keep setCollideWorldBounds false to allow free movement left/right/up
        this.player.sprite.body.onWorldBounds = true;

        logger.debug('Setting up camera...');
        // Set up camera to follow player
        this.setupCamera();

        logger.debug('Setting up collisions...');
        this.setupCollisions();

        // Listen for world bounds collisions (specifically bottom boundary)
        this.physics.world.on('worldbounds', (body, blockedUp, blockedDown, blockedLeft, blockedRight) => {
            // Only care about player hitting bottom boundary
            if (body === this.player.sprite.body && blockedDown) {
                // Only process fall death once (flag properly reset in create())
                if (!this.playerFalling) {
                    logger.debug(`Player hit bottom world boundary at size ${this.player.currentSize} - triggering fall death`);
                    logger.debug(`Seal Y position: ${this.player.sprite.y.toFixed(1)}, Body bottom: ${body.bottom.toFixed(1)}`);
                    
                    // Disable collision to allow sprite to fall through
                    this.player.sprite.setCollideWorldBounds(false);
                    this.handlePlayerFall();
                }
            }
        });
        logger.debug('Setting up controls...');
        this.setupControls();
        logger.debug('Creating UI...');
        this.createUI();
        this.updateUI(); // Initialize UI with correct values immediately
        logger.debug('Starting timer...');
        this.startTimer();

        // Track distance traveled
        this.maxDistanceTraveled = 0;

        logger.debug('Starting background music...');
        // Start in-game background music
        this.audioManager.playBackgroundMusic(this.currentTheme.name, true);

        // Clean up audio when scene is stopped
        this.events.on('shutdown', () => {
            if (this.audioManager) {
                this.audioManager.stopBackgroundMusic();
            }
        });

        // Clear dev menu flag when scene resumes
        this.events.on('resume', () => {
            logger.debug('GameScene resumed, clearing dev menu flag');
            this.isDevMenuOpen = false;
        });

        logger.debug('Fading in camera...');
        this.cameras.main.fadeIn(500);

        // Create info overlay
        this.infoOverlay = new InfoOverlay(this);

        // Always get level info (for manual 'I' key access)
        logger.debug('[INIT] Getting level info for level', this.currentLevel);
        this.currentLevelInfo = getLevelInfo(this.currentLevel);
        logger.debug('[INIT] Level info retrieved:', !!this.currentLevelInfo);

        // Check if we should auto-show info for this level (levels 1-5 only)
        if (shouldShowInfo(this.currentLevel)) {
            logger.debug('[INIT] Auto-showing info for level', this.currentLevel);
            this.showLevelInfo();
        } else {
            logger.debug('[INIT] Not auto-showing info for level', this.currentLevel, '- starting immediately');
            this.isLevelStarted = true;
        }

        logger.debug('GameScene.create() complete!');
        logger.info('Game controls: R = Restart Level, P = Pause, M = Mute, I = Info, S = Screenshot, DD = Dev Mode');
    }

    createScrollingBackground() {
        // Create multiple background images to tile across the level
        // Calculate exact number needed to cover full level width
        const bgCount = Math.ceil(LEVEL_WIDTH / GAME_WIDTH) + 1;
        logger.debug(`Creating ${bgCount} background tiles to cover level width ${LEVEL_WIDTH}`);

        let actualCoverage = 0;
        for (let i = 0; i < bgCount; i++) {
            const x = i * GAME_WIDTH;
            // Only create backgrounds within or slightly beyond level bounds
            if (x <= LEVEL_WIDTH) {
                const bg = this.add.image(x, GAME_HEIGHT / 2, `bg_${this.currentTheme.name}`);
                bg.setOrigin(0, 0.5); // Anchor at left edge, center vertically

                // Debug: log each background position
                const rightEdge = x + GAME_WIDTH;
                logger.debug(`  Background ${i}: x=${x}, covers ${x} to ${rightEdge}`);
                actualCoverage = Math.max(actualCoverage, rightEdge);

                // Debug: Check if image loaded correctly
                if (!bg.texture || bg.texture.key === '__MISSING') {
                    logger.error(`  WARNING: Background texture failed to load for ${this.currentTheme.name}`);
                }
            }
        }

        logger.debug(`Actual background coverage: 0 to ${actualCoverage} (need ${LEVEL_WIDTH}`);

        if (actualCoverage < LEVEL_WIDTH) {
            logger.error(`WARNING: Background coverage insufficient! Gap from ${actualCoverage} to ${LEVEL_WIDTH}`);
        }

        // Add celestial objects (sun/moon) that appear only once
        this.createCelestialObjects();
    }

    createCelestialObjects() {
        // Add moon for city theme or sun for beach theme (display once, not tiled)
        if (this.currentTheme.name === 'city') {
            // Create crescent moon at fixed position (only visible at start of level)
            const moonX = GAME_WIDTH - 150;
            const moonY = 100;
            const moonRadius = 30;
            
            // Draw main moon circle
            const moonGraphics = this.add.graphics();
            moonGraphics.fillStyle(0xFFFFF0, 0.9);
            moonGraphics.fillCircle(moonX, moonY, moonRadius);
            
            // Create crescent by overlaying with dark circle (shifted left and up)
            moonGraphics.fillStyle(0x0A1929, 1); // Use sky color for overlay
            moonGraphics.fillCircle(moonX - 15, moonY - 5, moonRadius);
            
            logger.debug('City crescent moon added at position:', moonX, moonY);
            
            // Add repeating blinking stars across entire level
            this.createRepeatingStars();
        } else if (this.currentTheme.name === 'beach') {
            // Create sun at fixed position (only visible at start of level)
            const sunGraphics = this.add.graphics();
            sunGraphics.fillStyle(0xFFDD00, 0.9);
            sunGraphics.fillCircle(0, 0, 60); // Draw at origin, position with container
            
            // Position sun in upper right of first screen
            sunGraphics.x = GAME_WIDTH - 150;
            sunGraphics.y = 150;
            
            // Sun stays at fixed world position (doesn't scroll with camera)
            logger.debug('Beach sun added at position:', sunGraphics.x, sunGraphics.y);
        }
    }

    createRepeatingStars() {
        // Create stars that repeat across the entire level width with blinking animation
        // Use imported constants directly
        const starsPerScreen = 15;
        const screenCount = Math.ceil(LEVEL_WIDTH / GAME_WIDTH);
        
        // Generate base star pattern for one screen
        const baseStarPattern = [];
        for (let i = 0; i < starsPerScreen; i++) {
            baseStarPattern.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * (GAME_HEIGHT * 0.30), // Upper 30% of screen (moved 5% higher)
                size: Math.random() * 1.5 + 0.5, // 0.5-2px radius
                shouldBlink: Math.random() < 0.3 // 30% chance to blink
            });
        }
        
        // Repeat the pattern across all screens
        for (let screen = 0; screen < screenCount; screen++) {
            const screenOffsetX = screen * GAME_WIDTH;
            
            baseStarPattern.forEach((star, index) => {
                const starGraphics = this.add.graphics();
                
                // Draw white star at repeated position
                starGraphics.fillStyle(0xFFFFFF, 1);
                starGraphics.fillCircle(screenOffsetX + star.x, star.y, star.size);
                
                if (star.shouldBlink) {
                    // Create slow sine wave blinking animation
                    this.tweens.add({
                        targets: starGraphics,
                        alpha: 0.1, // Fade almost completely out
                        duration: 3000 + Math.random() * 2000, // 3-5 seconds
                        ease: 'Sine.inOut',
                        yoyo: true,
                        repeat: -1,
                        delay: Math.random() * 3000 // Random start delay for variety
                    });
                } else {
                    // Non-blinking stars have slight opacity variation
                    starGraphics.alpha = 0.4 + Math.random() * 0.6;
                }
            });
        }
        
        logger.debug(`Created ${starsPerScreen * screenCount} stars across ${screenCount} screens`);
    }

    setupCamera() {
        // Set camera bounds to level size
        this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

        // Make camera follow player
        this.cameras.main.startFollow(this.player.sprite, true, CAMERA.LERP_X, CAMERA.LERP_Y);

        // Set deadzone for smoother following
        this.cameras.main.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT);
    }

    setupCollisions() {
        // Custom collision processor for player-platform collision
        const platformCollisionProcess = (player, platform) => {
            return true; // Process collision normally
        };

        this.physics.add.collider(this.player.sprite, this.platforms, null, platformCollisionProcess);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.collectibles, this.platforms);

        this.physics.add.overlap(this.player.sprite, this.collectibles, (player, collectible) => {
            this.handleCollectiblePickup(collectible);
        });

        this.physics.add.overlap(this.player.sprite, this.enemies, (player, enemy) => {
            this.handleEnemyCollision(enemy);
        });

        // Add goal collision
        if (this.goal) {
            this.physics.add.overlap(this.player.sprite, this.goal, () => {
                this.handleGoalReached();
            });
        }
        
        // Add checkpoint collision
        if (this.checkpoint) {
            this.physics.add.overlap(this.player.sprite, this.checkpoint, () => {
                this.handleCheckpointReached();
            });
        }
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.keyboard.on('keydown-P', () => {
            logger.debug('[P KEY] Pressed - Checking conditions...');
            // Ignore P key if info overlay is showing or dev menu is open
            if (this.infoOverlay && this.infoOverlay.isShowing) {
                logger.debug('[P KEY] Blocked - Info overlay is showing');
                return;
            }
            if (this.isDevMenuOpen) {
                logger.debug('[P KEY] Blocked - Dev menu is open');
                return;
            }
            logger.debug('[P KEY] Toggling pause');
            this.togglePause();
        });

        // M key is now handled globally in main.js

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });

        // Restart level hotkey
        this.input.keyboard.on('keydown-R', () => {
            // Don't show if already showing or if game hasn't started
            if (!this.restartConfirmDialog && this.isLevelStarted) {
                this.showRestartConfirmation();
            }
        });

        // Info overlay hotkey - toggles on/off
        this.input.keyboard.on('keydown-I', () => {
            logger.debug('[I KEY] Pressed - Level:', this.currentLevel);
            logger.debug('[I KEY] Checking conditions:');
            logger.debug('  - isPaused:', this.isPaused);
            logger.debug('  - isDevMenuOpen:', this.isDevMenuOpen);
            logger.debug('  - currentLevelInfo exists:', !!this.currentLevelInfo);
            logger.debug('  - isLevelStarted:', this.isLevelStarted);
            
            // Ignore I key if game is paused or dev menu is open
            if (this.isPaused) {
                logger.debug('[I KEY] Blocked - Game is paused');
                return;
            }
            if (this.isDevMenuOpen) {
                logger.debug('[I KEY] Blocked - Dev menu is open');
                return;
            }
            
            // Toggle info overlay if we have info and level has started
            if (this.currentLevelInfo && this.isLevelStarted) {
                if (this.infoOverlay.isShowing) {
                    logger.debug('[I KEY] Hiding info overlay');
                    // Hide if showing
                    this.infoOverlay.hide();
                } else {
                    logger.debug('[I KEY] Showing info overlay');
                    // Show if hidden
                    this.showLevelInfo();
                }
            } else {
                logger.debug('[I KEY] Cannot toggle - missing requirements');
                if (!this.currentLevelInfo) logger.debug('  - No level info available');
                if (!this.isLevelStarted) logger.debug('  - Level not started yet');
            }
        });

        // Developer screenshot hotkey
        this.input.keyboard.on('keydown-S', () => {
            this.captureScreenshot();
        });

        // Developer menu with double-D detection
        this.input.keyboard.on('keydown-D', () => {
            const currentTime = this.time.now;
            const timeSinceLastD = currentTime - this.lastDKeyTime;
            logger.debug('[D KEY] Pressed - Time since last D:', timeSinceLastD, 'ms');

            // Check for double-D press (within 300ms)
            if (timeSinceLastD < 300) {
                logger.info('[DD] Double-D detected! Opening developer menu');
                // Double-D pressed - open developer menu
                this.openDeveloperMenu();
                this.lastDKeyTime = 0; // Reset to prevent triple press
            } else {
                logger.debug('[D KEY] Single D press - waiting for potential double-D');
                // Single D press - just update time for double-D detection
                this.lastDKeyTime = currentTime;
            }
        });
    }

    createUI() {
        const uiStyle = {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        };

        // Fix UI elements to camera
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', uiStyle);
        this.scoreText.setScrollFactor(0);

        this.livesText = this.add.text(20, 50, 'LIVES: 3', uiStyle);
        this.livesText.setScrollFactor(0);

        // Size indicator
        this.sizeText = this.add.text(20, 80, 'SIZE: ●○○', uiStyle);
        this.sizeText.setScrollFactor(0);

        this.timeText = this.add.text(GAME_WIDTH - 20, 20, 'TIME: 180', uiStyle);
        this.timeText.setOrigin(1, 0);
        this.timeText.setScrollFactor(0);

        // Show level and theme name
        const themeName = this.currentTheme.name.charAt(0).toUpperCase() + this.currentTheme.name.slice(1);
        this.levelText = this.add.text(GAME_WIDTH / 2, 20, `LEVEL ${this.currentLevel} - ${themeName}`, uiStyle);
        this.levelText.setOrigin(0.5, 0);
        this.levelText.setScrollFactor(0);


        // Add progress bar
        this.progressText = this.add.text(GAME_WIDTH / 2, 60, 'PROGRESS: 0%', uiStyle);
        this.progressText.setOrigin(0.5, 0);
        this.progressText.setScrollFactor(0);

        // Developer mode indicator
        this.devModeText = this.add.text(GAME_WIDTH - 20, 50, 'GOD MODE', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#FF00FF',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.devModeText.setOrigin(1, 0);
        this.devModeText.setScrollFactor(0);
        this.devModeText.setVisible(false);

        this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED', {
            fontSize: '48px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.pauseText.setOrigin(0.5);
        this.pauseText.setScrollFactor(0);
        this.pauseText.setVisible(false);

        // Create mute indicator
        this.createMuteIndicator();
    }

    createMuteIndicator() {
        // Create background for better visibility
        const bgPadding = 8;
        this.muteIndicatorBg = this.add.rectangle(
            GAME_WIDTH - 40, 
            60,  // Positioned below the timer
            40 + bgPadding * 2,
            40 + bgPadding * 2,
            0x000000, 
            0.5
        );
        this.muteIndicatorBg.setOrigin(0.5);
        this.muteIndicatorBg.setScrollFactor(0);

        // Create mute icon text (only shows when muted)
        this.muteIndicator = this.add.text(
            GAME_WIDTH - 40,
            60,
            '🔇',
            {
                fontSize: '24px',
                fontFamily: '"Press Start 2P", monospace'
            }
        );
        this.muteIndicator.setOrigin(0.5);
        this.muteIndicator.setScrollFactor(0);
        
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

    startTimer() {
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                // Only countdown if level has started (not showing info) and not paused
                if (this.isLevelStarted && !this.isPaused) {
                    this.timeRemaining--;
                    this.updateUI();

                    if (this.timeRemaining <= 0) {
                        logger.info('Time ran out! Game over.');
                        this.gameOver();
                    }

                    if (this.timeRemaining <= 10) {
                        this.timeText.setColor('#ff0000');
                        this.audioManager.playSound('warning');
                    }
                }
            },
            loop: true
        });
    }

    handleCollectiblePickup(collectible) {
        const data = collectible.getData('collectibleData');

        logger.debug(`Collecting ${data.type} at position (${collectible.x.toFixed(0)}, ${collectible.y.toFixed(0)})`);
        logger.debug(`Player position before: (${this.player.sprite.x.toFixed(0)}, ${this.player.sprite.y.toFixed(0)})`);
        logger.debug(`Player velocity before: (${this.player.sprite.body.velocity.x.toFixed(0)}, ${this.player.sprite.body.velocity.y.toFixed(0)})`);
        logger.debug(`Player on ground before: ${this.player.sprite.body.blocked.down || this.player.sprite.body.touching.down}`);

        if (data.type === 'fish') {
            // Grow the seal when eating fish
            this.player.growSize();
            
            // Eating a fish always grants one fart (digestion!)
            this.player.hasFartAvailable = true;

            const points = 100;
            this.scoreManager.addScore(points);
            this.showScorePopup(collectible.x, collectible.y, `+${points} FISH!`, 0x00ff00);
            this.audioManager.playSound('eat');
            logger.debug(`Fish eaten! Score: +${points}, Size: ${this.player.currentSize}`);
        } else if (data.type === 'star') {
            this.player.setInvincible(10000);
            this.showScorePopup(collectible.x, collectible.y, 'INVINCIBLE!', 0xffff00);
            this.audioManager.playSound('powerup');
        } else if (data.type === 'speed') {
            this.player.setSpeedBoost(15000);
            this.showScorePopup(collectible.x, collectible.y, 'SPEED UP!', 0x00ffff);
            this.audioManager.playSound('powerup');
        } else if (data.type === 'time') {
            this.timeRemaining += 30;
            this.showScorePopup(collectible.x, collectible.y, '+30 TIME!', 0xff00ff);
            this.audioManager.playSound('powerup');
        } else if (data.type === 'life') {
            this.player.lives++;
            this.showScorePopup(collectible.x, collectible.y, 'EXTRA LIFE!', 0xff0000);
            this.audioManager.playSound('powerup');
        } else if (data.type === 'magnet') {
            this.player.setMagnet(10000);
            this.showScorePopup(collectible.x, collectible.y, 'MAGNET!', 0x9900ff);
            this.audioManager.playSound('powerup');
        }

        collectible.destroy();
        this.updateUI();
    }

    handleEnemyCollision(enemy) {
        // Ghost mode: no collision interaction at all (pass through enemies)
        if (this.player.ghostMode) {
            // Do nothing - seal passes through enemies like a ghost
            return;
        }
        
        // Invincibility from star powerup: defeat enemies on contact
        if (this.player.invincible) {
            this.scoreManager.addScore(200);
            this.showScorePopup(enemy.x, enemy.y, '+200 ENEMY!', 0xff9900);
            enemy.destroy();
            this.audioManager.playSound('enemyDefeat');
        } else if (this.player.sprite.body.velocity.y > 0 &&
                   this.player.sprite.y < enemy.y - 10) {
            // Check if this is a polar bear or orca - they can't be stomped
            if (enemy.type === 'polarbear' || enemy.type === 'orca') {
                // Attempting to stomp a polar bear or orca results in taking damage instead
                this.player.takeDamage();
                this.audioManager.playSound('hurt');
                
                logger.info(`Player tried to stomp a ${enemy.type}! Taking damage instead.`);
                
                if (this.player.lives <= 0) {
                    this.gameOver();
                }
            } else {
                // Normal stomp for other enemies
                this.scoreManager.addScore(200);
                this.showScorePopup(enemy.x, enemy.y, '+200 STOMP!', 0xff9900);
                enemy.destroy();
                this.player.sprite.setVelocityY(-300);
                this.audioManager.playSound('enemyDefeat');
                // Brief invincibility to handle overlapping enemies
                this.player.setInvincible(200);
            }
        } else {
            this.player.takeDamage();
            this.audioManager.playSound('hurt');

            if (this.player.lives <= 0) {
                this.gameOver();
            }
        }

        this.updateUI();
    }

    handleCheckpointReached() {
        if (this.reachedCheckpoint) return; // Prevent multiple triggers
        this.reachedCheckpoint = true;
        
        logger.info('Checkpoint reached!');
        
        // Visual feedback - just turn the checkpoint green (no animation)
        this.checkpoint.setTint(0x00ff00);
        
        // Play a success sound
        this.audioManager.playSound('powerup');
        
        // Show checkpoint message
        const checkpointText = this.add.text(this.checkpoint.x, this.checkpoint.y - 50,
            'CHECKPOINT!', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        checkpointText.setOrigin(0.5);
        
        // Animate text floating up and fading
        this.tweens.add({
            targets: checkpointText,
            y: checkpointText.y - 30,
            alpha: 0,
            duration: 1500,
            onComplete: () => checkpointText.destroy()
        });
    }
    
    handleGoalReached() {
        if (this.goalReached) return; // Prevent multiple triggers
        this.goalReached = true;

        // Stop timer
        this.timerEvent.destroy();

        // Add completion bonus
        this.scoreManager.addScore(SCORING.LEVEL_COMPLETE_BONUS);

        // Play victory sound
        this.audioManager.playSound('levelComplete');

        // Show completion message
        const completeText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY,
            'LEVEL COMPLETE!', {
            fontSize: '48px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        completeText.setOrigin(0.5);
        completeText.setScrollFactor(0);

        // Calculate bonuses
        const timeBonus = this.timeRemaining * SCORING.TIME_BONUS_MULTIPLIER;
        const progress = this.calculateProgressPoints();
        
        // Wait a moment then animate time bonus
        this.time.delayedCall(1500, () => {
            // Hide level complete text
            completeText.destroy();
            
            // Animate time bonus
            this.scoreManager.animateBonusPoints(timeBonus, 'TIME', () => {
                // After time bonus, animate distance bonus if any
                if (progress.points > 0) {
                    this.time.delayedCall(500, () => {
                        this.scoreManager.animateBonusPoints(progress.points, 'DISTANCE', () => {
                            // Proceed to next level after all bonuses
                            this.time.delayedCall(1000, () => {
                                this.nextLevel();
                            });
                        });
                    });
                } else {
                    // No distance bonus, proceed to next level
                    this.time.delayedCall(1000, () => {
                        this.nextLevel();
                    });
                }
            });
        });
    }

    handlePlayerFall() {
        if (this.playerFalling) return; // Prevent multiple triggers
        this.playerFalling = true;

        // Player loses a life when falling (bypasses invincibility)
        // Fall death always happens regardless of power-ups
        this.player.lives--;
        this.audioManager.playSound('fall');

        logger.info('Player fell to death. Lives remaining:', this.player.lives);

        if (this.player.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn player at last safe position
            this.respawnPlayer();
        }
    }

    respawnPlayer() {
        // Flash the screen red briefly
        this.cameras.main.flash(500, 255, 0, 0);
        
        // Determine respawn position based on checkpoint
        let respawnX = 200;  // Default to level start
        let respawnY = GAME_HEIGHT - 200;
        
        if (this.reachedCheckpoint) {
            // Respawn at checkpoint position (drop from sky)
            respawnX = this.checkpointX;
            respawnY = 50;  // Start high in the sky for safe landing
            logger.info('Respawning at checkpoint position');
        } else {
            logger.info('Respawning at level start');
        }

        // Reset player position
        this.player.sprite.setPosition(respawnX, respawnY);
        this.player.sprite.setVelocity(0, 0);

        // Re-enable world bounds collision for the respawned player
        this.player.sprite.setCollideWorldBounds(true);

        // Reset to size 1 after death
        this.player.resetSize();
        
        // Clear all power-ups on respawn
        this.player.resetPowerUps();

        // Give temporary invincibility
        this.player.setInvincible(3000);

        // Reset camera appropriately
        if (this.reachedCheckpoint) {
            // Set camera to checkpoint area
            this.cameras.main.scrollX = Math.max(0, respawnX - GAME_WIDTH / 2);
        } else {
            // Reset camera to level start
            this.cameras.main.scrollX = 0;
        }

        // Update UI
        this.updateUI();

        // Reset fall flag after a short delay
        // Reduced from 500ms to 100ms to prevent getting stuck on rapid falls
        this.time.delayedCall(100, () => {
            this.playerFalling = false;
        });
    }

    showScorePopup(x, y, text, color = 0xffffff) {
        const popup = this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#' + color.toString(16).padStart(6, '0'),
            stroke: '#000000',
            strokeThickness: 2
        });
        popup.setOrigin(0.5);

        // Animate the popup floating up and fading out
        this.tweens.add({
            targets: popup,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                popup.destroy();
            }
        });
    }

    updateUI() {
        this.scoreText.setText(`SCORE: ${this.scoreManager.score}`);
        this.livesText.setText(`LIVES: ${this.player.lives}`);
        this.timeText.setText(`TIME: ${this.timeRemaining}`);

        // Update size indicator
        const sizeIndicator = this.getSizeIndicator(this.player.currentSize);
        this.sizeText.setText(`SIZE: ${sizeIndicator}`);

        // Update progress percentage toward goal
        const progress = Math.floor((this.player.sprite.x / LEVEL.GOAL_POSITION) * 100);
        this.progressText.setText(`PROGRESS: ${Math.min(progress, 100)}%`);

    }

    getSizeIndicator(size) {
        switch(size) {
            case 1: return '●○○';
            case 2: return '●●○';
            case 3: return '●●●';
            default: return '●○○';
        }
    }

    togglePause() {
        logger.debug('[PAUSE] Toggling pause from', this.isPaused, 'to', !this.isPaused);
        this.isPaused = !this.isPaused;
        this.pauseText.setVisible(this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
            logger.info('[PAUSE] Game paused');
        } else {
            this.physics.resume();
            logger.info('[PAUSE] Game resumed');
        }
    }

    toggleDeveloperMode() {
        if (!this.player) return;

        // Toggle the mode
        const newState = !this.player.developerMode;
        this.player.setDeveloperMode(newState);

        // Update UI
        this.devModeText.setVisible(newState);

        // Visual feedback
        if (newState) {
            logger.info('Developer Mode: ENABLED');
        } else {
            logger.info('Developer Mode: DISABLED');
        }
    }

    openDeveloperMenu() {
        logger.debug('Opening Developer Menu...');

        // Close info overlay instantly if it's showing
        if (this.infoOverlay && this.infoOverlay.isShowing) {
            logger.debug('Closing info overlay before opening developer menu');
            this.infoOverlay.hide(true);  // true = instant hide without animation
        }

        // Clear pause state if game is paused
        if (this.isPaused) {
            logger.debug('Clearing pause state before opening developer menu');
            this.isPaused = false;
            this.pauseText.setVisible(false);
            this.physics.resume();
        }

        // Mark dev menu as open
        this.isDevMenuOpen = true;

        // Launch the developer menu as an overlay scene
        this.scene.launch('DevMenuScene', {
            currentLevel: this.currentLevel,
            parentScene: this
        });
        // Pause this scene while menu is open
        this.scene.pause();
    }

    captureScreenshot() {
        // Version 9.4: Enhanced logging with progress info
        const progress = Math.floor((this.player.sprite.x / LEVEL.GOAL_POSITION) * 100);
        const playerPos = `(${this.player.sprite.x.toFixed(0)}, ${this.player.sprite.y.toFixed(0)})`;
        const bodyPos = this.player.sprite.body ?
            `Body: (${this.player.sprite.body.x.toFixed(0)}, ${this.player.sprite.body.y.toFixed(0)})` : 'Body: N/A';

        logger.info(`=== SCREENSHOT CAPTURE ===`);
        logger.info(`Progress: ${progress}% (Position: ${this.player.sprite.x.toFixed(0)} / ${LEVEL.GOAL_POSITION})`);
        logger.info(`Player: ${playerPos}, ${bodyPos}`);
        logger.info(`Theme: ${this.currentTheme.name}`);
        logger.info(`Lives: ${this.player.lives}, Score: ${this.scoreManager.score}`);
        logger.info(`On Ground: ${this.player.sprite.body ? this.player.sprite.body.blocked.down : 'N/A'}`);

        // Capture the current game canvas
        this.game.renderer.snapshot((image) => {
            // Create a link element to download the image
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `game-screenshot-${timestamp}.png`;
            link.href = image.src;
            link.click();

            logger.info('Screenshot saved as:', link.download);
            logger.info(`=========================`);

            // Show visual feedback
            this.cameras.main.flash(100, 255, 255, 255, true);
        });
    }

    calculateProgressPoints() {
        // Calculate points based on distance traveled
        const distance = Math.floor(this.maxDistanceTraveled);
        const points = Math.floor(distance / 100) * SCORING.DISTANCE_POINTS;
        return { distance, points };
    }

    nextLevel() {
        this.currentLevel++;
        this.timeRemaining = LEVEL.TIME_LIMIT;

        const levelCompleteText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            `LEVEL ${this.currentLevel - 1} COMPLETE!`, {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        levelCompleteText.setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            // Stop background music before restarting scene to prevent overlap
            this.audioManager.stopBackgroundMusic();
            // Pass current lives AND size to the next level
            this.scene.restart({
                level: this.currentLevel,
                score: this.scoreManager.score,
                lives: this.player.lives,
                size: this.player.currentSize  // Preserve seal size between levels
            });
        });
    }

    gameOver() {
        this.timerEvent.destroy();

        // Calculate progress points but DON'T add them yet - let GameOverScene animate them
        const progress = this.calculateProgressPoints();

        // Save high score with current score (before distance bonus)
        this.scoreManager.saveHighScore();
        this.audioManager.stopBackgroundMusic();

        this.scene.start('GameOverScene', {
            score: this.scoreManager.score,
            level: this.currentLevel,
            progressDistance: progress.distance,
            progressPoints: progress.points,
            scoreManager: this.scoreManager // Pass scoreManager for animation
        });
    }

    showLevelInfo() {
        logger.debug('[INFO OVERLAY] showLevelInfo() called for level', this.currentLevel);
        // Pause physics and timer
        this.physics.pause();
        this.isLevelStarted = false;

        // Get info for this level (or use stored info if available)
        if (!this.currentLevelInfo) {
            logger.debug('[INFO OVERLAY] Fetching level info for level', this.currentLevel);
            this.currentLevelInfo = getLevelInfo(this.currentLevel);
        }

        // Show the overlay
        logger.debug('[INFO OVERLAY] Showing overlay with theme:', this.currentTheme.name);
        this.infoOverlay.show(this.currentLevel, this.currentTheme.name, this.currentLevelInfo);
    }

    onInfoOverlayHidden() {
        logger.debug('[INFO OVERLAY] Hidden - resuming game');
        // Resume physics and start the level
        this.physics.resume();
        this.isLevelStarted = true;
    }

    showRestartConfirmation() {
        // Pause the game
        this.isPaused = true;
        this.physics.pause();

        // Create semi-transparent background
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
        bg.setScrollFactor(0);
        bg.setDepth(100);

        // Create confirmation dialog
        const dialogBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 600, 300, 0x222222);
        dialogBg.setScrollFactor(0);
        dialogBg.setDepth(101);
        dialogBg.setStrokeStyle(3, 0xffffff);

        // Title text
        const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80,
            `RESTART LEVEL ${this.currentLevel}?`, {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        titleText.setOrigin(0.5);
        titleText.setScrollFactor(0);
        titleText.setDepth(102);

        // Info text about lives reset
        const livesText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
            `Lives will reset to: ${this.levelStartLives || 1}`, {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        livesText.setOrigin(0.5);
        livesText.setScrollFactor(0);
        livesText.setDepth(102);

        // Current lives text
        const currentLivesText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20,
            `Current lives: ${this.player.lives}`, {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2
        });
        currentLivesText.setOrigin(0.5);
        currentLivesText.setScrollFactor(0);
        currentLivesText.setDepth(102);

        // Instructions
        const instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80,
            'Press ENTER to confirm, ESC to cancel', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        instructionText.setOrigin(0.5);
        instructionText.setScrollFactor(0);
        instructionText.setDepth(102);

        // Store dialog elements
        this.restartConfirmDialog = {
            bg,
            dialogBg,
            titleText,
            livesText,
            currentLivesText,
            instructionText
        };

        // Set up Enter/ESC key handlers
        const enterKey = this.input.keyboard.addKey('ENTER');
        const escKey = this.input.keyboard.addKey('ESC');

        const confirmHandler = () => {
            enterKey.off('down', confirmHandler);
            escKey.off('down', cancelHandler);
            this.closeRestartDialog();
            this.restartLevel();
        };

        const cancelHandler = () => {
            enterKey.off('down', confirmHandler);
            escKey.off('down', cancelHandler);
            this.closeRestartDialog();
            this.isPaused = false;
            this.physics.resume();
        };

        enterKey.once('down', confirmHandler);
        escKey.once('down', cancelHandler);
    }

    closeRestartDialog() {
        if (this.restartConfirmDialog) {
            this.restartConfirmDialog.bg.destroy();
            this.restartConfirmDialog.dialogBg.destroy();
            this.restartConfirmDialog.titleText.destroy();
            this.restartConfirmDialog.livesText.destroy();
            this.restartConfirmDialog.currentLivesText.destroy();
            this.restartConfirmDialog.instructionText.destroy();
            this.restartConfirmDialog = null;
        }
    }

    restartLevel() {
        // Show restart message
        const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            'RESTARTING...', {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        restartText.setOrigin(0.5);
        restartText.setScrollFactor(0);
        restartText.setDepth(103);

        // Wait a moment then restart
        this.time.delayedCall(500, () => {
            // Stop background music before restarting
            this.audioManager.stopBackgroundMusic();

            // Restart the scene with CURRENT values (not checkpoint)
            // Size will be reset to 1 via isRestart flag
            this.scene.restart({
                level: this.currentLevel,
                score: this.scoreManager.score,  // Keep current score
                lives: this.player.lives,  // Keep current lives
                isRestart: true  // Important flag to indicate this is a restart
            });
        });
    }

    update() {
        // Don't update if level hasn't started yet (info screen is showing)
        if (!this.isLevelStarted) {
            return;
        }

        if (!this.isPaused) {
            this.player.update(this.cursors, this.spaceKey);

            // Fall death is now handled by world bounds event listener
            // See worldbounds event in setupCollisions()

            // Track distance traveled (points awarded at level end)
            if (this.player.sprite.x > this.maxDistanceTraveled) {
                this.maxDistanceTraveled = this.player.sprite.x;
            }

            if (this.player.hasMagnet) {
                this.collectibles.children.entries.forEach(collectible => {
                    const distance = Phaser.Math.Distance.Between(
                        this.player.sprite.x, this.player.sprite.y,
                        collectible.x, collectible.y
                    );

                    if (distance < 100) {
                        const angle = Phaser.Math.Angle.Between(
                            collectible.x, collectible.y,
                            this.player.sprite.x, this.player.sprite.y
                        );
                        collectible.setVelocity(
                            Math.cos(angle) * 200,
                            Math.sin(angle) * 200
                        );
                    }
                });
            }

            this.enemies.children.entries.forEach(enemy => {
                if (enemy.update) {
                    enemy.update(this.player.sprite);
                }
            });

            // Update UI with current progress
            this.updateUI();
        }
    }
}