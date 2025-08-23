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
            console.log('[M KEY] Pressed - Toggling mute');
            // Toggle mute using global AudioManager
            if (this.game.audioManager) {
                const wasMuted = this.game.audioManager.isMuted;
                this.game.audioManager.toggleMute();
                console.log('[M KEY] Mute toggled from', wasMuted, 'to', this.game.audioManager.isMuted);
                
                // Update mute indicators across all active scenes
                const activeScenes = this.game.scene.scenes.filter(scene => 
                    scene.scene.isActive() && scene.scene.key !== 'GlobalInputScene'
                );
                
                console.log('[M KEY] Updating mute indicators in', activeScenes.length, 'active scenes');
                activeScenes.forEach(scene => {
                    if (scene.updateMuteIndicator) {
                        scene.updateMuteIndicator();
                    }
                });
            } else {
                console.log('[M KEY] AudioManager not available');
            }
        });
        
        // This scene stays active forever
        console.log('Global input scene initialized - M key will toggle mute globally');
    }
}