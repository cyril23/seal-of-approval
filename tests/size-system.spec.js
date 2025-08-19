import { test, expect } from '@playwright/test';
import { initializeGame, startGameWithInfoOverlay } from './utils/gameHelpers.js';
import { takeScreenshot } from './utils/screenshot.js';

test.describe('Size System Tests', () => {
    test('seal grows and shrinks with proper visual scaling and platform alignment', async ({ page }) => {
        // Set bigger viewport
        await page.setViewportSize({ width: 1600, height: 1200 });
        
        // Initialize game
        await initializeGame(page);
        
        // Start game from menu, handle info overlay, and wait for ready
        await startGameWithInfoOverlay(page);
        
        // Wait for seal to be on ground
        await page.waitForFunction(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player || !gameScene.player.sprite || !gameScene.player.sprite.body) {
                return false;
            }
            return gameScene.player.sprite.body.blocked.down;
        }, { timeout: 5000 });
        
        // Verify initial size 1
        const initialState = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player) return null;
            
            return {
                size: gameScene.player.currentSize,
                scale: gameScene.player.sprite.scale,
                y: gameScene.player.sprite.y,
                bodyBottom: gameScene.player.sprite.body.bottom,
                onGround: gameScene.player.sprite.body.blocked.down || gameScene.player.sprite.body.touching.down
            };
        });
        
        console.log('Initial state (Size 1):', initialState);
        expect(initialState.size).toBe(1);
        expect(initialState.scale).toBe(1.5);
        expect(initialState.onGround).toBe(true);
        
        // Capture screenshot at size 1
        await takeScreenshot(page, 'test-size-1.png');
        console.log('Screenshot captured: Size 1');
        
        // Grow to size 2
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.player) {
                console.log('Growing seal to size 2...');
                gameScene.player.growSize();
            }
        });
        
        // Wait for animation to complete
        await page.waitForTimeout(1000);
        
        // Verify size 2
        const size2State = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player) return null;
            
            return {
                size: gameScene.player.currentSize,
                scale: gameScene.player.sprite.scale,
                y: gameScene.player.sprite.y,
                bodyBottom: gameScene.player.sprite.body.bottom,
                onGround: gameScene.player.sprite.body.blocked.down || gameScene.player.sprite.body.touching.down
            };
        });
        
        console.log('State after growth (Size 2):', size2State);
        expect(size2State.size).toBe(2);
        expect(size2State.scale).toBe(2.0);
        expect(size2State.onGround).toBe(true);
        
        // Capture screenshot at size 2
        await takeScreenshot(page, 'test-size-2.png');
        console.log('Screenshot captured: Size 2');
        
        // Grow to size 3
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.player) {
                console.log('Growing seal to size 3...');
                gameScene.player.growSize();
            }
        });
        
        // Wait for animation to complete
        await page.waitForTimeout(1000);
        
        // Verify size 3
        const size3State = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player) return null;
            
            return {
                size: gameScene.player.currentSize,
                scale: gameScene.player.sprite.scale,
                y: gameScene.player.sprite.y,
                bodyBottom: gameScene.player.sprite.body.bottom,
                onGround: gameScene.player.sprite.body.blocked.down || gameScene.player.sprite.body.touching.down
            };
        });
        
        console.log('State after growth (Size 3):', size3State);
        expect(size3State.size).toBe(3);
        expect(size3State.scale).toBe(3.0);
        expect(size3State.onGround).toBe(true);
        
        // Capture screenshot at size 3
        await takeScreenshot(page, 'test-size-3.png');
        console.log('Screenshot captured: Size 3');
        
        // Shrink back to size 2
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.player) {
                console.log('Shrinking seal back to size 2...');
                gameScene.player.shrinkSize();
            }
        });
        
        // Wait for animation to complete
        await page.waitForTimeout(1000);
        
        // Verify shrunk to size 2
        const shrunkState = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (!gameScene || !gameScene.player) return null;
            
            return {
                size: gameScene.player.currentSize,
                scale: gameScene.player.sprite.scale,
                y: gameScene.player.sprite.y,
                bodyBottom: gameScene.player.sprite.body.bottom,
                onGround: gameScene.player.sprite.body.blocked.down || gameScene.player.sprite.body.touching.down
            };
        });
        
        console.log('State after shrinking (Size 2):', shrunkState);
        expect(shrunkState.size).toBe(2);
        expect(shrunkState.scale).toBe(2.0);
        expect(shrunkState.onGround).toBe(true);
        
        // Capture screenshot after shrinking
        await takeScreenshot(page, 'test-size-2-after-shrink.png');
        console.log('Screenshot captured: Size 2 after shrinking');
        
        // Verify seal stays on platform at all sizes
        console.log('\n=== Platform Alignment Summary ===');
        console.log(`Size 1: Y=${initialState.y.toFixed(0)}, Bottom=${initialState.bodyBottom.toFixed(0)}, On Ground=${initialState.onGround}`);
        console.log(`Size 2: Y=${size2State.y.toFixed(0)}, Bottom=${size2State.bodyBottom.toFixed(0)}, On Ground=${size2State.onGround}`);
        console.log(`Size 3: Y=${size3State.y.toFixed(0)}, Bottom=${size3State.bodyBottom.toFixed(0)}, On Ground=${size3State.onGround}`);
        console.log(`Size 2 (shrunk): Y=${shrunkState.y.toFixed(0)}, Bottom=${shrunkState.bodyBottom.toFixed(0)}, On Ground=${shrunkState.onGround}`);
        
        // All states should show seal on ground
        expect(initialState.onGround).toBe(true);
        expect(size2State.onGround).toBe(true);
        expect(size3State.onGround).toBe(true);
        expect(shrunkState.onGround).toBe(true);
        
        console.log('\n✅ All size transitions completed successfully with proper platform alignment!');
    });
});