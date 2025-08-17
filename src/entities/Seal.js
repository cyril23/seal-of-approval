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
        
        this.updateSize();
    }

    update(cursors, spaceKey) {
        // Check if on ice platform
        const onIce = this.isOnIcePlatform();
        
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
        
        // Developer mode bottom boundary - keep seal within screen
        if (this.developerMode) {
            // Keep seal 10 pixels inside bottom boundary to avoid edge issues
            const bottomBoundary = GAME_HEIGHT - this.sprite.height / 2 - 10;
            if (this.sprite.y > bottomBoundary) {
                this.sprite.y = bottomBoundary;
                this.sprite.setVelocityY(0);
            }
        }
        
        // Apply ice physics if on ice
        const acceleration = onIce ? 0.5 : 1.0;  // Slower acceleration on ice
        const drag = onIce ? 0.95 : PHYSICS.DRAG;  // Less friction on ice
        
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


    updateSize() {
        // Fixed scale at medium size (1.5)
        const scale = 1.5;
        this.sprite.setScale(scale);
        
        // Update physics body to match the scaled sprite
        // Base sprite is 32x32, but emojis have padding/transparent areas
        const baseWidth = 32;
        const baseHeight = 32;
        
        // Use 70% of visual size for physics body (emojis have padding)
        const bodyWidth = baseWidth * scale * 0.7;
        const bodyHeight = baseHeight * scale * 0.7;
        
        // Set the physics body size
        this.sprite.body.setSize(bodyWidth, bodyHeight);
        
        // Center horizontally, align exactly to bottom of sprite
        const offsetX = (baseWidth * scale - bodyWidth) / 2;
        const offsetY = baseHeight * scale - bodyHeight; // Align exactly to bottom
        
        this.sprite.body.setOffset(offsetX, offsetY);
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
    
    isOnIcePlatform() {
        // Check if the seal is on an ice platform
        if (!this.scene.platforms) return false;
        
        const sealBounds = this.sprite.getBounds();
        let onIce = false;
        
        this.scene.platforms.children.entries.forEach(platform => {
            if (platform.getData('isIce')) {
                const platformBounds = platform.getBounds();
                
                // Check if seal is standing on this platform
                if (this.sprite.body.touching.down && 
                    sealBounds.bottom >= platformBounds.top - 5 &&
                    sealBounds.bottom <= platformBounds.top + 10 &&
                    sealBounds.right > platformBounds.left &&
                    sealBounds.left < platformBounds.right) {
                    onIce = true;
                    
                    // Handle cracking ice
                    if (platform.getData('crackingIce')) {
                        this.handleCrackingIce(platform);
                    }
                }
            }
        });
        
        return onIce;
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