const { test, expect } = require('@playwright/test');
const path = require('path');
const { takeScreenshot, takeCanvasScreenshot } = require('./utils/screenshot');
const { focusCanvas, pressKey, holdKey, initializeGame, getGameState, startGameWithInfoOverlay } = require('./utils/gameHelpers');
const { findEmoji, analyzeGameState } = require('./utils/imageAnalysis');

test.describe('Seal of Approval Game Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Initialize the game
        await initializeGame(page);
    });
    
    test('can start the game and find the seal', async ({ page }) => {
        // Take screenshot of menu
        await page.waitForTimeout(2000);
        const menuScreenshot = await takeScreenshot(page, 'menu');
        console.log('Menu screenshot saved:', menuScreenshot);
        
        // Start the game and handle info overlay
        await startGameWithInfoOverlay(page);
        
        // Take screenshot of the game
        const gameScreenshot = await takeScreenshot(page, 'game-start');
        console.log('Game screenshot saved:', gameScreenshot);
        
        // Get game state to verify seal position
        const gameState = await getGameState(page);
        console.log('Game state:', gameState);
        
        // Verify we're in the GameScene
        expect(gameState.activeScenes).toContain('GameScene');
        
        // Verify player exists
        expect(gameState.player).toBeTruthy();
        expect(gameState.player.x).toBeCloseTo(200, -1);
        
        // Analyze the screenshot to find the seal (mock analysis)
        const sealFound = await findEmoji(gameScreenshot, '🦭');
        expect(sealFound.found).toBe(true);
        
        console.log('Seal found at position:', sealFound.position);
    });
    
    test('can move the seal with arrow keys', async ({ page }) => {
        // Start the game and handle info overlay
        await startGameWithInfoOverlay(page);
        
        // Get initial state
        const initialState = await getGameState(page);
        
        // Verify player exists before accessing properties
        expect(initialState.player).toBeTruthy();
        const initialX = initialState.player.x;
        
        // Take initial screenshot
        const initialScreenshot = await takeScreenshot(page, 'before-movement');
        
        // Move right for 1 second
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(1000);
        await page.keyboard.up('ArrowRight');
        
        // Get state after movement
        const afterMoveState = await getGameState(page);
        const afterX = afterMoveState.player.x;
        
        // Take screenshot after movement
        const afterMoveScreenshot = await takeScreenshot(page, 'after-movement');
        
        // Verify the seal moved right
        expect(afterX).toBeGreaterThan(initialX);
        
        console.log('Initial seal X position:', initialX);
        console.log('After movement X position:', afterX);
        console.log('Distance moved:', afterX - initialX);
    });
    
    test('can make the seal jump with spacebar', async ({ page }) => {
        // Start the game and handle info overlay
        await startGameWithInfoOverlay(page);
        
        // Wait for seal to be on ground before testing jump
        await page.waitForFunction(() => {
            if (!window.game || !window.game.scene) return false;
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player || !gameScene.player.sprite || !gameScene.player.sprite.body) {
                return false;
            }
            // Check if seal is on ground (blocked.down means standing on something)
            return gameScene.player.sprite.body.blocked.down;
        }, { timeout: 5000 });
        
        // Get initial state
        const initialState = await getGameState(page);
        
        // Verify player exists before accessing properties
        expect(initialState.player).toBeTruthy();
        const initialY = initialState.player.y;
        
        // Take initial screenshot
        const initialScreenshot = await takeScreenshot(page, 'before-jump');
        
        // Jump - need to wait a bit after pressing to catch the upward motion
        await pressKey(page, 'Space');
        await page.waitForTimeout(200); // Shorter wait to catch the upward motion
        
        // Get state during jump
        const jumpState = await getGameState(page);
        const jumpY = jumpState.player.y;
        
        // Take screenshot during jump
        const jumpScreenshot = await takeScreenshot(page, 'during-jump');
        
        // Verify the seal jumped (y position should be lower - canvas origin is top-left)
        expect(jumpY).toBeLessThan(initialY);
        
        console.log('Initial seal Y position:', initialY);
        console.log('Jump Y position:', jumpY);
        console.log('Jump height:', initialY - jumpY);
        
        // Wait for seal to land
        await page.waitForTimeout(1500);
        
        // Get state after landing
        const landedState = await getGameState(page);
        const landedY = landedState.player.y;
        
        // Verify seal returned to ground (approximately)
        expect(landedY).toBeCloseTo(initialY, 0);
        
        console.log('Landed Y position:', landedY);
    });
    
    test('can take canvas-only screenshots', async ({ page }) => {
        // Start the game and handle info overlay
        await startGameWithInfoOverlay(page);
        
        // Take canvas screenshot
        const canvasScreenshot = await takeCanvasScreenshot(page, 'canvas-test');
        console.log('Canvas screenshot saved:', canvasScreenshot);
        
        // Verify canvas exists
        const canvas = await page.locator('canvas');
        await expect(canvas).toBeVisible();
        
        // Get canvas dimensions - may be scaled by browser
        const canvasBounds = await canvas.boundingBox();
        expect(canvasBounds.width).toBeGreaterThan(1000);
        expect(canvasBounds.height).toBeGreaterThan(700);
        
        console.log('Canvas dimensions:', canvasBounds);
    });
    
    test('seal sits flush on platforms without floating', async ({ page }) => {
        // Start the game and handle info overlay
        await startGameWithInfoOverlay(page);
        
        // Wait for seal to be on ground
        await page.waitForFunction(() => {
            if (!window.game || !window.game.scene) return false;
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player || !gameScene.player.sprite || !gameScene.player.sprite.body) {
                return false;
            }
            // Check if seal is on ground (blocked.down means standing on something)
            return gameScene.player.sprite.body.blocked.down;
        }, { timeout: 5000 });
        
        // Get detailed game state including platform info
        const gameState = await getGameState(page);
        
        // Verify player and platform data exists
        expect(gameState.player).toBeTruthy();
        expect(gameState.platforms).toBeTruthy();
        expect(gameState.platforms.length).toBeGreaterThan(0);
        
        // Check if we have platform detection
        if (gameState.player.platformTopY !== undefined) {
            console.log('Platform top Y:', gameState.player.platformTopY);
            console.log('Player Y:', gameState.player.y);
            console.log('Expected Y:', gameState.player.expectedY);
            console.log('Floating distance:', gameState.player.floatingDistance);
            
            // With offsetY=2, seal sits visually flush on platform
            // Visual center is 15px above platform due to emoji padding
            expect(gameState.player.floatingDistance).toBeLessThan(1); // Less than 1 pixel floating
            
            // Verify the seal Y matches expected position
            expect(gameState.player.y).toBeCloseTo(gameState.player.expectedY, 0);
        }
        
        // Additional check: verify physics body positioning
        if (gameState.player.bodyY !== null) {
            console.log('Physics body Y:', gameState.player.bodyY);
            console.log('Physics body height:', gameState.player.bodyHeight);
            
            // The physics body bottom should touch the platform
            const bodyBottom = gameState.player.bodyY + gameState.player.bodyHeight;
            if (gameState.player.platformTopY !== undefined) {
                console.log('Body bottom:', bodyBottom);
                console.log('Platform top:', gameState.player.platformTopY);
                
                // Body bottom should be at or very close to platform top
                expect(Math.abs(bodyBottom - gameState.player.platformTopY)).toBeLessThan(2);
            }
        }
        
        // Take a screenshot for visual verification
        const screenshot = await takeScreenshot(page, 'seal-on-platform');
        console.log('Screenshot saved for visual verification:', screenshot);
        
        // Move the seal and let it settle again to test consistency
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.up('ArrowRight');
        await page.waitForTimeout(2000); // Wait for seal to settle
        
        // Check position again after movement
        const afterMoveState = await getGameState(page);
        if (afterMoveState.player.floatingDistance !== undefined) {
            console.log('Floating distance after movement:', afterMoveState.player.floatingDistance);
            expect(afterMoveState.player.floatingDistance).toBeLessThan(1);
        }
    });
    
    test('shows info overlay on level 1 and can be dismissed', async ({ page }) => {
        // Wait for menu to be ready
        await page.waitForTimeout(2000);
        
        // Take screenshot of menu
        const menuScreenshot = await takeScreenshot(page, 'menu-before-start');
        console.log('Menu screenshot saved:', menuScreenshot);
        
        // Focus canvas and press space to start from menu
        await focusCanvas(page);
        await pressKey(page, 'Space');
        
        // Wait for GameScene to load
        await page.waitForTimeout(1000);
        
        // Wait for scene transition to GameScene
        await page.waitForFunction(() => {
            if (!window.game || !window.game.scene) return false;
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            return activeScenes.some(scene => scene.scene.key === 'GameScene');
        }, { timeout: 5000 });
        
        // Verify info overlay is showing
        const isInfoShowing = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            return gameScene && gameScene.infoOverlay && gameScene.infoOverlay.isShowing;
        });
        
        expect(isInfoShowing).toBe(true);
        console.log('Info overlay is showing as expected');
        
        // Take screenshot of info overlay
        const overlayScreenshot = await takeScreenshot(page, 'info-overlay');
        console.log('Info overlay screenshot saved:', overlayScreenshot);
        
        // Verify game is paused while overlay is showing
        const isPaused = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            return gameScene && !gameScene.isLevelStarted;
        });
        
        expect(isPaused).toBe(true);
        console.log('Game is paused while info overlay is showing');
        
        // Wait a bit for overlay to be fully visible
        await page.waitForTimeout(500);
        
        // Press space to dismiss the overlay
        await pressKey(page, 'Space');
        
        // Wait for overlay to fade out
        await page.waitForTimeout(500);
        
        // Verify overlay is now hidden
        const isInfoHidden = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            return gameScene && gameScene.infoOverlay && !gameScene.infoOverlay.isShowing;
        });
        
        expect(isInfoHidden).toBe(true);
        console.log('Info overlay has been dismissed');
        
        // Verify game has started
        const isStarted = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            return gameScene && gameScene.isLevelStarted;
        });
        
        expect(isStarted).toBe(true);
        console.log('Game has started after dismissing overlay');
        
        // Verify player is ready and game is playable
        const gameState = await getGameState(page);
        expect(gameState.player).toBeTruthy();
        expect(gameState.activeScenes).toContain('GameScene');
        
        // Take screenshot to verify game is running
        const gameScreenshot = await takeScreenshot(page, 'game-after-overlay');
        console.log('Game screenshot after overlay dismissal:', gameScreenshot);
    });
});