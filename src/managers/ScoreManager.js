export default class ScoreManager {
    constructor(scene, initialScore = 0) {
        this.scene = scene;
        this.score = initialScore;
        this.combo = 0;
        this.comboTimer = null;
        this.highScore = this.loadHighScore();
        this.isBonusAnimating = false;  // Flag to suppress popups during bonus counting
    }

    addScore(points) {
        const multiplier = 1 + (this.combo * 0.5);
        const finalPoints = Math.floor(points * multiplier);
        this.score += finalPoints;
        
        this.combo++;
        // Only show popup if not during bonus animation
        if (!this.isBonusAnimating) {
            this.showScorePopup(finalPoints, multiplier > 1);
        }
        
        if (this.comboTimer) {
            this.comboTimer.destroy();
        }
        
        this.comboTimer = this.scene.time.delayedCall(3000, () => {
            this.combo = 0;
        });
        
        // Only show combo text if not during bonus animation
        if (this.combo > 2 && !this.isBonusAnimating) {
            this.showComboText();
        }
        
        return finalPoints;
    }

    showScorePopup(points, isCombo) {
        const x = this.scene.player.sprite.x;
        const y = this.scene.player.sprite.y - 30;
        
        const color = isCombo ? '#ffff00' : '#ffffff';
        const text = this.scene.add.text(x, y, `+${points}`, {
            fontSize: isCombo ? '14px' : '12px',
            fontFamily: '"Press Start 2P", monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    showComboText() {
        const comboText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            100,
            `COMBO x${this.combo}!`,
            {
                fontSize: '16px',
                fontFamily: '"Press Start 2P", monospace',
                color: '#ff00ff',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        comboText.setOrigin(0.5);
        comboText.setScrollFactor(0);
        
        this.scene.tweens.add({
            targets: comboText,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.scene.time.delayedCall(500, () => {
                    comboText.destroy();
                });
            }
        });
    }

    addTimeBonus(timeRemaining) {
        const bonus = timeRemaining * 10;
        this.score += bonus;
        return bonus;
    }

    animateBonusPoints(totalPoints, bonusType, onComplete) {
        if (totalPoints <= 0) {
            if (onComplete) onComplete();
            return;
        }

        // Set flag to suppress regular score popups during animation
        this.isBonusAnimating = true;

        // Create bonus display text
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY - 100;
        
        // Title text
        const titleText = this.scene.add.text(centerX, centerY - 40, 
            `${bonusType} BONUS`, {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        titleText.setOrigin(0.5);
        titleText.setScrollFactor(0);
        
        // Counter text - just show the increasing number
        let currentBonus = 0;
        const counterText = this.scene.add.text(centerX, centerY, 
            '0', {
            fontSize: '36px',  // Slightly bigger for emphasis
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        counterText.setOrigin(0.5);
        counterText.setScrollFactor(0);
        
        // Pulse animation for title
        this.scene.tweens.add({
            targets: titleText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
            repeat: -1
        });
        
        // Calculate increment and delay for smooth animation
        // Three-tier system for better pacing and satisfaction
        let increment, baseDelay;
        
        if (totalPoints <= 200) {
            // Small bonuses: very slow, deliberate counting
            increment = 10;
            baseDelay = 100;  // 100 points/second - savor each point
        } else if (totalPoints <= 1000) {
            // Medium bonuses: moderate speed for good pacing
            increment = 20;
            baseDelay = 80;  // 250 points/second - clearly visible
        } else {
            // Large bonuses: faster but still appreciable
            increment = 50;
            baseDelay = 60;  // 833 points/second - quick but countable
        }
        
        // Create timer event for animated counting with acceleration effect
        let tickCount = 0;
        let currentDelay = baseDelay;
        
        const createTimer = () => {
            return this.scene.time.addEvent({
                delay: currentDelay,
                callback: () => {
                    const step = Math.min(increment, totalPoints - currentBonus);
                    currentBonus += step;
                    this.score += step;
                    tickCount++;
                    
                    // Update counter display - just show the increasing number
                    counterText.setText(`${currentBonus}`);
                    
                    // Add subtle pulse to counter on each tick
                    this.scene.tweens.add({
                        targets: counterText,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 50,
                        yoyo: true,
                        ease: 'Power2'
                    });
                    
                    // Play tick sound every 2nd tick to avoid audio overload
                    if (this.scene.audioManager && tickCount % 2 === 0) {
                        this.scene.audioManager.playSound('bonusTick');
                    }
                    
                    // No floating text during bonus counting - keep it clean and focused
                    
                    // Subtle acceleration effect for very large bonuses
                    if (totalPoints > 1000 && tickCount > 10) {
                        currentDelay = Math.max(baseDelay * 0.8, 40); // Slight speed up
                        timer.destroy();
                        timer = createTimer(); // Recreate timer with new delay
                    }
                    
                    // Check if counting is complete
                    if (currentBonus >= totalPoints) {
                        timer.destroy();
                        
                        // Play completion sound
                        if (this.scene.audioManager) {
                            this.scene.audioManager.playSound('bonusComplete');
                        }
                        
                        // Enhanced completion effect
                        counterText.setColor('#ffff00');  // Changed to gold
                        counterText.setScale(1.8);        // Larger scale
                        
                        // Bouncy completion animation
                        this.scene.tweens.add({
                            targets: counterText,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 400,    // Slightly longer
                            ease: 'Back.easeOut'
                        });
                        
                        // Longer pause to let players appreciate the final total
                        this.scene.time.delayedCall(1500, () => {  // Increased from 1000ms
                            titleText.destroy();
                            counterText.destroy();
                            // Clear the flag when animation is complete
                            this.isBonusAnimating = false;
                            if (onComplete) onComplete();
                        });
                    }
                },
                loop: true
            });
        };
        
        let timer = createTimer();
        
        // Update UI to reflect score changes
        if (this.scene.updateUI) {
            const uiTimer = this.scene.time.addEvent({
                delay: 100,
                callback: () => {
                    this.scene.updateUI();
                    if (currentBonus >= totalPoints) {
                        uiTimer.destroy();
                    }
                },
                loop: true
            });
        }
    }

    loadHighScore() {
        return parseInt(localStorage.getItem('sealHighScore') || '0');
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('sealHighScore', this.score.toString());
            return true;
        }
        return false;
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        if (this.comboTimer) {
            this.comboTimer.destroy();
            this.comboTimer = null;
        }
    }
}