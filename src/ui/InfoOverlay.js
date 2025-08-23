import Phaser from 'phaser';

export default class InfoOverlay {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isShowing = false;
    }

    show(levelNumber, theme, info) {
        console.log('[INFO OVERLAY UI] show() called for level', levelNumber, 'theme:', theme);
        if (this.isShowing) {
            console.log('[INFO OVERLAY UI] Already showing - ignoring');
            return;
        }
        this.isShowing = true;
        console.log('[INFO OVERLAY UI] Creating overlay display');

        // Create container for all overlay elements
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000);

        // Semi-transparent background
        const bg = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.8
        );
        this.container.add(bg);

        // Get theme color for panel
        const themeColors = {
            beach: 0xF4E4C1,
            city: 0x5A5A5A,
            ocean: 0x006994,
            harbor: 0x4A5859,
            arctic: 0xA8D5E2
        };
        const panelColor = themeColors[theme] || 0x333333;

        // Main info panel - bigger size
        const panelWidth = 750;
        const panelHeight = 600;
        const panelX = this.scene.cameras.main.width / 2;
        const panelY = this.scene.cameras.main.height / 2;

        const panel = this.scene.add.rectangle(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            panelColor,
            0.95
        );
        panel.setStrokeStyle(4, 0xffffff);
        this.container.add(panel);

        // Determine text colors based on theme
        const isLightTheme = (theme === 'beach');
        const textColor = isLightTheme ? '#000000' : '#ffffff';
        const accentColor = isLightTheme ? '#cc6600' : '#ffff00';
        const creatureColor = isLightTheme ? '#0066cc' : '#00ffff';
        const promptColor = isLightTheme ? '#009900' : '#00ff00';
        
        // Title
        const titleText = this.getThemeTitle(levelNumber, theme);
        const title = this.scene.add.text(
            panelX,
            panelY - panelHeight/2 + 40,
            titleText,
            {
                fontSize: '40px',
                fontFamily: 'monospace',
                color: textColor,
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);
        this.container.add(title);

        // Environment section
        let currentY = panelY - panelHeight/2 + 100;
        
        if (info.environment && info.environment.length > 0) {
            const envTitle = this.scene.add.text(
                panelX - panelWidth/2 + 40,
                currentY,
                'ENVIRONMENT:',
                {
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    color: accentColor,
                    fontStyle: 'bold'
                }
            );
            this.container.add(envTitle);
            currentY += 35;

            info.environment.forEach(feature => {
                const text = this.scene.add.text(
                    panelX - panelWidth/2 + 50,
                    currentY,
                    `• ${feature}`,
                    {
                        fontSize: '20px',
                        fontFamily: 'monospace',
                        color: textColor
                    }
                );
                this.container.add(text);
                currentY += 28;
            });
            currentY += 20;
        }

        // Creatures section
        if (info.creatures && info.creatures.length > 0) {
            const creaturesTitle = this.scene.add.text(
                panelX - panelWidth/2 + 40,
                currentY,
                'CREATURES:',
                {
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    color: accentColor,
                    fontStyle: 'bold'
                }
            );
            this.container.add(creaturesTitle);
            currentY += 35;

            info.creatures.forEach(creature => {
                // Creature name with emoji
                const nameText = this.scene.add.text(
                    panelX - panelWidth/2 + 50,
                    currentY,
                    `${creature.emoji} ${creature.name}`,
                    {
                        fontSize: '22px',
                        fontFamily: 'monospace',
                        color: creatureColor,
                        fontStyle: 'bold'
                    }
                );
                this.container.add(nameText);
                currentY += 32;

                // Creature behaviors
                creature.behaviors.forEach(behavior => {
                    const behaviorText = this.scene.add.text(
                        panelX - panelWidth/2 + 70,
                        currentY,
                        `• ${behavior}`,
                        {
                            fontSize: '18px',
                            fontFamily: 'monospace',
                            color: textColor
                        }
                    );
                    this.container.add(behaviorText);
                    currentY += 25;
                });
                currentY += 10;
            });
        }

        // Start prompt
        const prompt = this.scene.add.text(
            panelX,
            panelY + panelHeight/2 - 45,
            'Press SPACE or I to begin',
            {
                fontSize: '28px',
                fontFamily: 'monospace',
                color: promptColor,
                fontStyle: 'bold'
            }
        );
        prompt.setOrigin(0.5);
        this.container.add(prompt);

        // Blinking animation for prompt
        this.scene.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        // Fade in animation
        this.container.setAlpha(0);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        // Setup space and I key listeners for closing
        this.spaceKey = this.scene.input.keyboard.addKey('SPACE');
        this.iKey = this.scene.input.keyboard.addKey('I');
        
        this.handleSpacePress = () => {
            if (this.spaceKey.isDown) {
                console.log('[INFO OVERLAY UI] Space pressed - hiding overlay');
                this.hide();
            }
        };
        
        this.handleIPress = () => {
            if (this.iKey.isDown) {
                console.log('[INFO OVERLAY UI] I pressed - hiding overlay');
                this.hide();
            }
        };
        
        this.scene.input.keyboard.on('keydown-SPACE', this.handleSpacePress);
        this.scene.input.keyboard.on('keydown-I', this.handleIPress);
    }

    hide(instant = false) {
        console.log('[INFO OVERLAY UI] hide() called, instant:', instant);
        if (!this.isShowing) {
            console.log('[INFO OVERLAY UI] Not showing - ignoring hide request');
            return;
        }

        // Remove space and I key listeners
        if (this.handleSpacePress) {
            this.scene.input.keyboard.off('keydown-SPACE', this.handleSpacePress);
        }
        if (this.handleIPress) {
            this.scene.input.keyboard.off('keydown-I', this.handleIPress);
        }

        if (instant) {
            // Instant hide - no animation
            if (this.container) {
                this.container.destroy();
                this.container = null;
            }
            this.isShowing = false;
            
            // Notify scene that overlay is hidden
            if (this.scene.onInfoOverlayHidden) {
                this.scene.onInfoOverlayHidden();
            }
        } else {
            // Fade out and destroy
            this.scene.tweens.add({
                targets: this.container,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    if (this.container) {
                        this.container.destroy();
                        this.container = null;
                    }
                    this.isShowing = false;
                    
                    // Notify scene that overlay is hidden
                    if (this.scene.onInfoOverlayHidden) {
                        this.scene.onInfoOverlayHidden();
                    }
                }
            });
        }
    }

    getThemeTitle(level, theme) {
        const themeNames = {
            beach: 'BEACH',
            city: 'CITY',
            ocean: 'OCEAN',
            harbor: 'HARBOR',
            arctic: 'ARCTIC ZONE'
        };
        return `LEVEL ${level} - ${themeNames[theme] || theme.toUpperCase()}`;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.isShowing = false;
    }
}