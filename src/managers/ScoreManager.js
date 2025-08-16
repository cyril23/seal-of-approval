export default class ScoreManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.combo = 0;
        this.comboTimer = null;
        this.highScore = this.loadHighScore();
    }

    addScore(points) {
        const multiplier = 1 + (this.combo * 0.5);
        const finalPoints = Math.floor(points * multiplier);
        this.score += finalPoints;
        
        this.combo++;
        this.showScorePopup(finalPoints, multiplier > 1);
        
        if (this.comboTimer) {
            this.comboTimer.destroy();
        }
        
        this.comboTimer = this.scene.time.delayedCall(3000, () => {
            this.combo = 0;
        });
        
        if (this.combo > 2) {
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