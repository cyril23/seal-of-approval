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
}