import Phaser from 'phaser';
import { ENEMIES } from '../utils/constants.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        const textureKey = type.toLowerCase();
        super(scene, x, y, textureKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.type = type;
        this.config = ENEMIES[type.toUpperCase()];
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        
        this.direction = 1;
        this.setupBehavior();
    }

    setupBehavior() {
        switch (this.type) {
            case 'human':
                this.setupPatrol();
                break;
            case 'seagull':
                this.setupFlying();
                break;
            case 'orca':
                this.setupJumping();
                break;
            case 'crab':
                this.setupSideways();
                break;
            case 'polarbear':
                this.setupPolarbear();
                break;
        }
    }

    setupPatrol() {
        this.patrolSpeed = this.config.SPEED;
        this.setVelocityX(this.patrolSpeed * this.direction);
    }

    setupFlying() {
        this.body.setAllowGravity(false);
        this.flySpeed = this.config.SPEED;
        this.diveSpeed = this.config.DIVE_SPEED;
        this.hoverHeight = this.y;
        this.isDiving = false;
        
        this.scene.tweens.add({
            targets: this,
            y: this.y - 20,
            duration: 2000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    setupJumping() {
        this.jumpTimer = 0;
        this.jumpInterval = 180;
    }

    setupSideways() {
        this.sideSpeed = this.config.SPEED;
        this.setVelocityX(this.sideSpeed * this.direction);
        
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
    }

    update(player) {
        switch (this.type) {
            case 'human':
                this.updatePatrol();
                break;
            case 'seagull':
                this.updateFlying(player);
                break;
            case 'orca':
                this.updateJumping();
                break;
            case 'crab':
                this.updateSideways();
                break;
            case 'polarbear':
                this.updatePolarbear(player);
                break;
        }
    }

    updatePatrol() {
        if (this.body.blocked.left || this.body.touching.left) {
            this.direction = 1;
            this.setVelocityX(this.patrolSpeed * this.direction);
            this.setFlipX(false);
        } else if (this.body.blocked.right || this.body.touching.right) {
            this.direction = -1;
            this.setVelocityX(this.patrolSpeed * this.direction);
            this.setFlipX(true);
        }
        
        if (Math.abs(this.body.velocity.x) < 10) {
            this.direction *= -1;
            this.setVelocityX(this.patrolSpeed * this.direction);
        }
    }

    updateFlying(player) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        if (distance < 80 && !this.isDiving && player.y > this.y) {
            this.isDiving = true;
            this.scene.tweens.killTweensOf(this);
            
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.setVelocity(
                Math.cos(angle) * this.diveSpeed,
                Math.sin(angle) * this.diveSpeed
            );
            
            this.scene.time.delayedCall(1500, () => {
                if (this && this.scene && this.active) {
                    this.isDiving = false;
                    this.setVelocity(0, 0);
                    this.y = this.hoverHeight;
                    this.setupFlying();
                }
            });
        }
    }

    updateJumping() {
        this.jumpTimer++;
        
        if (this.jumpTimer >= this.jumpInterval && this.body.touching.down) {
            this.setVelocityY(-400);
            this.jumpTimer = 0;
            
            const randomDirection = Phaser.Math.Between(-1, 1);
            if (randomDirection !== 0) {
                this.setVelocityX(50 * randomDirection);
            }
        }
    }

    updateSideways() {
        if (this.body.blocked.left || this.body.touching.left) {
            this.direction = 1;
            this.setVelocityX(this.sideSpeed * this.direction);
            this.setFlipX(false);
        } else if (this.body.blocked.right || this.body.touching.right) {
            this.direction = -1;
            this.setVelocityX(this.sideSpeed * this.direction);
            this.setFlipX(true);
        }
        
        if (Math.random() < 0.01) {
            this.setVelocityY(-200);
        }
    }

    setupPolarbear() {
        this.state = 'PATROL';
        this.patrolSpeed = this.config.PATROL_SPEED;
        this.chargeSpeed = this.config.CHARGE_SPEED;
        this.alertTimer = 0;
        this.chargeStartX = 0;
        this.cooldownTimer = 0;
        this.setVelocityX(this.patrolSpeed * this.direction);
        this.setScale(1.2); // Polarbears are bigger
        this.exclamation = null;
    }

    updatePolarbear(player) {
        switch (this.state) {
            case 'PATROL':
                this.updatePolarbearPatrol(player);
                break;
            case 'ALERT':
                this.updatePolarbearAlert(player);
                break;
            case 'CHARGING':
                this.updatePolarbearCharging();
                break;
            case 'COOLDOWN':
                this.updatePolarbearCooldown();
                break;
        }
    }

    updatePolarbearPatrol(player) {
        // Edge detection - check if there's ground ahead where the bear will step
        const bearHalfWidth = 20; // Approximate half-width of scaled bear
        const safetyMargin = 25; // Extra margin for safety
        const checkDistance = bearHalfWidth + safetyMargin;
        const checkX = this.x + (this.direction * checkDistance);
        const checkY = this.y + 35; // Check at approximately feet level
        
        // Check if there's a platform ahead at the check position
        let platformAhead = false;
        this.scene.platforms.children.entries.forEach(platform => {
            if (!platform.active) return; // Skip destroyed platforms
            
            const bounds = platform.getBounds();
            // Check if our test point would be over this platform
            if (checkX >= bounds.left && checkX <= bounds.right &&
                checkY >= bounds.top - 10 && checkY <= bounds.bottom + 30) {
                platformAhead = true;
            }
        });
        
        // Simple turning logic
        if (!platformAhead) {
            // No platform ahead - turn around immediately
            this.direction *= -1;
        } else if (this.body.blocked.left && this.direction === -1) {
            // Hit wall while going left
            this.direction = 1;
        } else if (this.body.blocked.right && this.direction === 1) {
            // Hit wall while going right
            this.direction = -1;
        } else if (Math.abs(this.body.velocity.x) < 5) {
            // Stuck - turn around
            this.direction *= -1;
        }
        
        // Set velocity and sprite flip based on direction
        this.setVelocityX(this.patrolSpeed * this.direction);
        this.setFlipX(this.direction === -1);

        // Detection logic
        const facingPlayer = this.direction === 1 ? 
            player.x > this.x : player.x < this.x;
        
        if (!facingPlayer) return;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const xDiff = Math.abs(player.x - this.x);
        const yDiff = Math.abs(player.y - this.y);
        
        if (xDiff <= this.config.DETECTION_RANGE_X && 
            yDiff <= this.config.DETECTION_RANGE_Y &&
            this.hasLineOfSight(player)) {
            this.enterAlertState();
        }
    }

    hasLineOfSight(player) {
        // Simple check - ensure no platforms directly between bear and player
        const line = new Phaser.Geom.Line(
            this.x, 
            this.y - 20,
            player.x,
            player.y
        );
        
        let blocked = false;
        this.scene.platforms.children.entries.forEach(platform => {
            if (Phaser.Geom.Intersects.LineToRectangle(
                line, 
                platform.getBounds()
            )) {
                blocked = true;
            }
        });
        
        return !blocked;
    }

    enterAlertState() {
        this.state = 'ALERT';
        this.alertTimer = 0;
        this.setVelocityX(0);
        
        // Stand up animation - use arrow function to preserve 'this' context
        this.scene.tweens.add({
            targets: this,
            scaleY: 1.5,
            scaleX: 1.0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.showExclamation();
                this.scene.cameras.main.shake(100, 0.005);
                if (this.scene.audioManager) {
                    this.scene.audioManager.playSound('roar');
                }
            }
        });
    }

    showExclamation() {
        // Safety check - ensure scene exists
        if (!this.scene || !this.active) return;
        
        if (this.exclamation) {
            this.exclamation.destroy();
        }
        
        this.exclamation = this.scene.add.text(
            this.x, 
            this.y - 60,
            '❗',
            { fontSize: '24px' }
        );
        
        this.scene.tweens.add({
            targets: this.exclamation,
            y: this.y - 70,
            duration: 200,
            yoyo: true,
            ease: 'Bounce',
            onComplete: () => {
                // Safety check in callback
                if (this.exclamation && this.exclamation.scene) {
                    this.exclamation.destroy();
                    this.exclamation = null;
                }
            }
        });
    }

    updatePolarbearAlert(player) {
        this.alertTimer += this.scene.game.loop.delta;
        
        // Flash red tint
        if (Math.floor(this.alertTimer / 200) % 2 === 0) {
            this.setTint(0xff6666);
        } else {
            this.clearTint();
        }
        
        // After alert duration, start charging
        if (this.alertTimer >= this.config.ALERT_DURATION) {
            this.enterChargeState(player);
        }
        
        // Cancel if player escapes
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y, player.x, player.y
        );
        if (distance > this.config.ESCAPE_RANGE) {
            this.returnToPatrol();
        }
    }

    enterChargeState(player) {
        this.state = 'CHARGING';
        this.clearTint();
        
        // Reset scale from alert state
        this.setScale(1.2);
        
        // Calculate charge direction
        this.chargeDirection = player.x > this.x ? 1 : -1;
        this.setFlipX(this.chargeDirection === -1);
        
        this.chargeStartX = this.x;
        
        // Lean forward
        this.setRotation(this.chargeDirection * -0.26);
        
        // Set charge velocity
        this.setVelocityX(this.chargeSpeed * this.chargeDirection);
        
        // Create initial dust effect
        this.createChargeEffect();
    }

    createChargeEffect() {
        const dust = this.scene.add.rectangle(
            this.x - (this.chargeDirection * 20),
            this.y + 10,
            20, 10,
            0xcccccc
        );
        
        this.scene.tweens.add({
            targets: dust,
            alpha: 0,
            scaleX: 2,
            duration: 300,
            onComplete: () => dust.destroy()
        });
    }

    createSpeedLine() {
        const line = this.scene.add.rectangle(
            this.x - (this.chargeDirection * 30),
            this.y + Phaser.Math.Between(-10, 10),
            40, 2,
            0xffffff
        );
        
        this.scene.tweens.add({
            targets: line,
            alpha: 0,
            scaleX: 0,
            duration: 300,
            onComplete: () => line.destroy()
        });
    }

    updatePolarbearCharging() {
        const chargeDistance = Math.abs(this.x - this.chargeStartX);
        
        // Create speed lines
        if (this.scene.game.loop.frame % 3 === 0) {
            this.createSpeedLine();
        }
        
        // Edge detection during charge - stop at ledges
        const bearHalfWidth = 20;
        const checkDistance = bearHalfWidth + 50; // Look further ahead when charging
        const checkX = this.x + (this.chargeDirection * checkDistance);
        const checkY = this.y + 35; // At feet level
        
        let platformAhead = false;
        this.scene.platforms.children.entries.forEach(platform => {
            if (!platform.active) return; // Skip destroyed platforms
            
            const bounds = platform.getBounds();
            if (checkX >= bounds.left && checkX <= bounds.right &&
                checkY >= bounds.top - 10 && checkY <= bounds.bottom + 30) {
                platformAhead = true;
            }
        });
        
        // Check charge end conditions (including edge detection)
        if (
            chargeDistance > this.config.CHARGE_MAX_DISTANCE ||
            this.body.blocked.left || 
            this.body.blocked.right ||
            !this.body.touching.down ||
            !platformAhead // Stop at edges
        ) {
            this.enterCooldownState();
        }
    }

    enterCooldownState() {
        this.state = 'COOLDOWN';
        this.cooldownTimer = 0;
        this.setVelocityX(0);
        this.setRotation(0);
        
        // Heavy breathing animation
        this.scene.tweens.add({
            targets: this,
            scaleX: [1.3, 1.1, 1.3],
            scaleY: [1.1, 1.3, 1.1],
            duration: 500,
            repeat: 2,
            ease: 'Sine.inOut'
        });
    }

    updatePolarbearCooldown() {
        this.cooldownTimer += this.scene.game.loop.delta;
        
        if (this.cooldownTimer >= this.config.COOLDOWN_DURATION) {
            this.returnToPatrol();
        }
    }

    returnToPatrol() {
        this.state = 'PATROL';
        this.clearTint();
        this.setRotation(0);
        this.setScale(1.2);
        this.alertTimer = 0;
        this.cooldownTimer = 0;
        this.setVelocityX(this.patrolSpeed * this.direction);
        
        if (this.exclamation) {
            this.exclamation.destroy();
            this.exclamation = null;
        }
    }
}