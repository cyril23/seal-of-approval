import Phaser from 'phaser';

export default class GlobalInputScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GlobalInputScene' });
    }

    create() {
        // This scene runs in parallel with all other scenes
        // and handles global keyboard input
        
        // Set up M key for global mute toggle
        this.input.keyboard.on('keydown-M', () => {
            // Toggle mute using global AudioManager
            if (this.game.audioManager) {
                this.game.audioManager.toggleMute();
                
                // Update mute indicators across all active scenes
                const activeScenes = this.game.scene.scenes.filter(scene => 
                    scene.scene.isActive() && scene.scene.key !== 'GlobalInputScene'
                );
                
                activeScenes.forEach(scene => {
                    if (scene.updateMuteIndicator) {
                        scene.updateMuteIndicator();
                    }
                });
            }
        });
        
        // This scene stays active forever
        console.log('Global input scene initialized - M key will toggle mute globally');
    }
}