/**
 * Helper functions for interacting with the game using Playwright
 */

/**
 * Focuses the canvas element to ensure keyboard events reach the game
 * @param {Page} page - Playwright page object
 */
async function focusCanvas(page) {
    // Click on the canvas to give it focus
    await page.locator('canvas').click();
    // Also try to explicitly focus it
    await page.locator('canvas').focus();
    await page.waitForTimeout(100); // Small delay to ensure focus is set
}

/**
 * Presses a key and waits for the game to process it
 * @param {Page} page - Playwright page object
 * @param {string} key - Key to press (e.g., 'Space', 'ArrowRight')
 * @param {number} duration - How long to hold the key (optional)
 */
async function pressKey(page, key, duration = 50) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50); // Small delay for game to process
}

/**
 * Holds a key down for a specific duration
 * @param {Page} page - Playwright page object
 * @param {string} key - Key to hold
 * @param {number} duration - Duration to hold in milliseconds
 */
async function holdKey(page, key, duration) {
    await page.keyboard.down(key);
    await page.waitForTimeout(duration);
    await page.keyboard.up(key);
}

/**
 * Waits for the game to fully load (canvas appears and is ready)
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForGameLoad(page, timeout = 15000) {
    // Wait for canvas element
    await page.waitForSelector('canvas', { timeout });
    
    // Try to wait for Phaser game to initialize
    // If window.game doesn't exist, just check for canvas readiness
    try {
        await page.waitForFunction(() => {
            // Check if game exists and is booted, or just check if canvas is ready
            if (window.game && window.game.isBooted) {
                return true;
            }
            // Fallback: check if canvas has content (non-empty)
            const canvas = document.querySelector('canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, 1, 1);
                // If canvas has been drawn to, it's likely ready
                return imageData.data.some(pixel => pixel !== 0);
            }
            return false;
        }, { timeout: 5000 }); // Shorter timeout for game check
    } catch (e) {
        // If game check fails, just ensure canvas exists
        console.log('Game object not found, proceeding with canvas check only');
    }
    
    // Additional wait to ensure scene is ready
    await page.waitForTimeout(1000);
    
    console.log('Game loaded successfully');
}

/**
 * Gets the current game state information
 * @param {Page} page - Playwright page object
 * @returns {Object} Game state information
 */
async function getGameState(page) {
    return await page.evaluate(() => {
        if (!window.game || !window.game.scene) {
            return { error: 'Game not initialized' };
        }
        
        const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
        const sceneKeys = activeScenes.map(scene => scene.scene.key);
        
        // Try to get player information if in GameScene
        let playerInfo = null;
        const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
        if (gameScene && gameScene.player) {
            playerInfo = {
                x: gameScene.player.sprite.x,
                y: gameScene.player.sprite.y,
                lives: gameScene.player.lives,
                invincible: gameScene.player.invincible,
                developerMode: gameScene.player.developerMode
            };
        }
        
        return {
            activeScenes: sceneKeys,
            player: playerInfo,
            timestamp: Date.now()
        };
    });
}

/**
 * Activates developer mode in the game
 * @param {Page} page - Playwright page object
 */
async function activateDeveloperMode(page) {
    // Press 'D' twice quickly to activate developer menu
    await pressKey(page, 'KeyD');
    await page.waitForTimeout(50);
    await pressKey(page, 'KeyD');
    await page.waitForTimeout(500);
    
    // Press Enter to activate God Mode (first option)
    await pressKey(page, 'Enter');
    await page.waitForTimeout(200);
    
    console.log('Developer mode activated');
}

/**
 * Waits for a specific scene to be active
 * @param {Page} page - Playwright page object
 * @param {string} sceneName - Name of the scene to wait for
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForScene(page, sceneName, timeout = 10000) {
    await page.waitForFunction(
        (name) => {
            if (window.game && window.game.scene && window.game.scene.scenes) {
                const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
                return activeScenes.some(scene => scene.scene.key === name);
            }
            return false;
        },
        sceneName,
        { timeout }
    );
}

/**
 * Gets the current score from the game
 * @param {Page} page - Playwright page object
 * @returns {number} Current score
 */
async function getScore(page) {
    return await page.evaluate(() => {
        const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
        const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
        if (gameScene && gameScene.scoreManager) {
            return gameScene.scoreManager.score;
        }
        return 0;
    });
}

/**
 * Gets all enemies on screen
 * @param {Page} page - Playwright page object
 * @returns {Array} Array of enemy positions and types
 */
async function getEnemies(page) {
    return await page.evaluate(() => {
        const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
        const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
        if (gameScene && gameScene.enemies) {
            return gameScene.enemies.children.entries.map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                type: enemy.enemyType,
                active: enemy.active
            }));
        }
        return [];
    });
}

/**
 * Pauses the game
 * @param {Page} page - Playwright page object
 */
async function pauseGame(page) {
    await pressKey(page, 'KeyP');
    await page.waitForTimeout(100);
}

/**
 * Resumes the game from pause
 * @param {Page} page - Playwright page object
 */
async function resumeGame(page) {
    await pressKey(page, 'KeyP');
    await page.waitForTimeout(100);
}

module.exports = {
    focusCanvas,
    pressKey,
    holdKey,
    waitForGameLoad,
    getGameState,
    activateDeveloperMode,
    waitForScene,
    getScore,
    getEnemies,
    pauseGame,
    resumeGame
};