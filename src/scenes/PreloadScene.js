import Phaser from 'phaser';
import { EMOJIS } from '../utils/constants.js';
import PlatformColorManager from '../managers/PlatformColorManager.js';
import BackgroundDesigner from '../utils/BackgroundDesigner.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const loadingBar = document.getElementById('loading-bar');

        this.load.on('progress', (value) => {
            if (loadingBar) {
                loadingBar.style.width = `${value * 100}%`;
            }
        });

        this.load.on('complete', () => {
            const loadingDiv = document.getElementById('loading');
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
        });

        this.createEmojiTextures();
    }

    createEmojiTextures() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;

        Object.entries(EMOJIS).forEach(([key, emoji]) => {
            // Special handling for seal - create multiple sizes
            if (key === 'SEAL') {
                // Create three different seal textures at optimal resolutions
                const sealSizes = [
                    { name: 'seal_size1', size: 48, fontSize: 42 },  // 1.5x scale equivalent
                    { name: 'seal_size2', size: 64, fontSize: 56 },  // 2x scale equivalent
                    { name: 'seal_size3', size: 96, fontSize: 84 }   // 3x scale equivalent
                ];
                
                sealSizes.forEach(sealConfig => {
                    canvas.width = sealConfig.size;
                    canvas.height = sealConfig.size;
                    ctx.clearRect(0, 0, sealConfig.size, sealConfig.size);
                    ctx.font = `${sealConfig.fontSize}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, sealConfig.size / 2, sealConfig.size / 2);
                    this.textures.addCanvas(sealConfig.name, canvas);
                });
                
                // Also create the default seal texture for compatibility
                canvas.width = 32;
                canvas.height = 32;
            }
            
            // Create standard texture for all emojis (including seal)
            ctx.clearRect(0, 0, 32, 32);
            ctx.font = '28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 16, 16);

            this.textures.addCanvas(key.toLowerCase(), canvas);
        });

        this.createPlatformTexture();
        this.createBackgrounds();
    }

    createPlatformTexture() {
        const graphics = this.add.graphics();
        const platformManager = new PlatformColorManager();
        
        // Create default platform texture (for backward compatibility)
        const defaultColor = 0x4A5859;
        const defaultEdges = platformManager.getEdgeColors(defaultColor);
        
        graphics.fillStyle(defaultColor, 1);
        graphics.fillRect(0, 0, 16, 16);
        graphics.fillStyle(defaultEdges.top, 1);
        graphics.fillRect(0, 0, 16, 2);
        graphics.fillStyle(defaultEdges.bottom, 1);
        graphics.fillRect(0, 14, 16, 2);
        
        graphics.generateTexture('platform', 16, 16);
        
        // Create theme-specific platform textures
        const themes = ['beach', 'city', 'ocean', 'harbor', 'arctic'];
        
        themes.forEach(theme => {
            const platformTypes = platformManager.getPlatformTypes(theme);
            
            platformTypes.forEach(type => {
                graphics.clear();
                
                const baseColor = platformManager.getBaseColor(theme, type);
                const edgeColors = platformManager.getEdgeColors(baseColor);
                
                // Draw platform with base color
                graphics.fillStyle(baseColor, 1);
                graphics.fillRect(0, 0, 16, 16);
                
                // Draw top edge (lighter)
                graphics.fillStyle(edgeColors.top, 1);
                graphics.fillRect(0, 0, 16, 2);
                
                // Draw bottom edge (darker)
                graphics.fillStyle(edgeColors.bottom, 1);
                graphics.fillRect(0, 14, 16, 2);
                
                // Add crack effects for cracking ice platforms
                if (theme === 'arctic' && type === 'crackingIce') {
                    // Main cracks - thicker and more visible
                    graphics.lineStyle(2, 0xFFFFFF, 0.7);  // Thicker white cracks with higher opacity
                    
                    // Create angular crack pattern like shattered ice
                    // Main cracks forming polygonal shapes
                    graphics.lineBetween(4, 2, 6, 8);
                    graphics.lineBetween(6, 8, 3, 14);
                    graphics.lineBetween(6, 8, 11, 10);
                    graphics.lineBetween(11, 10, 13, 14);
                    graphics.lineBetween(11, 10, 14, 4);
                    
                    // Cross cracks for more detail
                    graphics.lineBetween(2, 6, 8, 4);
                    graphics.lineBetween(8, 4, 12, 7);
                    graphics.lineBetween(5, 12, 10, 13);
                    
                    // Thinner detail cracks
                    graphics.lineStyle(1, 0xFFFFFF, 0.5);
                    graphics.lineBetween(7, 2, 9, 5);
                    graphics.lineBetween(3, 10, 7, 11);
                    
                    // Add subtle shadow lines for depth
                    graphics.lineStyle(1, 0x1E5F8E, 0.4);  // Darker blue shadows
                    graphics.lineBetween(4, 3, 6, 9);
                    graphics.lineBetween(11, 11, 13, 15);
                }
                
                // Generate texture with unique key
                const textureKey = platformManager.getTextureKey(theme, type);
                graphics.generateTexture(textureKey, 16, 16);
            });
        });
        
        graphics.destroy();
    }

    createBackgrounds() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const graphics = this.add.graphics();

        const themes = ['beach', 'city', 'ocean', 'harbor', 'arctic'];
        const colors = {
            beach: [0xF4E4C1, 0xE8D4A1],
            city: [0x8B8B8B, 0x6B6B6B],
            ocean: [0x006994, 0x004A6F],
            harbor: [0x7B8D8E, 0x5B6D6E],
            arctic: [0xE0F4FF, 0xC0D8E6]
        };

        themes.forEach(theme => {
            graphics.clear();
            const [color1, color2] = colors[theme];

            // Draw gradient background
            for (let i = 0; i < height; i++) {
                const ratio = i / height;
                const r1 = (color1 >> 16) & 0xFF;
                const g1 = (color1 >> 8) & 0xFF;
                const b1 = color1 & 0xFF;
                const r2 = (color2 >> 16) & 0xFF;
                const g2 = (color2 >> 8) & 0xFF;
                const b2 = color2 & 0xFF;

                const r = Math.floor(r1 + (r2 - r1) * ratio);
                const g = Math.floor(g1 + (g2 - g1) * ratio);
                const b = Math.floor(b1 + (b2 - b1) * ratio);

                graphics.fillStyle((r << 16) | (g << 8) | b, 1);
                graphics.fillRect(0, i, width, 1);
            }

            // Add themed elements
            this.addThemedElements(graphics, theme, width, height);

            graphics.generateTexture(`bg_${theme}`, width, height);
        });

        graphics.destroy();
    }

    addThemedElements(graphics, theme, width, height) {
        const designer = new BackgroundDesigner(graphics, width, height);
        
        switch(theme) {
            case 'beach':
                designer.drawBeachTheme();
                break;

            case 'city':
                designer.drawCityTheme();
                break;

            case 'ocean':
                designer.drawOceanTheme();
                break;

            case 'harbor':
                designer.drawHarborTheme();
                break;

            case 'arctic':
                designer.drawArcticTheme();
                break;
        }
    }

    create() {
        // Launch the global input scene that runs in parallel with all other scenes
        this.scene.launch('GlobalInputScene');
        
        // Start the menu scene
        this.scene.start('MenuScene');
    }
}