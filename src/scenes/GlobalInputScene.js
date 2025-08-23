import Phaser from 'phaser';
import logger from '../utils/logger.js';

export default class GlobalInputScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GlobalInputScene' });
    }

    create() {
        // This scene runs in parallel with all other scenes
        // and handles global keyboard input
        
        // Set up M key for global mute toggle
        this.input.keyboard.on('keydown-M', () => {
            logger.debug('[M KEY] Pressed - Toggling mute');
            // Toggle mute using global AudioManager
            if (this.game.audioManager) {
                const wasMuted = this.game.audioManager.isMuted;
                this.game.audioManager.toggleMute();
                logger.info('[M KEY] Mute toggled from', wasMuted, 'to', this.game.audioManager.isMuted);
                
                // Update mute indicators across all active scenes
                const activeScenes = this.game.scene.scenes.filter(scene => 
                    scene.scene.isActive() && scene.scene.key !== 'GlobalInputScene'
                );
                
                logger.debug('[M KEY] Updating mute indicators in', activeScenes.length, 'active scenes');
                activeScenes.forEach(scene => {
                    if (scene.updateMuteIndicator) {
                        scene.updateMuteIndicator();
                    }
                });
            } else {
                logger.warn('[M KEY] AudioManager not available');
            }
        });
        
        // This scene stays active forever
        logger.debug('Global input scene initialized - M key will toggle mute globally');
    }
}