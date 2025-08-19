// Palm Tree Visual Test
// This test captures screenshots of palm trees for iterative improvement

import { test } from '@playwright/test';
import { initializeGame, startGameFromMenu, handleInfoOverlay, waitForGameReady } from './utils/gameHelpers.js';
import { takeScreenshot } from './utils/screenshot.js';

test('Capture palm tree screenshot - Iteration 1', async ({ page }) => {
    // Set viewport to fullscreen-like size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Initialize and start the game
    await initializeGame(page);
    
    // Start game from menu
    await startGameFromMenu(page);
    
    // Handle info overlay (appears on level 1)
    await handleInfoOverlay(page);
    
    // Wait for game to be fully ready
    await waitForGameReady(page);
    
    // Wait a bit more for scene to settle completely
    await page.waitForTimeout(2000);
    
    // Take screenshot of the game canvas
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = await takeScreenshot(page, `palm-tree-final-${timestamp}`);
    
    if (screenshotPath) {
        console.log('Palm tree screenshot captured successfully');
        console.log(`Screenshot saved to tests/screenshots/`);
    } else {
        console.log('Screenshots skipped (set SKIP_SCREENSHOTS=false to enable)');
    }
});