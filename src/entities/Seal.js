import Phaser from 'phaser';
import { PHYSICS, PLAYER, GAME_HEIGHT, SIZE_SYSTEM, SIZE_EFFECTS } from '../utils/constants.js';

export default class Seal {
    constructor(scene, x, y, lives = null) {
        // Version tracking for cache verification
        console.log('Seal.js Version: 2.0 - Size growth system');

        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'seal');
        // Enable world bounds collision for fall death detection
        // The extended bottom boundary (GAME_HEIGHT + 200) allows falling "off-screen"
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0);

        // Use provided lives or default to initial lives for level 1
        this.lives = lives !== null ? lives : PLAYER.INITIAL_LIVES;

        // Size system properties
        this.currentSize = SIZE_SYSTEM.DEFAULT_SIZE;
        this.maxSize = SIZE_SYSTEM.MAX_SIZE;
        this.sizeScales = SIZE_SYSTEM.SIZE_SCALES;

        this.invincible = false;  // For star powerup only
        this.ghostMode = false;   // For damage protection (can't interact with enemies)
        this.speedBoost = false;
        this.hasMagnet = false;
        this.developerMode = false;  // Developer mode flag
        this.physicsDebugEnabled = false;  // Physics debug graphics flag (separate from dev mode)
        this.isSwimming = false;  // Swimming mode for ocean theme
        this.swimVelocityX = 0;  // Swimming velocity with inertia
        this.swimVelocityY = 0;

        this.jumpTimer = 0;
        this.isJumping = false;
        this.canJump = true;
        this.doubleJumpAvailable = false;
        this.hasDoubleJumped = false;
        this.wasOnGround = false; // For debugging ground state changes
        this.hasFartAvailable = false; // Only true after eating a fish

        this.updateSizeScale();
    }

    update(cursors, spaceKey) {
        // Check if swimming in ocean theme
        const isOceanTheme = this.scene.currentTheme && this.scene.currentTheme.name === 'ocean';
        if (isOceanTheme !== this.isSwimming) {
            this.setSwimmingMode(isOceanTheme);
        }

        // Check if on ice platform and get slipperiness level
        const iceInfo = this.isOnIcePlatform();
        const onIce = iceInfo.onIce;

        // Calculate speed with developer mode multiplier
        const baseSpeed = this.speedBoost ? PHYSICS.MOVE_SPEED * 2 : PHYSICS.MOVE_SPEED;
        const speed = this.developerMode ? baseSpeed * 5 : baseSpeed;

        // Manual bounds checking for left, right, and top
        if (this.sprite.x < this.sprite.width / 2) {
            this.sprite.x = this.sprite.width / 2;
            this.sprite.setVelocityX(0);
        }
        if (this.sprite.x > this.scene.physics.world.bounds.width - this.sprite.width / 2) {
            this.sprite.x = this.scene.physics.world.bounds.width - this.sprite.width / 2;
            this.sprite.setVelocityX(0);
        }
        if (this.sprite.y < 0) {
            this.sprite.y = 0;
            this.sprite.setVelocityY(0);
        }

        // Developer mode or swimming bottom boundary - keep seal within screen
        if (this.developerMode || this.isSwimming) {
            // Keep seal 10 pixels inside bottom boundary to avoid edge issues
            const bottomBoundary = GAME_HEIGHT - this.sprite.height / 2 - 10;
            if (this.sprite.y > bottomBoundary) {
                this.sprite.y = bottomBoundary;
                this.sprite.setVelocityY(0);
                if (this.isSwimming) {
                    this.swimVelocityY = 0;
                }
            }
        }

        // Handle swimming movement with inertia
        if (this.isSwimming) {
            this.updateSwimming(cursors);
            return; // Skip normal movement logic
        }

        // Apply ice physics based on slipperiness level
        let acceleration, drag;
        if (iceInfo.slipperiness === 'extreme') {
            acceleration = 0.3;  // Very slow acceleration for floating/cracking ice
            drag = 0.98;        // Almost no friction
        } else if (iceInfo.slipperiness === 'standard') {
            acceleration = 0.5;  // Standard ice acceleration
            drag = 0.95;        // Standard ice friction
        } else {
            acceleration = 1.0;  // Normal ground
            drag = PHYSICS.DRAG; // Normal friction
        }

        if (cursors.left.isDown) {
            if (onIce) {
                // Gradual acceleration on ice
                const currentVel = this.sprite.body.velocity.x;
                const targetVel = -speed;
                const newVel = currentVel + (targetVel - currentVel) * acceleration * 0.1;
                this.sprite.setVelocityX(newVel);
            } else {
                this.sprite.setVelocityX(-speed);
            }
            this.sprite.setFlipX(false);
        } else if (cursors.right.isDown) {
            if (onIce) {
                // Gradual acceleration on ice
                const currentVel = this.sprite.body.velocity.x;
                const targetVel = speed;
                const newVel = currentVel + (targetVel - currentVel) * acceleration * 0.1;
                this.sprite.setVelocityX(newVel);
            } else {
                this.sprite.setVelocityX(speed);
            }
            this.sprite.setFlipX(true);
        } else {
            this.sprite.setVelocityX(this.sprite.body.velocity.x * drag);
        }

        // Developer mode vertical flight controls
        if (this.developerMode) {
            if (cursors.up.isDown) {
                this.sprite.setVelocityY(-speed);
            } else if (cursors.down.isDown) {
                this.sprite.setVelocityY(speed);
            } else if (!cursors.up.isDown && !cursors.down.isDown) {
                // Apply drag to vertical movement in dev mode for better control
                this.sprite.setVelocityY(this.sprite.body.velocity.y * 0.9);
            }
        }

        // Better ground detection using blocked.down to prevent falling through platforms
        const onGround = this.sprite.body.blocked.down || this.sprite.body.touching.down;

        // Log collision state changes for debugging
        if (this.wasOnGround !== onGround) {
            console.log(`Ground state changed: ${this.wasOnGround} -> ${onGround} at Y: ${this.sprite.y.toFixed(0)}`);
            this.wasOnGround = onGround;
        }

        if (onGround) {
            this.canJump = true;
            this.isJumping = false;
            this.jumpTimer = 0;
            this.doubleJumpAvailable = true;
            this.hasDoubleJumped = false;
        }

        // Handle jump input with double jump (skip in developer mode - use arrow keys instead)
        if (Phaser.Input.Keyboard.JustDown(spaceKey) && !this.developerMode) {
            if (onGround) {
                // First jump from ground
                this.sprite.setVelocityY(PHYSICS.JUMP_VELOCITY);
                this.isJumping = true;
                this.canJump = false;
                this.scene.audioManager.playSound('jump');
            } else if (this.doubleJumpAvailable && !this.hasDoubleJumped) {
                // Double jump in air
                this.sprite.setVelocityY(PHYSICS.JUMP_VELOCITY * 0.9); // Slightly weaker than first jump
                this.doubleJumpAvailable = false;
                this.hasDoubleJumped = true;
                this.scene.audioManager.playSound('doubleJump');

                // Add visual effect for double jump only if the seal has digested a fish
                if (this.hasFartAvailable) {
                    this.createDoubleJumpEffect();
                    this.hasFartAvailable = false; // Can only fart once per fish eaten
                }
            }
        }

        // Variable jump height (hold for higher jump) - only for first jump (skip in dev mode)
        if (spaceKey.isDown && this.isJumping && !this.hasDoubleJumped && !this.developerMode) {
            if (this.jumpTimer < 15 && this.sprite.body.velocity.y < 0) {
                this.sprite.setVelocityY(this.sprite.body.velocity.y + PHYSICS.JUMP_VELOCITY_BOOST / 15);
                this.jumpTimer++;
            }
        }

        if (spaceKey.isUp && !this.developerMode) {
            if (this.isJumping && this.sprite.body.velocity.y < 0 && !this.hasDoubleJumped) {
                this.sprite.setVelocityY(this.sprite.body.velocity.y * 0.5);
            }
            this.jumpTimer = 15;
        }

        // Handle visual effects for invincibility and ghost mode
        if (!this.developerMode) {
            if (this.ghostMode) {
                // Ghost mode: semi-transparent with gentle blinking
                const time = this.scene.time.now;
                const alpha = 0.3 + Math.sin(time * 0.008) * 0.2; // Oscillate between 0.3 and 0.5
                this.sprite.setAlpha(alpha);
            } else if (this.invincible) {
                // Invincibility: strong blinking effect
                const time = this.scene.time.now;
                this.sprite.setAlpha(Math.sin(time * 0.01) > 0 ? 1 : 0.5);
            }
        }
    }


    updateSizeScale() {
        // Scale based on current size
        const scale = this.sizeScales[this.currentSize - 1];
        this.sprite.setScale(scale);

        // Update physics body to match the scaled sprite
        // Base sprite is 32x32, but emojis have padding/transparent areas
        const baseWidth = 32;
        const baseHeight = 32;

        // *** EMPIRICALLY TUNED VALUES - DO NOT CHANGE WITHOUT VISUAL TESTING ***
        // These values were carefully tuned using the Physics Debug overlay system
        // Mathematical formulas fail due to emoji sprites having irregular transparent padding
        
        // Physics body dimensions: Dramatically smaller for larger sizes
        // This compensates for emoji visual weight being concentrated in center
        const bodyWidthMultipliers = [0.65, 0.43, 0.275];  // Size 1: 65% → Size 3: 27.5%
        const bodyHeightMultipliers = [0.45, 0.35, 0.22];  // Size 1: 45% → Size 3: 22%

        const bodyWidth = baseWidth * scale * bodyWidthMultipliers[this.currentSize - 1];
        const bodyHeight = baseHeight * scale * bodyHeightMultipliers[this.currentSize - 1];

        // Physics body positioning: Custom offsets for perfect visual alignment
        // These values create pixel-perfect collision detection at all sizes
        // Note: Size 1 uses NEGATIVE X offset due to emoji left-side weighting
        
        const sizeOffsetsX = [-1, 2, 3];  // Horizontal: Accounts for emoji asymmetric padding
        const sizeOffsetsY = [4, 3, 5];   // Vertical: Ensures perfect ground contact

        // Set the physics body size
        // Pass false to prevent auto-centering and maintain full control over offset
        this.sprite.body.setSize(bodyWidth, bodyHeight, false);

        // Use size-specific offsets for both X and Y alignment
        const offsetX = sizeOffsetsX[this.currentSize - 1];
        const offsetY = sizeOffsetsY[this.currentSize - 1];

        this.sprite.body.setOffset(offsetX, offsetY);

        // Enhanced debugging output for offset tuning
        const mathCenterX = (baseWidth * scale - bodyWidth) / 2;
        console.log(`Size ${this.currentSize}: scale=${scale}`);
        console.log(`  Body: ${bodyWidth.toFixed(1)}x${bodyHeight.toFixed(1)}, Offsets: X=${offsetX} Y=${offsetY}`);
        console.log(`  Math center would be X=${mathCenterX.toFixed(1)}, using visual center X=${offsetX}`);

        // Refresh physics body visualizer if active (in dev mode)
        if (this.physicsDebugGraphics) {
            // Force immediate redraw
            this.physicsDebugGraphics.clear();
        }
    }

    growSize() {
        if (this.currentSize < this.maxSize) {
            // Store the physics body's bottom position before growing
            const bodyBottomBefore = this.sprite.body.bottom;

            this.currentSize++;
            // Enhanced visual effects now enabled!
            this.createGrowthEffect();
            this.updateSizeScale();

            // Only adjust Y if on ground to prevent teleporting while falling
            if (this.sprite.body.blocked.down || this.sprite.body.touching.down) {
                // Restore the body's bottom to the same position to prevent falling through platforms
                this.sprite.y = bodyBottomBefore - this.sprite.body.height - this.sprite.body.offset.y;
            }

            // Play growth sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('grow');
            }

            console.log(`Seal grew to size ${this.currentSize}, Y adjusted to maintain ground contact`);
        }
    }

    shrinkSize() {
        if (this.currentSize > 1) {
            // Store the physics body's bottom position before shrinking
            const bodyBottomBefore = this.sprite.body.bottom;

            this.currentSize--;
            // Enhanced visual effects now enabled!
            this.createShrinkEffect();
            this.updateSizeScale();

            // Only adjust Y if on ground to prevent teleporting while falling
            if (this.sprite.body.blocked.down || this.sprite.body.touching.down) {
                // Restore the body's bottom to the same position to prevent falling through platforms
                this.sprite.y = bodyBottomBefore - this.sprite.body.height - this.sprite.body.offset.y;
            }

            // Play shrink sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('shrink');
            }

            console.log(`Seal shrunk to size ${this.currentSize}, Y adjusted to maintain ground contact`);
        }
    }

    resetSize() {
        this.currentSize = SIZE_SYSTEM.DEFAULT_SIZE;
        this.updateSizeScale();
        this.hasFartAvailable = false; // No fart available after respawn/reset
    }

    takeDamage() {
        // God mode in developer mode
        if (this.developerMode) {
            return;
        }

        if (!this.invincible && !this.ghostMode) {
            if (this.currentSize > 1) {
                // Shrink and enter ghost mode instead of invincibility
                this.shrinkSize();
                this.setGhostMode(PLAYER.INVINCIBLE_TIME);
            } else {
                // At size 1, lose a life and become invincible
                this.lives--;
                this.setInvincible(PLAYER.INVINCIBLE_TIME);

                this.scene.tweens.add({
                    targets: this.sprite,
                    x: this.sprite.x - 20,
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    ease: 'Power2'
                });
            }
        }
    }

    setInvincible(duration) {
        this.invincible = true;
        this.sprite.setTint(0xffff00);

        this.scene.time.delayedCall(duration, () => {
            this.invincible = false;
            this.sprite.clearTint();
            this.sprite.setAlpha(1);
        });
    }

    setGhostMode(duration) {
        this.ghostMode = true;
        // Ethereal blue-white tint for ghost effect
        this.sprite.setTint(0xccddff);

        this.scene.time.delayedCall(duration, () => {
            this.ghostMode = false;
            // Restore appropriate tint
            if (this.developerMode) {
                this.sprite.setTint(0xFF00FF);
            } else {
                this.sprite.clearTint();
            }
            this.sprite.setAlpha(1);
        });
    }

    setSpeedBoost(duration) {
        this.speedBoost = true;

        const particles = this.scene.add.particles(0, 0, 'speed', {
            follow: this.sprite,
            scale: { start: 0.5, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 500,
            frequency: 50
        });

        this.scene.time.delayedCall(duration, () => {
            this.speedBoost = false;
            particles.destroy();
        });
    }

    setMagnet(duration) {
        this.hasMagnet = true;

        const magnetField = this.scene.add.circle(this.sprite.x, this.sprite.y, 100, 0x00ffff, 0.2);
        magnetField.setStrokeStyle(2, 0x00ffff, 0.5);

        const updateMagnet = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                magnetField.x = this.sprite.x;
                magnetField.y = this.sprite.y;
            },
            loop: true
        });

        this.scene.time.delayedCall(duration, () => {
            this.hasMagnet = false;
            magnetField.destroy();
            updateMagnet.destroy();
        });
    }

    createDoubleJumpEffect() {
        // Create a funny fart-like effect with brown puffs
        const brownColors = [0x8B4513, 0xA0522D, 0xCD853F, 0x964B00]; // Various brown shades
        const puffCount = 6; // Multiple small puffs for a cloud effect
        
        for (let i = 0; i < puffCount; i++) {
            // Create puffs in a downward cone pattern
            const angle = Math.PI * 0.5 + (Math.PI * 0.3) * ((i / puffCount) - 0.5); // Downward spread
            const startDistance = 10;
            const randomOffset = Math.random() * 5;
            
            // Each puff is a brown circle
            const puff = this.scene.add.circle(
                this.sprite.x + Math.cos(angle) * (startDistance + randomOffset),
                this.sprite.y + this.sprite.height * 0.3 + Math.sin(angle) * startDistance, // Start below seal
                4 + Math.random() * 3, // Varying sizes
                Phaser.Utils.Array.GetRandom(brownColors), // Random brown shade
                0.6 + Math.random() * 0.3 // Varying opacity
            );
            
            // Set depth so it appears behind the seal
            puff.setDepth(this.sprite.depth - 1);
            
            // Animate each puff dispersing downward and outward
            this.scene.tweens.add({
                targets: puff,
                x: puff.x + Math.cos(angle) * (30 + Math.random() * 20), // Spread outward
                y: puff.y + Math.sin(angle) * 40 + 15, // Move downward with gravity
                scaleX: 2 + Math.random(), // Expand
                scaleY: 2 + Math.random(),
                alpha: 0, // Fade out
                duration: 400 + Math.random() * 200, // Varying durations
                ease: 'Power2.Out',
                onComplete: () => {
                    puff.destroy();
                }
            });
            
            // Add a slight wobble for comedic effect
            this.scene.tweens.add({
                targets: puff,
                angle: Math.random() * 30 - 15, // Slight rotation
                duration: 200,
                yoyo: true,
                repeat: 1
            });
        }
        
        // Add one larger central puff for emphasis
        const mainPuff = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y + this.sprite.height * 0.3,
            8,
            0x8B4513, // Saddle brown
            0.4
        );
        mainPuff.setDepth(this.sprite.depth - 1);
        
        this.scene.tweens.add({
            targets: mainPuff,
            y: mainPuff.y + 50, // Fall downward
            scaleX: 3,
            scaleY: 2.5, // Oval shape
            alpha: 0,
            duration: 500,
            ease: 'Power2.Out',
            onComplete: () => {
                mainPuff.destroy();
            }
        });
    }

    isOnIcePlatform() {
        // Check if the seal is on an ice platform and determine slipperiness
        if (!this.scene.platforms) return { onIce: false, slipperiness: 'normal' };

        // Use physics body bounds instead of visual sprite bounds for accurate collision
        const body = this.sprite.body;
        const sealLeft = body.x;
        const sealRight = body.x + body.width;
        const sealTop = body.y;
        const sealBottom = body.y + body.height;
        
        let iceInfo = { onIce: false, slipperiness: 'normal' };

        this.scene.platforms.children.entries.forEach(platform => {
            if (platform.getData('isIce')) {
                const platformBounds = platform.getBounds();

                // Check if seal is standing on this platform
                if (this.sprite.body.touching.down &&
                    sealBottom >= platformBounds.top - 5 &&
                    sealBottom <= platformBounds.top + 10 &&
                    sealRight > platformBounds.left &&
                    sealLeft < platformBounds.right) {
                    iceInfo.onIce = true;

                    // Get platform type for variable slipperiness
                    const platformType = platform.getData('platformType');

                    // Most slippery - floating and cracking ice
                    if (platformType === 'floatingIce' || platformType === 'crackingIce') {
                        iceInfo.slipperiness = 'extreme';
                    }
                    // Normal ice slipperiness - all other Arctic platforms
                    else {
                        iceInfo.slipperiness = 'standard';
                    }

                    // Handle cracking ice
                    if (platform.getData('crackingIce')) {
                        this.handleCrackingIce(platform);
                    }
                }
            }
        });

        return iceInfo;
    }

    handleCrackingIce(platform) {
        // Increment crack timer
        let crackTimer = platform.getData('crackTimer') || 0;
        crackTimer += this.scene.game.loop.delta;
        platform.setData('crackTimer', crackTimer);

        // Show cracks after 1 second
        if (crackTimer > 1000 && crackTimer < 2000) {
            platform.setTint(0xCCCCCC); // Grayer tint for cracking
            // Add shake effect
            if (!platform.getData('shaking')) {
                platform.setData('shaking', true);
                this.scene.tweens.add({
                    targets: platform,
                    x: platform.x + Phaser.Math.Between(-2, 2),
                    duration: 50,
                    yoyo: true,
                    repeat: -1
                });
            }
        }

        // Break after 2 seconds
        if (crackTimer > 2000 && !platform.getData('broken')) {
            platform.setData('broken', true);

            // Create breaking effect
            for (let i = 0; i < 5; i++) {
                const shard = this.scene.add.rectangle(
                    platform.x + Phaser.Math.Between(-20, 20),
                    platform.y,
                    10, 10,
                    0xCCE5FF
                );

                this.scene.tweens.add({
                    targets: shard,
                    y: platform.y + 100,
                    x: shard.x + Phaser.Math.Between(-50, 50),
                    alpha: 0,
                    duration: 500,
                    onComplete: () => shard.destroy()
                });
            }

            // Play ice break sound if audio manager exists
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('iceBreak');
            }

            // Destroy the platform
            platform.destroy();
        }
    }

    setDeveloperMode(enabled) {
        this.developerMode = enabled;

        if (enabled) {
            // Enable developer mode
            console.log('Seal: Developer mode ENABLED');

            // Disable gravity for flying
            this.sprite.body.setAllowGravity(false);
            
            // Disable world bounds collision for free flight
            this.sprite.setCollideWorldBounds(false);

            // Set permanent invincibility
            this.invincible = true;

            // Apply special purple tint
            this.sprite.setTint(0xFF00FF);

            // Ensure full alpha
            this.sprite.setAlpha(1);

            // Reset velocity for clean flight
            this.sprite.setVelocity(0, 0);

            // Create particle effect for super speed
            if (!this.devModeParticles) {
                this.devModeParticles = this.scene.add.particles(0, 0, 'star', {
                    follow: this.sprite,
                    scale: { start: 0.5, end: 0 },
                    speed: { min: 100, max: 200 },
                    lifespan: 300,
                    frequency: 30,
                    tint: 0xFF00FF
                });
            }

            // Note: Physics debug is now separate - use setPhysicsDebugEnabled() to toggle
        } else {
            // Disable developer mode
            console.log('Seal: Developer mode DISABLED');

            // Re-enable gravity
            this.sprite.body.setAllowGravity(true);
            
            // Re-enable world bounds collision for fall death detection
            this.sprite.setCollideWorldBounds(true);

            // Remove invincibility (unless it was already active)
            this.invincible = false;

            // Clear tint
            this.sprite.clearTint();

            // Reset alpha
            this.sprite.setAlpha(1);

            // Remove particle effect
            if (this.devModeParticles) {
                this.devModeParticles.destroy();
                this.devModeParticles = null;
            }

            // Note: Physics debug is now separate - use setPhysicsDebugEnabled() to toggle
        }
    }

    createPhysicsBodyVisualizer() {
        // Create graphics object for drawing physics body outline
        if (!this.physicsDebugGraphics) {
            this.physicsDebugGraphics = this.scene.add.graphics();
            // Set depth to render above everything
            this.physicsDebugGraphics.setDepth(1000);
        }

        // Create update event to redraw the outline every frame
        this.physicsDebugEvent = this.scene.time.addEvent({
            delay: 16, // ~60fps
            callback: () => {
                if (this.physicsDebugGraphics && this.sprite.body) {
                    // Clear previous drawing
                    this.physicsDebugGraphics.clear();

                    // Set line style - bright green for visibility
                    this.physicsDebugGraphics.lineStyle(2, 0x00ff00, 1);

                    // Draw rectangle around physics body
                    const body = this.sprite.body;
                    this.physicsDebugGraphics.strokeRect(
                        body.x,
                        body.y,
                        body.width,
                        body.height
                    );

                    // Draw center point (green for consistency)
                    this.physicsDebugGraphics.fillStyle(0x00ff00, 1);
                    this.physicsDebugGraphics.fillCircle(
                        body.x + body.width / 2,
                        body.y + body.height / 2,
                        3
                    );

                    // Draw sprite bounds for comparison (in blue)
                    this.physicsDebugGraphics.lineStyle(1, 0x0088ff, 0.5);
                    const spriteBounds = this.sprite.getBounds();
                    this.physicsDebugGraphics.strokeRect(
                        spriteBounds.x,
                        spriteBounds.y,
                        spriteBounds.width,
                        spriteBounds.height
                    );
                }
            },
            loop: true
        });
    }

    removePhysicsBodyVisualizer() {
        if (this.physicsDebugGraphics) {
            this.physicsDebugGraphics.destroy();
            this.physicsDebugGraphics = null;
        }

        if (this.physicsDebugEvent) {
            this.physicsDebugEvent.destroy();
            this.physicsDebugEvent = null;
        }
    }

    setPhysicsDebugEnabled(enabled) {
        this.physicsDebugEnabled = enabled;

        if (enabled) {
            console.log('Seal: Physics debug ENABLED');
            this.createPhysicsBodyVisualizer();
        } else {
            console.log('Seal: Physics debug DISABLED');
            this.removePhysicsBodyVisualizer();
        }
    }

    setSwimmingMode(enabled) {
        this.isSwimming = enabled;

        if (enabled) {
            console.log('Seal: Swimming mode ENABLED (Ocean theme)');
            // Disable gravity for swimming
            this.sprite.body.setAllowGravity(false);
            // Initialize swimming velocities
            this.swimVelocityX = this.sprite.body.velocity.x;
            this.swimVelocityY = this.sprite.body.velocity.y;
            // Create bubble effect
            this.createBubbleEffect();
        } else {
            console.log('Seal: Swimming mode DISABLED');
            // Re-enable gravity
            this.sprite.body.setAllowGravity(true);
            // Clean up bubble effect
            if (this.bubbleEmitter) {
                this.bubbleEmitter.stop();
                this.bubbleEmitter = null;
            }
        }
    }

    updateSwimming(cursors) {
        // Swimming physics with inertia
        const baseSpeed = this.speedBoost ? PHYSICS.MOVE_SPEED * 2 : PHYSICS.MOVE_SPEED;
        const speed = this.developerMode ? baseSpeed * 5 : baseSpeed;

        // Water has more drag than air
        const waterDrag = 0.92;
        const acceleration = 0.15; // Smooth acceleration

        // Target velocities based on input
        let targetVelX = 0;
        let targetVelY = 0;

        if (cursors.left.isDown) {
            targetVelX = -speed;
            this.sprite.setFlipX(false);
        } else if (cursors.right.isDown) {
            targetVelX = speed;
            this.sprite.setFlipX(true);
        }

        if (cursors.up.isDown) {
            targetVelY = -speed;
        } else if (cursors.down.isDown) {
            targetVelY = speed;
        }

        // Apply acceleration toward target velocity (inertia)
        this.swimVelocityX += (targetVelX - this.swimVelocityX) * acceleration;
        this.swimVelocityY += (targetVelY - this.swimVelocityY) * acceleration;

        // Apply water drag when no input
        if (targetVelX === 0) {
            this.swimVelocityX *= waterDrag;
        }
        if (targetVelY === 0) {
            this.swimVelocityY *= waterDrag;
        }

        // Apply velocities
        this.sprite.setVelocityX(this.swimVelocityX);
        this.sprite.setVelocityY(this.swimVelocityY);

        // Add slight rotation based on movement direction for visual effect
        const angle = Math.atan2(this.swimVelocityY, Math.abs(this.swimVelocityX));
        this.sprite.setRotation(angle * 0.2);

        // Update bubble emission based on speed
        if (this.bubbleEmitter) {
            const speed = Math.sqrt(this.swimVelocityX * this.swimVelocityX + this.swimVelocityY * this.swimVelocityY);
            this.bubbleEmitter.frequency = Math.max(100 - speed / 2, 50);
        }
    }

    createBubbleEffect() {
        if (this.bubbleEmitter) return;

        // Create circle texture for bubbles if it doesn't exist
        if (!this.scene.textures.exists('bubble')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffffff, 0.3);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('bubble', 8, 8);
            graphics.destroy();
        }

        // Create bubble particle emitter
        this.bubbleEmitter = this.scene.add.particles(0, 0, 'bubble', {
            follow: this.sprite,
            scale: { start: 0.3, end: 0.8 },
            alpha: { start: 0.6, end: 0 },
            speed: { min: 20, max: 60 },
            lifespan: 1500,
            frequency: 100,
            angle: { min: -110, max: -70 },
            quantity: 1
        });
    }

    createGrowthEffect() {
        // === LAYER 1: IMMEDIATE IMPACT ===
        // Golden light burst flash
        this.sprite.setTint(0xffd700); // Golden tint instead of white
        
        // Brief screen flash for impact
        const screenFlash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffffff, 0.3
        );
        screenFlash.setScrollFactor(0); // Fixed to camera
        screenFlash.setDepth(999);
        
        this.scene.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 150,
            onComplete: () => screenFlash.destroy()
        });

        // === LAYER 2: NOM NOM TEXT ===
        // Fun eating text that floats up
        const nomText = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 30,
            'NOM NOM!',
            {
                fontSize: '24px',
                fontFamily: '"Press Start 2P", monospace',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        nomText.setOrigin(0.5);
        nomText.setDepth(200);
        
        // Animate the text floating up and fading (with delay for better visibility)
        this.scene.tweens.add({
            targets: nomText,
            y: nomText.y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            delay: 200,  // Let it be visible for 200ms before starting to fade
            ease: 'Power2',
            onComplete: () => nomText.destroy()
        });

        // === LAYER 3: SCALE POP ANIMATION ===
        // Enhanced scale animation with bounce
        const targetScale = this.sizeScales[this.currentSize - 1];
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: targetScale * 1.3, // Bigger pop
            scaleY: targetScale * 1.3,
            duration: 200,
            ease: 'Back.easeOut', // Bounce effect
            yoyo: true,
            onComplete: () => {
                // Clear tint gradually
                this.scene.tweens.add({
                    targets: this.sprite,
                    tint: 0xffffff,
                    duration: 300,
                    onComplete: () => {
                        // Restore purple tint if in developer mode, otherwise clear tint
                        if (this.developerMode) {
                            this.sprite.setTint(0xFF00FF);
                        } else {
                            this.sprite.clearTint();
                        }
                    }
                });
            }
        });

        console.log('🌟 Enhanced growth effect played!');
    }

    createShrinkEffect() {
        // === LAYER 1: DAMAGE IMPACT ===
        // Intense red flash
        this.sprite.setTint(0xff3333); // Bright red tint
        
        // Screen shake effect
        this.scene.cameras.main.shake(200, 0.01);
        
        // Brief red screen flash
        const screenFlash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xff0000, 0.2
        );
        screenFlash.setScrollFactor(0);
        screenFlash.setDepth(999);
        
        this.scene.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 250,
            onComplete: () => screenFlash.destroy()
        });

        // === LAYER 2: SMOKE DISPERSAL ===
        // Create small puffs of gray "smoke" dispersing
        const smokePuffs = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const puff = this.scene.add.circle(
                this.sprite.x + Math.cos(angle) * 15,
                this.sprite.y + Math.sin(angle) * 15,
                3, 0x666666, 0.6
            );
            puff.setDepth(40);
            smokePuffs.push(puff);
            
            // Animate puffs dispersing
            this.scene.tweens.add({
                targets: puff,
                x: puff.x + Math.cos(angle) * 40,
                y: puff.y + Math.sin(angle) * 40 - 20, // Slight upward drift
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => puff.destroy()
            });
        }

        // === LAYER 3: COMPRESSION ANIMATION ===
        // Dramatic inward squeeze before settling to new size
        const targetScale = this.sizeScales[this.currentSize - 1];
        
        // First compress inward dramatically
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: targetScale * 0.6, // Squeeze inward
            scaleY: targetScale * 1.2, // Squash effect
            duration: 150,
            ease: 'Power2.easeIn',
            onComplete: () => {
                // Then bounce back to target size
                this.scene.tweens.add({
                    targets: this.sprite,
                    scaleX: targetScale,
                    scaleY: targetScale,
                    duration: 250,
                    ease: 'Back.easeOut'
                });
            }
        });

        // === TINT CLEANUP ===
        // Gradually clear the red tint
        this.scene.time.delayedCall(300, () => {
            this.scene.tweens.add({
                targets: this.sprite,
                tint: 0xffffff,
                duration: 400,
                onComplete: () => {
                    // Restore purple tint if in developer mode, otherwise clear tint
                    if (this.developerMode) {
                        this.sprite.setTint(0xFF00FF);
                    } else {
                        this.sprite.clearTint();
                    }
                }
            });
        });

        console.log('💥 Enhanced shrink effect played!');
    }
}