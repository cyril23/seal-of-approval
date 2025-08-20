import Phaser from 'phaser';
import Seal from '../entities/Seal.js';
import Enemy from '../entities/Enemy.js';
import Collectible from '../entities/Collectible.js';
import LevelGenerator from '../managers/LevelGenerator.js';
import ScoreManager from '../managers/ScoreManager.js';
import InfoOverlay from '../ui/InfoOverlay.js';
import { getLevelInfo, shouldShowInfo } from '../utils/gameInfo.js';
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_WIDTH, LEVEL, THEMES, CAMERA, SCORING } from '../utils/constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.isPaused = false;
        this.currentLevel = 1;
        this.timeRemaining = LEVEL.TIME_LIMIT;
        this.lastDKeyTime = 0;  // For double-D detection
        this.currentLevelInfo = null;  // Store level info for 'I' key
        this.levelStartLives = null;  // Checkpoint: lives at level start
        this.levelStartScore = 0;  // Checkpoint: score at level start
        this.restartConfirmDialog = null;  // Restart confirmation dialog
    }

    init(data) {
        // Reset pause state on scene start/restart
        this.isPaused = false;

        // Receive level from scene restart or start fresh
        this.currentLevel = data?.level || 1;
        this.initialScore = data?.score || 0;
        this.initialLives = data?.lives || null;  // Lives from previous level, or null for level 1
        this.currentLevelInfo = null;  // Reset cached level info for new level

        // Check if this is a restart or a new level
        const isRestart = data?.isRestart || false;

        // Only save checkpoint on NEW level entry, not on restart
        if (!isRestart) {
            this.levelStartLives = this.initialLives;
            this.levelStartScore = this.initialScore;
            console.log('GameScene.init() - NEW LEVEL - Saved checkpoint:',
                'lives:', this.levelStartLives, 'score:', this.levelStartScore);
        } else {
            // On restart, use the saved checkpoint values
            this.initialLives = this.levelStartLives;
            this.initialScore = this.levelStartScore;
            console.log('GameScene.init() - RESTART - Restoring checkpoint:',
                'lives:', this.levelStartLives, 'score:', this.levelStartScore);
        }

        console.log('GameScene.init() - Starting level:', this.currentLevel,
            'with score:', this.initialScore, 'and lives:', this.initialLives);
    }

    create() {
        console.log('GameScene.create() starting...');

        // Reset goal reached flag when scene starts/restarts
        this.goalReached = false;
        
        // Reset player falling flag when scene starts/restarts
        this.playerFalling = false;

        // Reset time remaining when scene starts/restarts
        this.timeRemaining = LEVEL.TIME_LIMIT;
        console.log('Starting level with time:', this.timeRemaining);

        // Set up world bounds for side-scrolling
        // Extend bottom boundary by 200px so seal visually falls off screen before dying
        // (Size 3 seal is 96px tall, center is 48px from bottom edge)
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT + 200);
        this.physics.world.gravity.y = 800;

        // Deterministic theme selection based on level
        const themeKeys = Object.keys(THEMES);
        const themeIndex = (this.currentLevel - 1) % themeKeys.length;
        this.currentTheme = THEMES[themeKeys[themeIndex]];
        console.log(`Level ${this.currentLevel} - Theme: ${this.currentTheme.name}`);

        // Create tiling background
        console.log('Creating scrolling background...');
        this.createScrollingBackground();

        console.log('Initializing managers...');
        this.levelGenerator = new LevelGenerator(this);
        this.scoreManager = new ScoreManager(this, this.initialScore);
        // Use global AudioManager and set scene context
        this.audioManager = this.game.audioManager;
        this.audioManager.setScene(this);

        console.log('Creating physics groups...');
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.collectibles = this.physics.add.group();

        console.log('Generating level...');
        this.levelGenerator.generateLevel(this.currentTheme, this.currentLevel);

        console.log('Creating player...');
        // Start player at left side of level
        // Pass lives from previous level, or null for default (level 1)
        this.player = new Seal(this, 200, GAME_HEIGHT - 200, this.initialLives);
        // Set player depth to be above platforms but below UI
        this.player.sprite.setDepth(5);

        // Enable world bounds detection for fall death
        // Keep setCollideWorldBounds false to allow free movement left/right/up
        this.player.sprite.body.onWorldBounds = true;

        console.log('Setting up camera...');
        // Set up camera to follow player
        this.setupCamera();

        console.log('Setting up collisions...');
        this.setupCollisions();

        // Listen for world bounds collisions (specifically bottom boundary)
        this.physics.world.on('worldbounds', (body, blockedUp, blockedDown, blockedLeft, blockedRight) => {
            // Only care about player hitting bottom boundary
            if (body === this.player.sprite.body && blockedDown) {
                // Only process fall death once (flag properly reset in create())
                if (!this.playerFalling) {
                    console.log(`Player hit bottom world boundary at size ${this.player.currentSize} - triggering fall death`);
                    console.log(`Seal Y position: ${this.player.sprite.y.toFixed(1)}, Body bottom: ${body.bottom.toFixed(1)}`);
                    
                    // Disable collision to allow sprite to fall through
                    this.player.sprite.setCollideWorldBounds(false);
                    this.handlePlayerFall();
                }
            }
        });
        console.log('Setting up controls...');
        this.setupControls();
        console.log('Creating UI...');
        this.createUI();
        this.updateUI(); // Initialize UI with correct values immediately
        console.log('Starting timer...');
        this.startTimer();

        // Track distance traveled
        this.maxDistanceTraveled = 0;

        console.log('Starting background music...');
        // Start in-game background music
        this.audioManager.playBackgroundMusic(this.currentTheme.name, true);

        // Clean up audio when scene is stopped
        this.events.on('shutdown', () => {
            if (this.audioManager) {
                this.audioManager.stopBackgroundMusic();
            }
        });

        console.log('Fading in camera...');
        this.cameras.main.fadeIn(500);

        // Create info overlay
        this.infoOverlay = new InfoOverlay(this);

        // Check if we should show info for this level
        if (shouldShowInfo(this.currentLevel)) {
            this.showLevelInfo();
        } else {
            this.isLevelStarted = true;
        }

        console.log('GameScene.create() complete!');
        console.log('Game controls: R = Restart Level, P = Pause, M = Mute, I = Info, S = Screenshot, DD = Dev Mode');
    }

    createScrollingBackground() {
        // Create multiple background images to tile across the level
        // Calculate exact number needed to cover full level width
        const bgCount = Math.ceil(LEVEL_WIDTH / GAME_WIDTH) + 1;
        console.log(`Creating ${bgCount} background tiles to cover level width ${LEVEL_WIDTH}`);

        let actualCoverage = 0;
        for (let i = 0; i < bgCount; i++) {
            const x = i * GAME_WIDTH;
            // Only create backgrounds within or slightly beyond level bounds
            if (x <= LEVEL_WIDTH) {
                const bg = this.add.image(x, GAME_HEIGHT / 2, `bg_${this.currentTheme.name}`);
                bg.setOrigin(0, 0.5); // Anchor at left edge, center vertically

                // Debug: log each background position
                const rightEdge = x + GAME_WIDTH;
                console.log(`  Background ${i}: x=${x}, covers ${x} to ${rightEdge}`);
                actualCoverage = Math.max(actualCoverage, rightEdge);

                // Debug: Check if image loaded correctly
                if (!bg.texture || bg.texture.key === '__MISSING') {
                    console.error(`  WARNING: Background texture failed to load for ${this.currentTheme.name}`);
                }
            }
        }

        console.log(`Actual background coverage: 0 to ${actualCoverage} (need ${LEVEL_WIDTH})`);

        if (actualCoverage < LEVEL_WIDTH) {
            console.error(`WARNING: Background coverage insufficient! Gap from ${actualCoverage} to ${LEVEL_WIDTH}`);
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
            
            console.log('City crescent moon added at position:', moonX, moonY);
            
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
            console.log('Beach sun added at position:', sunGraphics.x, sunGraphics.y);
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
        
        console.log(`Created ${starsPerScreen * screenCount} stars across ${screenCount} screens`);
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
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.keyboard.on('keydown-P', () => {
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

        // Info overlay hotkey
        this.input.keyboard.on('keydown-I', () => {
            // Only show if we have info stored and the overlay isn't already showing
            if (this.currentLevelInfo && !this.infoOverlay.isShowing && this.isLevelStarted) {
                this.showLevelInfo();
            }
        });

        // Developer screenshot hotkey
        this.input.keyboard.on('keydown-S', () => {
            this.captureScreenshot();
        });

        // Developer menu with double-D detection
        this.input.keyboard.on('keydown-D', () => {
            const currentTime = this.time.now;

            // Check for double-D press (within 300ms)
            if (currentTime - this.lastDKeyTime < 300) {
                // Double-D pressed - open developer menu
                this.openDeveloperMenu();
                this.lastDKeyTime = 0; // Reset to prevent triple press
            } else {
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
        this.progressText = this.add.text(GAME_WIDTH / 2, 60, 'PROGRESS: 0%', {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff00'
        });
        this.progressText.setOrigin(0.5, 0);
        this.progressText.setScrollFactor(0);

        // Developer mode indicator
        this.devModeText = this.add.text(GAME_WIDTH / 2, 60, 'DEV MODE', {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#FF00FF',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.devModeText.setOrigin(0.5, 0);
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
                        console.log('Time ran out! Game over.');
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

        console.log(`Collecting ${data.type} at position (${collectible.x.toFixed(0)}, ${collectible.y.toFixed(0)})`);
        console.log(`Player position before: (${this.player.sprite.x.toFixed(0)}, ${this.player.sprite.y.toFixed(0)})`);
        console.log(`Player velocity before: (${this.player.sprite.body.velocity.x.toFixed(0)}, ${this.player.sprite.body.velocity.y.toFixed(0)})`);
        console.log(`Player on ground before: ${this.player.sprite.body.blocked.down || this.player.sprite.body.touching.down}`);

        if (data.type === 'fish') {
            // Grow the seal when eating fish
            this.player.growSize();
            
            // Eating a fish always grants one fart (digestion!)
            this.player.hasFartAvailable = true;

            const points = 100;
            this.scoreManager.addScore(points);
            this.showScorePopup(collectible.x, collectible.y, `+${points} FISH!`, 0x00ff00);
            this.audioManager.playSound('eat');
            console.log(`Fish eaten! Score: +${points}, Size: ${this.player.currentSize}`);
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

        if (this.collectibles.countActive() === 0) {
            this.nextLevel();
        }
    }

    handleEnemyCollision(enemy) {
        if (this.player.invincible) {
            this.scoreManager.addScore(200);
            this.showScorePopup(enemy.x, enemy.y, '+200 ENEMY!', 0xff9900);
            enemy.destroy();
            this.audioManager.playSound('enemyDefeat');
        } else if (this.player.sprite.body.velocity.y > 0 &&
                   this.player.sprite.y < enemy.y - 10) {
            // Check if this is a polar bear or orca - they can't be stomped
            if (enemy.type === 'polarbear' || enemy.type === 'orca') {
                // Attempting to stomp a polar bear or orca results in death and respawn
                this.player.lives--;
                this.audioManager.playSound('fall');

                console.log(`Player tried to stomp a ${enemy.type}! Lives remaining:`, this.player.lives);

                if (this.player.lives <= 0) {
                    this.gameOver();
                } else {
                    this.respawnPlayer();
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

    handleGoalReached() {
        if (this.goalReached) return; // Prevent multiple triggers
        this.goalReached = true;

        // Stop timer
        this.timerEvent.destroy();

        // Add completion bonus
        this.scoreManager.addScore(SCORING.LEVEL_COMPLETE_BONUS);

        // Add time bonus
        const timeBonus = this.timeRemaining * SCORING.TIME_BONUS_MULTIPLIER;
        this.scoreManager.addScore(timeBonus);

        // Add progress points
        const progress = this.calculateProgressPoints();
        if (progress.points > 0) {
            this.scoreManager.addScore(progress.points);
            this.showScorePopup(this.player.sprite.x, this.player.sprite.y - 80,
                `DISTANCE BONUS: +${progress.points}!`, 0x00ffff);
        }

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

        // Proceed to next level
        this.time.delayedCall(3000, () => {
            this.nextLevel();
        });
    }

    handlePlayerFall() {
        if (this.playerFalling) return; // Prevent multiple triggers
        this.playerFalling = true;

        // Player loses a life when falling (bypasses invincibility)
        // Fall death always happens regardless of power-ups
        this.player.lives--;
        this.audioManager.playSound('fall');

        console.log('Player fell to death. Lives remaining:', this.player.lives);

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

        // Reset player position to start of level
        this.player.sprite.setPosition(200, GAME_HEIGHT - 200);
        this.player.sprite.setVelocity(0, 0);

        // Re-enable world bounds collision for the respawned player
        this.player.sprite.setCollideWorldBounds(true);

        // Reset to size 1 after death
        this.player.resetSize();

        // Give temporary invincibility
        this.player.setInvincible(3000);

        // Reset camera to follow player
        this.cameras.main.scrollX = 0;

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
        this.isPaused = !this.isPaused;
        this.pauseText.setVisible(this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
        } else {
            this.physics.resume();
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
            console.log('Developer Mode: ENABLED');
        } else {
            console.log('Developer Mode: DISABLED');
        }
    }

    openDeveloperMenu() {
        console.log('Opening Developer Menu...');

        // Close info overlay instantly if it's showing
        if (this.infoOverlay && this.infoOverlay.isShowing) {
            console.log('Closing info overlay before opening developer menu');
            this.infoOverlay.hide(true);  // true = instant hide without animation
        }

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

        console.log(`=== SCREENSHOT CAPTURE ===`);
        console.log(`Progress: ${progress}% (Position: ${this.player.sprite.x.toFixed(0)} / ${LEVEL.GOAL_POSITION})`);
        console.log(`Player: ${playerPos}, ${bodyPos}`);
        console.log(`Theme: ${this.currentTheme.name}`);
        console.log(`Lives: ${this.player.lives}, Score: ${this.scoreManager.score}`);
        console.log(`On Ground: ${this.player.sprite.body ? this.player.sprite.body.blocked.down : 'N/A'}`);

        // Capture the current game canvas
        this.game.renderer.snapshot((image) => {
            // Create a link element to download the image
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `game-screenshot-${timestamp}.png`;
            link.href = image.src;
            link.click();

            console.log('Screenshot saved as:', link.download);
            console.log(`=========================`);

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
            // Pass current lives to the next level
            this.scene.restart({
                level: this.currentLevel,
                score: this.scoreManager.score,
                lives: this.player.lives
            });
        });
    }

    gameOver() {
        this.timerEvent.destroy();

        // Calculate and add progress points before saving high score
        const progress = this.calculateProgressPoints();
        if (progress.points > 0) {
            this.scoreManager.addScore(progress.points);
        }

        this.scoreManager.saveHighScore();
        this.audioManager.stopBackgroundMusic();

        this.scene.start('GameOverScene', {
            score: this.scoreManager.score,
            level: this.currentLevel,
            progressDistance: progress.distance,
            progressPoints: progress.points
        });
    }

    showLevelInfo() {
        // Pause physics and timer
        this.physics.pause();
        this.isLevelStarted = false;

        // Get info for this level (or use stored info if available)
        if (!this.currentLevelInfo) {
            this.currentLevelInfo = getLevelInfo(this.currentLevel, this.currentTheme.name);
        }

        // Show the overlay
        this.infoOverlay.show(this.currentLevel, this.currentTheme.name, this.currentLevelInfo);
    }

    onInfoOverlayHidden() {
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

            // Restart the scene with checkpoint values
            this.scene.restart({
                level: this.currentLevel,
                score: this.levelStartScore,
                lives: this.levelStartLives,
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