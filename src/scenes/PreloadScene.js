import Phaser from 'phaser';
import { EMOJIS } from '../utils/constants.js';
import PlatformColorManager from '../managers/PlatformColorManager.js';

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
        switch(theme) {
            case 'beach':
                // Sun
                graphics.fillStyle(0xFFDD00, 0.9);
                graphics.fillCircle(width - 150, 150, 60);

                // Palm trees
                graphics.fillStyle(0x8B4513, 1);
                graphics.fillRect(150, height - 200, 20, 150);
                graphics.fillRect(650, height - 180, 20, 130);

                // Palm leaves
                graphics.fillStyle(0x228B22, 1);
                graphics.fillTriangle(160, height - 200, 120, height - 170, 200, height - 170);
                graphics.fillTriangle(660, height - 180, 620, height - 150, 700, height - 150);

                // Wave pattern
                graphics.lineStyle(2, 0x4682B4, 0.5);
                for (let y = height - 60; y < height; y += 15) {
                    graphics.beginPath();
                    graphics.moveTo(0, y);
                    for (let x = 0; x < width; x += 30) {
                        graphics.lineTo(x, y + Math.sin(x * 0.1) * 5);
                    }
                    graphics.strokePath();
                }
                break;

            case 'city':
                // Buildings silhouettes
                graphics.fillStyle(0x4A4A4A, 0.8);
                graphics.fillRect(50, height - 300, 80, 250);
                graphics.fillRect(150, height - 400, 100, 350);
                graphics.fillRect(300, height - 350, 90, 300);
                graphics.fillRect(450, height - 450, 120, 400);
                graphics.fillRect(600, height - 320, 100, 270);
                graphics.fillRect(750, height - 380, 80, 330);

                // Windows
                graphics.fillStyle(0xFFFF99, 0.7);
                for (let b = 0; b < 6; b++) {
                    const bx = [50, 150, 300, 450, 600, 750][b];
                    const by = [height - 300, height - 400, height - 350, height - 450, height - 320, height - 380][b];
                    for (let w = 0; w < 3; w++) {
                        for (let h = 0; h < 8; h++) {
                            if (Math.random() > 0.3) {
                                graphics.fillRect(bx + 10 + w * 25, by + 20 + h * 35, 15, 20);
                            }
                        }
                    }
                }

                // Street lights
                graphics.fillStyle(0xFFFFAA, 0.6);
                graphics.fillCircle(100, height - 50, 15);
                graphics.fillCircle(400, height - 50, 15);
                graphics.fillCircle(700, height - 50, 15);
                break;

            case 'ocean':
                // Waves
                graphics.lineStyle(3, 0x2E86AB, 0.6);
                for (let y = 200; y < height - 100; y += 40) {
                    graphics.beginPath();
                    graphics.moveTo(0, y);
                    for (let x = 0; x < width; x += 20) {
                        graphics.lineTo(x, y + Math.sin(x * 0.05 + y * 0.1) * 10);
                    }
                    graphics.strokePath();
                }

                // Distant ship
                graphics.fillStyle(0x333333, 0.7);
                graphics.fillRect(width - 300, 180, 60, 20);
                graphics.fillTriangle(width - 300, 180, width - 300, 160, width - 280, 180);
                graphics.fillRect(width - 280, 160, 5, 20);
                graphics.fillRect(width - 260, 150, 5, 30);

                // Hawks
                graphics.lineStyle(2, 0xFFFFFF, 0.8);
                const hawks = [[200, 100], [350, 80], [500, 120], [650, 90]];
                hawks.forEach(([x, y]) => {
                    graphics.beginPath();
                    graphics.arc(x - 10, y, 10, 0, Math.PI * 0.5);
                    graphics.strokePath();
                    graphics.beginPath();
                    graphics.arc(x + 10, y, 10, Math.PI * 0.5, Math.PI);
                    graphics.strokePath();
                });
                break;

            case 'harbor':
                // Cranes
                graphics.fillStyle(0xFF6600, 0.8);
                graphics.fillRect(100, height - 250, 10, 200);
                graphics.fillRect(100, height - 250, 80, 10);
                graphics.lineStyle(2, 0xFF6600, 0.8);
                graphics.lineBetween(100, height - 240, 170, height - 200);
                graphics.lineBetween(170, height - 250, 170, height - 200);

                // Containers
                graphics.fillStyle(0xCC0000, 0.9);
                graphics.fillRect(300, height - 80, 100, 40);
                graphics.fillStyle(0x0066CC, 0.9);
                graphics.fillRect(410, height - 80, 100, 40);
                graphics.fillStyle(0x00CC00, 0.9);
                graphics.fillRect(520, height - 80, 100, 40);
                graphics.fillStyle(0xFFCC00, 0.9);
                graphics.fillRect(355, height - 120, 100, 40);

                // Dock
                graphics.fillStyle(0x8B7355, 1);
                graphics.fillRect(0, height - 40, width, 40);

                // Water reflections
                graphics.lineStyle(1, 0x4A90E2, 0.4);
                for (let x = 0; x < width; x += 40) {
                    graphics.lineBetween(x, height - 40, x + 20, height - 30);
                }
                break;

            case 'arctic':
                // Aurora borealis effect
                const auroraColors = [0x00FF00, 0x00FFFF, 0xFF00FF];
                for (let i = 0; i < 3; i++) {
                    graphics.fillStyle(auroraColors[i], 0.15);
                    graphics.beginPath();
                    graphics.moveTo(0, 50 + i * 30);
                    for (let x = 0; x <= width; x += 20) {
                        const y = 80 + i * 40 + Math.sin(x * 0.01) * 30;
                        graphics.lineTo(x, y);
                    }
                    graphics.lineTo(width, 0);
                    graphics.lineTo(0, 0);
                    graphics.closePath();
                    graphics.fillPath();
                }

                // Floating icebergs
                graphics.fillStyle(0xCCE5FF, 0.9);
                graphics.fillTriangle(150, height - 150, 100, height - 80, 200, height - 80);
                graphics.fillTriangle(500, height - 120, 450, height - 60, 550, height - 60);
                graphics.fillTriangle(800, height - 140, 750, height - 70, 850, height - 70);
                
                // Iceberg shading
                graphics.fillStyle(0xA8D5E2, 0.6);
                graphics.fillTriangle(150, height - 150, 150, height - 80, 200, height - 80);
                graphics.fillTriangle(500, height - 120, 500, height - 60, 550, height - 60);
                graphics.fillTriangle(800, height - 140, 800, height - 70, 850, height - 70);

                // Snow particles (static for background)
                graphics.fillStyle(0xFFFFFF, 0.8);
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 2 + 1;
                    graphics.fillCircle(x, y, size);
                }

                // Distant mountains
                graphics.fillStyle(0x9AC0CD, 0.5);
                graphics.fillTriangle(0, height - 50, 200, height - 300, 400, height - 50);
                graphics.fillTriangle(300, height - 50, 500, height - 250, 700, height - 50);
                graphics.fillTriangle(600, height - 50, 800, height - 280, 1000, height - 50);

                // Ice sheet at bottom
                graphics.fillStyle(0xE6F3FF, 1);
                graphics.fillRect(0, height - 50, width, 50);
                
                // Ice cracks
                graphics.lineStyle(1, 0x8AC4D0, 0.5);
                for (let i = 0; i < 5; i++) {
                    const startX = Math.random() * width;
                    graphics.beginPath();
                    graphics.moveTo(startX, height - 50);
                    graphics.lineTo(startX + Math.random() * 100 - 50, height - 25);
                    graphics.lineTo(startX + Math.random() * 100 - 50, height);
                    graphics.strokePath();
                }
                break;
        }
    }

    create() {
        this.scene.start('MenuScene');
    }
}