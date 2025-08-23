import Phaser from 'phaser';
import { ENEMIES } from '../utils/constants.js';
import logger from '../utils/logger.js';

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

    // Override destroy to clean up any additional objects
    destroy() {
        // Clean up hawk's sleep indicator if it exists
        if (this.sleepIndicator) {
            this.sleepIndicator.destroy();
            this.sleepIndicator = null;
        }
        
        // Clean up polar bear's exclamation if it exists
        if (this.exclamation) {
            this.exclamation.destroy();
            this.exclamation = null;
        }
        
        // Call parent destroy
        super.destroy();
    }

    setupBehavior() {
        switch (this.type) {
            case 'human':
                this.setupPatrol();
                break;
            case 'hawk':
                this.setupFlying();
                break;
            case 'orca':
                this.setupSwimming();
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
        this.patrolSpeed = this.config.PATROL_SPEED;
        this.diveSpeed = this.config.DIVE_SPEED;
        this.detectionRange = this.config.DETECTION_RANGE;  // Now 500 from constants
        this.diveCooldown = this.config.DIVE_COOLDOWN;
        
        this.hoverHeight = this.y;
        this.startX = this.x;
        this.isCharging = false;
        this.canCharge = true;
        this.isTired = false; // Hawk becomes tired after first attack
        this.sleepIndicator = null; // Zzz indicator
        this.direction = 1;
        
        // New properties for two-phase attack
        this.isAscending = false; // Track ascend phase
        this.ascendTimer = 0; // Timer for ascend phase
        this.targetX = 0; // Target position for dive
        this.targetY = 0;
        this.ascendHeight = 150; // How high to ascend before diving
        this.ascendSpeed = 60; // Slow ascent speed
        this.ascendDuration = 800; // Time to ascend in ms
        this.ascendVelocityX = 0; // Stored velocity for continuous application
        this.ascendVelocityY = 0;
        this.restTimer = 0; // Timer for rest period
        this.restDuration = 3000; // Rest for 3 seconds
        
        logger.debug(`🦅 HAWK: Setup complete - patrol speed=${this.patrolSpeed}, dive speed=${this.diveSpeed}`);
        logger.debug(`  Detection range=${this.detectionRange}, ascend speed=${this.ascendSpeed}, ascend duration=${this.ascendDuration}ms`);
        logger.debug(`  Starting pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        
        // Start simple horizontal patrol
        this.setVelocityX(this.patrolSpeed * this.direction);
    }

    setupSwimming() {
        // Orca swims exactly like hawk flies
        this.body.setAllowGravity(false);
        this.patrolSpeed = this.config.PATROL_SPEED;
        this.diveSpeed = this.config.DIVE_SPEED;
        this.detectionRange = this.config.DETECTION_RANGE;
        this.diveCooldown = this.config.DIVE_COOLDOWN;
        
        this.hoverHeight = this.y;
        this.startX = this.x;
        this.isCharging = false;
        this.canCharge = true;
        this.isTired = false; // Orca becomes tired after attack like hawk
        this.sleepIndicator = null; // Zzz indicator
        this.direction = 1;
        
        // Two-phase attack properties (same as hawk)
        this.isAscending = false;
        this.ascendTimer = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.ascendHeight = 150;
        this.ascendSpeed = 60;
        this.ascendDuration = 800;
        this.ascendVelocityX = 0;
        this.ascendVelocityY = 0;
        this.restTimer = 0;
        this.restDuration = 3000; // Rest for 3 seconds like hawk
        
        logger.debug(`🐋 ORCA: Setup complete - patrol speed=${this.patrolSpeed}, dive speed=${this.diveSpeed}`);
        logger.debug(`  Detection range=${this.detectionRange}, ascend speed=${this.ascendSpeed}, ascend duration=${this.ascendDuration}ms`);
        logger.debug(`  Starting pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        
        // Start swimming patrol
        this.setVelocityX(this.patrolSpeed * this.direction);
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

    checkPlatformAhead(direction, checkDistance = 30) {
        const checkX = this.x + (direction * checkDistance);
        const checkY = this.y + 35;
        
        let platformAhead = false;
        this.scene.platforms.children.entries.forEach(platform => {
            if (!platform.active) return;
            
            const bounds = platform.getBounds();
            if (checkX >= bounds.left && checkX <= bounds.right &&
                checkY >= bounds.top - 10 && checkY <= bounds.bottom + 30) {
                platformAhead = true;
            }
        });
        
        return platformAhead;
    }

    update(player) {
        switch (this.type) {
            case 'human':
                this.updatePatrol();
                break;
            case 'hawk':
                this.updateFlying(player);
                break;
            case 'orca':
                this.updateSwimming(player);
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
        const platformAhead = this.checkPlatformAhead(this.direction);
        
        if (!platformAhead) {
            this.direction *= -1;
        } else if (this.body.blocked.left || this.body.touching.left) {
            this.direction = 1;
        } else if (this.body.blocked.right || this.body.touching.right) {
            this.direction = -1;
        } else if (Math.abs(this.body.velocity.x) < 10) {
            this.direction *= -1;
        }
        
        this.setVelocityX(this.patrolSpeed * this.direction);
        this.setFlipX(this.direction === 1);
    }

    updateFlying(player) {
        // If tired, hawk rests and then wakes up
        if (this.isTired) {
            this.restTimer += this.scene.game.loop.delta;
            
            // Log rest progress every second
            if (Math.floor(this.restTimer / 1000) !== Math.floor((this.restTimer - this.scene.game.loop.delta) / 1000)) {
                logger.debug(`🦅 HAWK: Resting - ${(this.restTimer / 1000).toFixed(0)}s / ${(this.restDuration / 1000).toFixed(0)}s`);
            }
            
            // Wake up after rest duration
            if (this.restTimer >= this.restDuration) {
                this.wakeUp();
            }
            return;
        }
        
        if (!this.isCharging) {
            // Simple horizontal patrol
            if (Math.abs(this.x - this.startX) > 200) {
                this.direction *= -1;
                this.setVelocityX(this.patrolSpeed * this.direction);
                this.setFlipX(this.direction < 0);
                logger.debug(`🦅 HAWK: Patrol turn - direction=${this.direction}, pos=(${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
            }
            
            // Check for charge opportunity
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < this.detectionRange && this.canCharge) {
                logger.debug(`🦅 HAWK: Detected player - distance=${distance.toFixed(0)}, detectionRange=${this.detectionRange}`);
                logger.debug(`  Hawk pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                logger.debug(`  Seal pos: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
                this.startCharge(player);
            }
        } else if (this.isAscending) {
            // Ascend phase - move up slowly
            this.ascendTimer += this.scene.game.loop.delta;
            
            // Continuously apply ascend velocity to maintain upward movement
            this.setVelocityX(this.ascendVelocityX);
            this.setVelocityY(this.ascendVelocityY);
            
            // Log ascend progress every 200ms
            if (Math.floor(this.ascendTimer / 200) !== Math.floor((this.ascendTimer - this.scene.game.loop.delta) / 200)) {
                logger.debug(`🦅 HAWK: ASCENDING - timer=${this.ascendTimer.toFixed(0)}ms/${this.ascendDuration}ms`);
                logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                logger.debug(`  Velocity: (${this.body.velocity.x.toFixed(0)}, ${this.body.velocity.y.toFixed(0)})`);
                logger.debug(`  Body.moves=${this.body.moves}, gravity=${this.body.allowGravity}`);
            }
            
            // Continue ascending for the specified duration
            if (this.ascendTimer >= this.ascendDuration) {
                logger.debug(`🦅 HAWK: Ascend complete - transitioning to dive`);
                logger.debug(`  Final ascend position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                // Transition to dive phase
                this.startDive();
            }
        } else {
            // Dive phase - check if charge should end
            this.chargeTimer += this.scene.game.loop.delta;
            
            // Log dive progress every 200ms
            if (Math.floor(this.chargeTimer / 200) !== Math.floor((this.chargeTimer - this.scene.game.loop.delta) / 200)) {
                logger.debug(`🦅 HAWK: DIVING - timer=${this.chargeTimer.toFixed(0)}ms`);
                logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                logger.debug(`  Velocity: (${this.body.velocity.x.toFixed(0)}, ${this.body.velocity.y.toFixed(0)})`);
                logger.debug(`  Target was: (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`);
            }
            
            // End charge if: timeout, hit ground, or traveled too far
            if (this.chargeTimer > 2000 || 
                this.body.blocked.down || 
                this.y > this.hoverHeight + 400) {
                logger.debug(`🦅 HAWK: Ending dive - reason: ${this.chargeTimer > 2000 ? 'timeout' : this.body.blocked.down ? 'hit ground' : 'too far down'}`);
                this.endCharge();
            }
        }
    }
    
    startCharge(player) {
        logger.debug(`🦅 HAWK: STARTING CHARGE SEQUENCE`);
        logger.debug(`  Initial state - isCharging=${this.isCharging}, canCharge=${this.canCharge}, isTired=${this.isTired}`);
        
        this.isCharging = true;
        this.canCharge = false;
        this.isAscending = true;
        this.ascendTimer = 0;
        this.chargeTimer = 0;
        
        // Store target position (where the seal currently is)
        this.targetX = player.x;
        this.targetY = player.y;
        
        logger.debug(`🦅 HAWK: Entering ASCEND phase`);
        logger.debug(`  Hawk pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Target stored: (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`);
        logger.debug(`  Ascend speed: ${this.ascendSpeed}, duration: ${this.ascendDuration}ms`);
        
        // Face the player
        const horizontalDirection = player.x > this.x ? 1 : -1;
        this.setFlipX(horizontalDirection < 0);
        
        // Ensure physics body can move
        this.body.moves = true;
        this.body.setAllowGravity(false); // Make sure gravity stays off
        
        // Store ascend velocity to reapply each frame
        this.ascendVelocityX = 0;
        this.ascendVelocityY = -this.ascendSpeed;
        
        // Start ascending - move up slowly
        this.setVelocityX(this.ascendVelocityX);
        this.setVelocityY(this.ascendVelocityY);
        
        logger.debug(`🦅 HAWK: Physics setup - body.moves=${this.body.moves}, gravity=${this.body.allowGravity}`);
        logger.debug(`🦅 HAWK: Velocities set - VX=${this.body.velocity.x}, VY=${this.body.velocity.y}`);
    }
    
    startDive() {
        logger.debug(`🦅 HAWK: STARTING DIVE PHASE`);
        logger.debug(`  Current pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Target pos: (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`);
        
        // Transition from ascend to dive phase
        this.isAscending = false;
        
        // Calculate straight-line vector to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        logger.debug(`🦅 HAWK: Dive calculation - dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)}, distance=${distance.toFixed(0)}`);
        
        // Normalize and apply dive speed
        if (distance > 0) {
            const vx = (dx / distance) * this.diveSpeed;
            const vy = (dy / distance) * this.diveSpeed;
            
            this.setVelocityX(vx);
            this.setVelocityY(vy);
            
            logger.debug(`🦅 HAWK: Dive velocity set - VX=${vx.toFixed(0)}, VY=${vy.toFixed(0)}, speed=${this.diveSpeed}`);
        } else {
            // Fallback if target is at same position
            this.setVelocityY(this.diveSpeed);
            logger.debug(`🦅 HAWK: Fallback dive - straight down at speed=${this.diveSpeed}`);
        }
    }
    
    endCharge() {
        logger.debug(`🦅 HAWK: ENDING CHARGE - Becoming tired`);
        logger.debug(`  Final pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Was ascending: ${this.isAscending}, charge timer: ${this.chargeTimer.toFixed(0)}ms`);
        
        this.isCharging = false;
        this.isAscending = false; // Make sure to clear ascend state
        
        // Hawk becomes tired after attack - completely stop all movement
        this.isTired = true;
        this.restTimer = 0; // Start rest timer
        
        // Completely disable physics to prevent any motion
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.setAcceleration(0, 0);
        this.body.setAllowGravity(false);
        this.body.moves = false; // Disable physics body movement
        this.setBounce(0);
        
        logger.debug(`🦅 HAWK: Physics disabled - isTired=${this.isTired}, body.moves=${this.body.moves}`);
        logger.debug(`  Starting ${(this.restDuration / 1000).toFixed(0)} second rest period`);
        
        // Show sleep indicator
        this.showSleepIndicator();
    }
    
    wakeUp() {
        logger.debug(`🦅 HAWK: WAKING UP - Resuming patrol`);
        logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        
        // Remove sleep indicator
        if (this.sleepIndicator) {
            this.sleepIndicator.destroy();
            this.sleepIndicator = null;
        }
        
        // Reset tired state
        this.isTired = false;
        this.canCharge = true; // Can attack again
        this.restTimer = 0;
        
        // Re-enable physics
        this.body.moves = true;
        this.body.setAllowGravity(false); // Keep gravity off for flying
        
        // Resume patrol
        this.setVelocityX(this.patrolSpeed * this.direction);
        
        logger.debug(`🦅 HAWK: Resumed patrol - direction=${this.direction}, velocity=${this.body.velocity.x}`);
    }
    
    showSleepIndicator() {
        // Safety check
        if (!this.scene || !this.active) return;
        
        if (this.sleepIndicator) {
            this.sleepIndicator.destroy();
        }
        
        // Create Zzz text above the hawk
        this.sleepIndicator = this.scene.add.text(
            this.x, 
            this.y - 40,
            '💤',
            { fontSize: '20px' }
        );
        
        // Floating animation
        this.scene.tweens.add({
            targets: this.sleepIndicator,
            y: this.y - 50,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updateSwimming(player) {
        // Orca swims and hunts exactly like hawk
        // If tired, orca rests and then wakes up
        if (this.isTired) {
            this.restTimer += this.scene.game.loop.delta;
            
            // Log rest progress every second
            if (Math.floor(this.restTimer / 1000) !== Math.floor((this.restTimer - this.scene.game.loop.delta) / 1000)) {
                logger.debug(`🐋 ORCA: Resting - ${(this.restTimer / 1000).toFixed(0)}s / ${(this.restDuration / 1000).toFixed(0)}s`);
            }
            
            // Wake up after rest duration
            if (this.restTimer >= this.restDuration) {
                this.wakeUpOrca();
            }
            return;
        }
        
        if (!this.isCharging) {
            // Simple horizontal patrol
            if (Math.abs(this.x - this.startX) > 200) {
                this.direction *= -1;
                this.setVelocityX(this.patrolSpeed * this.direction);
                this.setFlipX(this.direction < 0);
                logger.debug(`🐋 ORCA: Patrol turn - direction=${this.direction}, pos=(${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
            }
            
            // Check for charge opportunity
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < this.detectionRange && this.canCharge) {
                logger.debug(`🐋 ORCA: Detected player - distance=${distance.toFixed(0)}, detectionRange=${this.detectionRange}`);
                logger.debug(`  Orca pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                logger.debug(`  Seal pos: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
                this.startOrcaCharge(player);
            }
        } else if (this.isAscending) {
            // Ascend phase - move up slowly
            this.ascendTimer += this.scene.game.loop.delta;
            
            // Continuously apply ascend velocity to maintain upward movement
            this.setVelocityX(this.ascendVelocityX);
            this.setVelocityY(this.ascendVelocityY);
            
            // Log ascend progress every 200ms
            if (Math.floor(this.ascendTimer / 200) !== Math.floor((this.ascendTimer - this.scene.game.loop.delta) / 200)) {
                logger.debug(`🐋 ORCA: ASCENDING - timer=${this.ascendTimer.toFixed(0)}ms/${this.ascendDuration}ms`);
                logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                logger.debug(`  Velocity: (${this.body.velocity.x.toFixed(0)}, ${this.body.velocity.y.toFixed(0)})`);
            }
            
            // Continue ascending for the specified duration
            if (this.ascendTimer >= this.ascendDuration) {
                logger.debug(`🐋 ORCA: Ascend complete - transitioning to dive`);
                logger.debug(`  Final ascend position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                // Transition to dive phase
                this.startOrcaDive();
            }
        } else {
            // Dive phase - check if charge should end
            this.chargeTimer += this.scene.game.loop.delta;
            
            // Log dive progress every 200ms
            if (Math.floor(this.chargeTimer / 200) !== Math.floor((this.chargeTimer - this.scene.game.loop.delta) / 200)) {
                logger.debug(`🐋 ORCA: DIVING - timer=${this.chargeTimer.toFixed(0)}ms`);
                logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                logger.debug(`  Velocity: (${this.body.velocity.x.toFixed(0)}, ${this.body.velocity.y.toFixed(0)})`);
                logger.debug(`  Target was: (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`);
            }
            
            // End charge if: timeout or traveled too far
            if (this.chargeTimer > 2000 || 
                this.y > this.hoverHeight + 400 || 
                this.y < this.hoverHeight - 400) {
                logger.debug(`🐋 ORCA: Ending dive - reason: ${this.chargeTimer > 2000 ? 'timeout' : 'too far'}`);
                this.endOrcaCharge();
            }
        }
    }
    
    startOrcaCharge(player) {
        logger.debug(`🐋 ORCA: STARTING CHARGE SEQUENCE`);
        logger.debug(`  Initial state - isCharging=${this.isCharging}, canCharge=${this.canCharge}, isTired=${this.isTired}`);
        
        this.isCharging = true;
        this.canCharge = false;
        this.isAscending = true;
        this.ascendTimer = 0;
        this.chargeTimer = 0;
        
        // Store target position (where the seal currently is)
        this.targetX = player.x;
        this.targetY = player.y;
        
        logger.debug(`🐋 ORCA: Entering ASCEND phase`);
        logger.debug(`  Orca pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Target stored: (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`);
        logger.debug(`  Ascend speed: ${this.ascendSpeed}, duration: ${this.ascendDuration}ms`);
        
        // Face the player
        const horizontalDirection = player.x > this.x ? 1 : -1;
        this.setFlipX(horizontalDirection < 0);
        
        // Ensure physics body can move
        this.body.moves = true;
        this.body.setAllowGravity(false); // Make sure gravity stays off
        
        // Store ascend velocity to reapply each frame
        this.ascendVelocityX = 0;
        this.ascendVelocityY = -this.ascendSpeed;
        
        // Start ascending - move up slowly
        this.setVelocityX(this.ascendVelocityX);
        this.setVelocityY(this.ascendVelocityY);
        
        logger.debug(`🐋 ORCA: Physics setup - body.moves=${this.body.moves}, gravity=${this.body.allowGravity}`);
        logger.debug(`🐋 ORCA: Velocities set - VX=${this.body.velocity.x}, VY=${this.body.velocity.y}`);
    }
    
    startOrcaDive() {
        logger.debug(`🐋 ORCA: STARTING DIVE PHASE`);
        logger.debug(`  Current pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Target pos: (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`);
        
        // Transition from ascend to dive phase
        this.isAscending = false;
        
        // Calculate straight-line vector to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        logger.debug(`🐋 ORCA: Dive calculation - dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)}, distance=${distance.toFixed(0)}`);
        
        // Normalize and apply dive speed
        if (distance > 0) {
            const vx = (dx / distance) * this.diveSpeed;
            const vy = (dy / distance) * this.diveSpeed;
            
            this.setVelocityX(vx);
            this.setVelocityY(vy);
            
            logger.debug(`🐋 ORCA: Dive velocity set - VX=${vx.toFixed(0)}, VY=${vy.toFixed(0)}, speed=${this.diveSpeed}`);
        } else {
            // Fallback if target is at same position
            this.setVelocityY(this.diveSpeed);
            logger.debug(`🐋 ORCA: Fallback dive - straight down at speed=${this.diveSpeed}`);
        }
    }
    
    endOrcaCharge() {
        logger.debug(`🐋 ORCA: ENDING CHARGE - Becoming tired`);
        logger.debug(`  Final pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Was ascending: ${this.isAscending}, charge timer: ${this.chargeTimer.toFixed(0)}ms`);
        
        this.isCharging = false;
        this.isAscending = false; // Make sure to clear ascend state
        
        // Orca becomes tired after attack - completely stop all movement
        this.isTired = true;
        this.restTimer = 0; // Start rest timer
        
        // Completely disable physics to prevent any motion
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.setAcceleration(0, 0);
        this.body.setAllowGravity(false);
        this.body.moves = false; // Disable physics body movement
        this.setBounce(0);
        
        logger.debug(`🐋 ORCA: Physics disabled - isTired=${this.isTired}, body.moves=${this.body.moves}`);
        logger.debug(`  Starting ${(this.restDuration / 1000).toFixed(0)} second rest period`);
        
        // Show sleep indicator (reuse hawk's method)
        this.showSleepIndicator();
    }
    
    wakeUpOrca() {
        logger.debug(`🐋 ORCA: WAKING UP - Resuming patrol`);
        logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        
        // Remove sleep indicator
        if (this.sleepIndicator) {
            this.sleepIndicator.destroy();
            this.sleepIndicator = null;
        }
        
        // Reset tired state
        this.isTired = false;
        this.canCharge = true; // Can attack again
        this.restTimer = 0;
        
        // Re-enable physics
        this.body.moves = true;
        this.body.setAllowGravity(false); // Keep gravity off for swimming
        
        // Resume patrol
        this.setVelocityX(this.patrolSpeed * this.direction);
        
        logger.debug(`🐋 ORCA: Resumed patrol - direction=${this.direction}, velocity=${this.body.velocity.x}`);
    }

    updateSideways() {
        const platformAhead = this.checkPlatformAhead(this.direction, 35);
        
        if (!platformAhead) {
            this.direction *= -1;
        } else if (this.body.blocked.left || this.body.touching.left) {
            this.direction = 1;
        } else if (this.body.blocked.right || this.body.touching.right) {
            this.direction = -1;
        }
        
        this.setVelocityX(this.sideSpeed * this.direction);
        this.setFlipX(this.direction === -1);
        
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
        this.chargeLogTimer = 0; // For periodic logging during charge
        this.setVelocityX(this.patrolSpeed * this.direction);
        this.setScale(1.2); // Polarbears are bigger
        this.exclamation = null;
    }

    getTimestamp() {
        const now = this.scene.game.loop.time;
        const seconds = Math.floor(now / 1000);
        const ms = now % 1000;
        return `[${seconds}.${ms.toString().padStart(3, '0')}s]`;
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
        const player = this.scene.player?.sprite;
        logger.debug(`${this.getTimestamp()} 🐻‍❄️ ENTERING ALERT STATE`);
        logger.debug(`  Bear pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        if (player) {
            logger.debug(`  Seal pos: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
            logger.debug(`  Distance: X=${Math.abs(player.x - this.x).toFixed(0)}, Y=${Math.abs(player.y - this.y).toFixed(0)}`);
        }
        
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
                // Safety check - ensure scene and enemy still exist
                if (!this.scene || !this.active) return;
                
                this.showExclamation();
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
        logger.debug(`${this.getTimestamp()} 🐻‍❄️ ENTERING CHARGE STATE`);
        logger.debug(`  Bear pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Seal pos: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
        
        this.state = 'CHARGING';
        this.clearTint();
        
        // Reset scale from alert state
        this.setScale(1.2);
        
        // Calculate charge direction
        this.chargeDirection = player.x > this.x ? 1 : -1;
        logger.debug(`  Charge direction: ${this.chargeDirection === 1 ? 'RIGHT' : 'LEFT'}`);
        this.setFlipX(this.chargeDirection === -1);
        
        this.chargeStartX = this.x;
        this.chargeLogTimer = 0;
        
        // Lean forward
        this.setRotation(this.chargeDirection * -0.26);
        
        // Set charge velocity
        this.setVelocityX(this.chargeSpeed * this.chargeDirection);
        logger.debug(`  Charge velocity set to: ${this.chargeSpeed * this.chargeDirection}`);
        logger.debug(`  Actual velocity: X=${this.body.velocity.x.toFixed(0)}, Y=${this.body.velocity.y.toFixed(0)}`);
        
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
        const player = this.scene.player?.sprite;
        
        // Calculate distance to seal
        const distanceToSeal = player ? Math.abs(this.x - player.x) : Infinity;
        const isCloseToseal = distanceToSeal < 60; // Within 60 pixels of seal
        
        // Periodic status logging every 500ms
        this.chargeLogTimer += this.scene.game.loop.delta;
        if (this.chargeLogTimer >= 500) {
            this.chargeLogTimer = 0;
            logger.debug(`${this.getTimestamp()} 🐻‍❄️ CHARGING STATUS`);
            logger.debug(`  Bear: pos=(${this.x.toFixed(0)}, ${this.y.toFixed(0)}), vel=(${this.body.velocity.x.toFixed(0)}, ${this.body.velocity.y.toFixed(0)})`);
            if (player) {
                logger.debug(`  Seal: pos=(${player.x.toFixed(0)}, ${player.y.toFixed(0)}), distance=${distanceToSeal.toFixed(0)}`);
            }
            logger.debug(`  Charge distance: ${chargeDistance.toFixed(0)} / ${this.config.CHARGE_MAX_DISTANCE}`);
        }
        
        // Create speed lines
        if (this.scene.game.loop.frame % 3 === 0) {
            this.createSpeedLine();
        }
        
        // Edge detection during charge - be less cautious when close to seal
        const bearHalfWidth = 20;
        const baseCheckDistance = isCloseToseal ? 10 : 25; // Much shorter look-ahead when close to seal
        const checkDistance = bearHalfWidth + baseCheckDistance;
        const checkX = this.x + (this.chargeDirection * checkDistance);
        const checkY = this.y + 35; // At feet level
        
        let platformAhead = false;
        let platformCount = 0;
        this.scene.platforms.children.entries.forEach(platform => {
            if (!platform.active) return; // Skip destroyed platforms
            
            const bounds = platform.getBounds();
            if (checkX >= bounds.left && checkX <= bounds.right &&
                checkY >= bounds.top - 10 && checkY <= bounds.bottom + 30) {
                platformAhead = true;
                platformCount++;
            }
        });
        
        // Check if bear reached seal (success condition)
        if (distanceToSeal < 40) {
            logger.debug(`${this.getTimestamp()} 🐻‍❄️ REACHED SEAL!`);
            logger.debug(`  Final distance to seal: ${distanceToSeal.toFixed(0)}`);
            this.enterCooldownState();
            return;
        }
        
        // Check charge end conditions (including edge detection)
        let endReason = null;
        if (chargeDistance > this.config.CHARGE_MAX_DISTANCE) {
            endReason = 'MAX_DISTANCE';
        } else if (this.body.blocked.left) {
            endReason = 'BLOCKED_LEFT';
        } else if (this.body.blocked.right) {
            endReason = 'BLOCKED_RIGHT';
        } else if (!platformAhead && !isCloseToseal) { // Only stop for edge if not close to seal
            endReason = 'NO_PLATFORM_AHEAD';
        }
        
        if (endReason) {
            logger.debug(`${this.getTimestamp()} 🐻‍❄️ ENDING CHARGE - Reason: ${endReason}`);
            logger.debug(`  Final position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
            logger.debug(`  Distance charged: ${chargeDistance.toFixed(0)}`);
            logger.debug(`  Distance to seal: ${distanceToSeal.toFixed(0)}`);
            logger.debug(`  Platform ahead check: X=${checkX.toFixed(0)}, Y=${checkY.toFixed(0)}, Found=${platformCount} platforms`);
            this.enterCooldownState();
        }
    }

    enterCooldownState() {
        logger.debug(`${this.getTimestamp()} 🐻‍❄️ ENTERING COOLDOWN STATE`);
        logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        
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
        logger.debug(`${this.getTimestamp()} 🐻‍❄️ RETURNING TO PATROL`);
        logger.debug(`  Position: (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        logger.debug(`  Direction: ${this.direction === 1 ? 'RIGHT' : 'LEFT'}`);
        
        this.state = 'PATROL';
        this.clearTint();
        this.setRotation(0);
        this.setScale(1.2);
        this.alertTimer = 0;
        this.cooldownTimer = 0;
        this.chargeLogTimer = 0;
        this.setVelocityX(this.patrolSpeed * this.direction);
        
        if (this.exclamation) {
            this.exclamation.destroy();
            this.exclamation = null;
        }
    }
}