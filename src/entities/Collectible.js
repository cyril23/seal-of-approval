import Phaser from 'phaser';

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, theme) {
        super(scene, x, y, type);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.type = type;
        this.theme = theme;
        this.setData('collectibleData', { type: type });
        
        this.setBounce(0.4);
        this.setCollideWorldBounds(true);
        
        // Set depth to ensure collectibles render above backgrounds
        this.setDepth(10);
        
        this.setupAnimation();
    }

    setupAnimation() {
        if (this.type === 'star' || this.type === 'magnet') {
            this.scene.tweens.add({
                targets: this,
                angle: 360,
                duration: 3000,
                repeat: -1
            });
        }
        
        if (this.type === 'fish') {
            // Make fish physics body slightly larger for better collision
            if (this.body) {
                this.body.setSize(this.width * 1.2, this.height * 1.2);
            }
            
            // Add vertical bobbing animation only for ocean theme
            if (this.theme && this.theme.name === 'ocean') {
                // Delay animation start to allow gravity to be set first
                this.scene.time.delayedCall(50, () => {
                    const originalY = this.y;
                    this.scene.tweens.add({
                        targets: this,
                        y: originalY - 8,
                        duration: 2000,
                        ease: 'Sine.inOut',
                        yoyo: true,
                        repeat: -1
                    });
                });
            }
        }
        
        this.createParticles();
    }

    createParticles() {
        if (this.type === 'star') {
            const particles = this.scene.add.particles(this.x, this.y, 'star', {
                scale: { start: 0.2, end: 0 },
                speed: { min: 20, max: 40 },
                lifespan: 1000,
                frequency: 200,
                quantity: 1,
                follow: this
            });
            
            this.on('destroy', () => {
                particles.destroy();
            });
        }
    }
}