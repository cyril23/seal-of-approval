import Phaser from 'phaser';
import { PHYSICS, PLAYER, GAME_HEIGHT } from '../utils/constants.js';

export default class Seal {
    constructor(scene, x, y) {
        // Version tracking for cache verification
        console.log('Seal.js Version: 1.4 - Removed Arctic theme and polar bear enemy');
        
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'seal');
        // Don't use world bounds for bottom edge to allow falling
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setBounce(0);
        
        this.size = PLAYER.INITIAL_SIZE;
        this.lives = PLAYER.INITIAL_LIVES;
        this.invincible = false;
        this.speedBoost = false;
        this.hasMagnet = false;
        this.developerMode = false;  // Developer mode flag
        
        this.jumpTimer = 0;
        this.isJumping = false;
        this.canJump = true;
        this.doubleJumpAvailable = false;
        this.hasDoubleJumped = false;
        this.wasOnGround = false; // For debugging ground state changes
        
        // Collision skip mechanism for growth
        this.skipCollisionFrames = 0;
        this.platformY = null; // Store platform position during growth
        
        this.updateSize();
    }

    update(cursors, spaceKey) {
        // Calculate speed with developer mode multiplier
        const baseSpeed = this.speedBoost ? PHYSICS.MOVE_SPEED * 2 : PHYSICS.MOVE_SPEED;
        const speed = this.developerMode ? baseSpeed * 5 : baseSpeed;
        
        // Decrement collision skip counter
        if (this.skipCollisionFrames > 0) {
            this.skipCollisionFrames--;
            if (this.skipCollisionFrames === 0) {
                console.log('Collision skip ended - normal collision resumed');
                this.platformY = null;
            }
        }
        
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
        
        // Developer mode bottom boundary - keep seal within screen
        if (this.developerMode) {
            // Keep seal 10 pixels inside bottom boundary to avoid edge issues
            const bottomBoundary = GAME_HEIGHT - this.sprite.height / 2 - 10;
            if (this.sprite.y > bottomBoundary) {
                this.sprite.y = bottomBoundary;
                this.sprite.setVelocityY(0);
            }
        }
        
        if (cursors.left.isDown) {
            this.sprite.setVelocityX(-speed);
            this.sprite.setFlipX(false);
        } else if (cursors.right.isDown) {
            this.sprite.setVelocityX(speed);
            this.sprite.setFlipX(true);
        } else {
            this.sprite.setVelocityX(this.sprite.body.velocity.x * PHYSICS.DRAG);
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
                
                // Add visual effect for double jump
                this.createDoubleJumpEffect();
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
        
        // Handle invincibility visual effects (but not alpha in dev mode)
        if (this.invincible && !this.developerMode) {
            const time = this.scene.time.now;
            this.sprite.setAlpha(Math.sin(time * 0.01) > 0 ? 1 : 0.5);
        }
    }

    grow() {
        // Check if growing is disabled for debugging
        if (PLAYER.DISABLE_GROWING) {
            console.log('Growing disabled for debugging - fish collected but size unchanged');
            return;
        }
        
        if (this.size < PLAYER.MAX_SIZE) {
            const oldSize = this.size;
            const oldY = this.sprite.y;
            const oldX = this.sprite.x;
            const wasOnGround = this.sprite.body.blocked.down || this.sprite.body.touching.down;
            
            // Store old body dimensions BEFORE size change
            const oldBodyHeight = this.sprite.body.height;
            const oldBodyWidth = this.sprite.body.width;
            const oldBodyY = this.sprite.body.y;
            const oldBodyOffset = this.sprite.body.offset.y;
            const oldBodyBottom = oldBodyY + oldBodyHeight;
            
            // Store velocity before any changes
            const currentVelocity = {
                x: this.sprite.body.velocity.x,
                y: this.sprite.body.velocity.y
            };
            
            // If on ground, calculate the exact platform top position
            let platformTop = null;
            if (wasOnGround) {
                // The platform top is where the body bottom currently sits
                platformTop = oldBodyBottom;
                this.platformY = platformTop; // Store for collision skip
            }
            
            this.size++;
            console.log(`Seal growing from size ${oldSize} to ${this.size} at position (${this.sprite.x.toFixed(0)}, ${this.sprite.y.toFixed(0)})`);
            console.log(`  Was on ground: ${wasOnGround}, velocity: (${currentVelocity.x.toFixed(0)}, ${currentVelocity.y.toFixed(0)})`);
            console.log(`  Old body: height=${oldBodyHeight.toFixed(1)}, bottom=${oldBodyBottom.toFixed(0)}`);
            if (platformTop) console.log(`  Platform top detected at: ${platformTop.toFixed(0)}`);
            
            // This changes the scale and updates the physics body
            this.updateSize();
            
            // Enhanced body growth compensation
            if (this.sprite.body && wasOnGround && platformTop !== null) {
                // Get new body dimensions
                const newBodyHeight = this.sprite.body.height;
                const newBodyOffset = this.sprite.body.offset.y;
                const bodyGrowth = newBodyHeight - oldBodyHeight;
                
                console.log(`  New body height: ${newBodyHeight.toFixed(1)}, growth: ${bodyGrowth.toFixed(1)}`);
                console.log(`  New body offset.y: ${newBodyOffset.toFixed(1)} (was ${oldBodyOffset.toFixed(1)})`);
                
                // Fix the positioning calculation - Version 9.4
                // The key insight: We want body.bottom = platformTop
                // Phaser calculates: body.y = sprite.y - spriteHalfHeight + offset.y
                // We want: body.y + body.height = platformTop
                // So: body.y = platformTop - body.height
                // Therefore: sprite.y = body.y + spriteHalfHeight - offset.y
                //           sprite.y = (platformTop - body.height) + spriteHalfHeight - offset.y
                const spriteHalfHeight = (32 * PLAYER.SIZE_SCALE[this.size]) / 2;
                const targetBodyY = platformTop - newBodyHeight;
                const targetSpriteY = targetBodyY + spriteHalfHeight - newBodyOffset;
                
                console.log(`  Positioning to maintain body bottom at platform (${platformTop.toFixed(0)})`);
                console.log(`  Target body Y: ${targetBodyY.toFixed(1)}, sprite Y: ${targetSpriteY.toFixed(1)} (was ${oldY.toFixed(1)})`);
                
                // Set sprite position
                this.sprite.x = oldX; // Maintain X position
                this.sprite.y = targetSpriteY;
                
                // Version 1.1: Use Phaser's update method then fine-tune position
                // First let Phaser update the body based on sprite position
                this.sprite.body.updateFromGameObject();
                
                // Then adjust if there's still a gap
                const currentBodyBottom = this.sprite.body.y + this.sprite.body.height;
                const gap = currentBodyBottom - platformTop;
                if (Math.abs(gap) > 1) {
                    // Adjust sprite position to close the gap
                    this.sprite.y -= gap;
                    this.sprite.body.updateFromGameObject();
                }
                
                // Enable collision skip for 2 frames
                this.skipCollisionFrames = 2;
                
                // Restore horizontal velocity, clear vertical to prevent bounce
                this.sprite.body.setVelocity(currentVelocity.x, 0);
                
                // Verify positioning
                const newBodyBottom = this.sprite.body.y + this.sprite.body.height;
                console.log(`  Body repositioned: Y=${this.sprite.body.y.toFixed(0)}, bottom=${newBodyBottom.toFixed(0)}`);
                console.log(`  Collision skip enabled for 2 frames`);
                console.log(`  Velocity restored to (${currentVelocity.x.toFixed(0)}, 0)`);
            } else if (this.sprite.body) {
                // In air - preserve all velocity
                console.log(`  Air growth - preserving velocity: (${currentVelocity.x.toFixed(0)}, ${currentVelocity.y.toFixed(0)})`);
                this.sprite.body.setVelocity(currentVelocity.x, currentVelocity.y);
            }
            
            if (this.sprite.body) {
                console.log(`  Final: Sprite Y=${this.sprite.y.toFixed(0)}, Body Y=${this.sprite.body.y.toFixed(0)}`);
            }
        } else {
            console.log('Seal already at max size');
        }
    }

    updateSize() {
        const scale = PLAYER.SIZE_SCALE[this.size];
        this.sprite.setScale(scale);
        
        // Update physics body to match the scaled sprite
        // Base sprite is 32x32, but emojis have padding/transparent areas
        const baseWidth = 32;
        const baseHeight = 32;
        
        // Use 70% of visual size for physics body (emojis have padding)
        const bodyWidth = baseWidth * scale * 0.7;
        const bodyHeight = baseHeight * scale * 0.7;
        
        // Store old bounds for debugging
        const oldBounds = this.sprite.body ? {
            x: this.sprite.body.x,
            y: this.sprite.body.y,
            width: this.sprite.body.width,
            height: this.sprite.body.height
        } : null;
        
        // Set the physics body size
        this.sprite.body.setSize(bodyWidth, bodyHeight);
        
        // Center horizontally, align exactly to bottom of sprite (no multiplier)
        // This should fix the floating appearance
        const offsetX = (baseWidth * scale - bodyWidth) / 2;
        const offsetY = baseHeight * scale - bodyHeight; // Align exactly to bottom
        
        this.sprite.body.setOffset(offsetX, offsetY);
        
        // Log the size change for debugging
        console.log(`Seal size updated to ${this.size}: scale=${scale}, body=${bodyWidth.toFixed(1)}x${bodyHeight.toFixed(1)}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
        if (oldBounds) {
            console.log(`  Old bounds: (${oldBounds.x.toFixed(1)}, ${oldBounds.y.toFixed(1)}, ${oldBounds.width.toFixed(1)}, ${oldBounds.height.toFixed(1)})`);
            console.log(`  New bounds: (${this.sprite.body.x.toFixed(1)}, ${this.sprite.body.y.toFixed(1)}, ${this.sprite.body.width.toFixed(1)}, ${this.sprite.body.height.toFixed(1)})`);
        }
    }

    takeDamage() {
        // God mode in developer mode
        if (this.developerMode) {
            return;
        }
        
        if (!this.invincible) {
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

    setInvincible(duration) {
        this.invincible = true;
        this.sprite.setTint(0xffff00);
        
        this.scene.time.delayedCall(duration, () => {
            this.invincible = false;
            this.sprite.clearTint();
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
        // Create a visual ring effect for double jump
        const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x00ffff, 0.5);
        ring.setStrokeStyle(3, 0x00ffff);
        
        this.scene.tweens.add({
            targets: ring,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                ring.destroy();
            }
        });
    }
    
    setDeveloperMode(enabled) {
        this.developerMode = enabled;
        
        if (enabled) {
            // Enable developer mode
            console.log('Seal: Developer mode ENABLED');
            
            // Disable gravity for flying
            this.sprite.body.setAllowGravity(false);
            
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
        } else {
            // Disable developer mode
            console.log('Seal: Developer mode DISABLED');
            
            // Re-enable gravity
            this.sprite.body.setAllowGravity(true);
            
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
        }
    }
}