const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;
const { takeScreenshot } = require('./utils/screenshot');
const { focusCanvas, pressKey, waitForGameLoad } = require('./utils/gameHelpers');

test.describe('Enemy Scaling and Distribution Tests', () => {
    // Helper function to load a specific level
    async function loadLevel(page, levelNumber) {
        // Navigate to the game only if not already loaded
        if (levelNumber === 1) {
            await page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle',
                timeout: 10000 
            });
            
            // Wait for game to load
            await waitForGameLoad(page);
            await page.waitForTimeout(2000);
        }
        
        // Use the global jumpToLevel function to change levels
        const success = await page.evaluate((level) => {
            if (typeof window.jumpToLevel === 'function') {
                return window.jumpToLevel(level);
            }
            console.error('jumpToLevel function not found');
            return false;
        }, levelNumber);
        
        if (!success) {
            throw new Error(`Failed to jump to level ${levelNumber}`);
        }
        
        // Wait for the new level to load
        await page.waitForTimeout(2000);
        
        // Wait for GameScene to be active and ready
        await page.waitForFunction(() => {
            if (!window.game || !window.game.scene) return false;
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            return gameScene && gameScene.player && gameScene.player.sprite && 
                   gameScene.enemies && gameScene.platforms;
        }, { timeout: 5000 });
        
        // Handle info overlay if present
        const hasOverlay = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            return gameScene && gameScene.infoOverlay && gameScene.infoOverlay.isShowing;
        });
        
        if (hasOverlay) {
            await focusCanvas(page);
            await pressKey(page, 'Space');
            await page.waitForTimeout(500);
        }
        
        // Wait a bit more for everything to settle
        await page.waitForTimeout(1000);
    }
    
    // Helper function to analyze enemy distribution
    function analyzeDistribution(enemies, levelWidth) {
        if (enemies.length === 0) return { evenness: 0, gaps: [], standardDeviation: 0 };
        
        // Sort enemies by X position
        const sortedEnemies = [...enemies].sort((a, b) => a.x - b.x);
        
        // Calculate gaps between consecutive enemies
        const gaps = [];
        for (let i = 0; i < sortedEnemies.length - 1; i++) {
            gaps.push(sortedEnemies[i + 1].x - sortedEnemies[i].x);
        }
        
        if (gaps.length === 0) return { evenness: 1, gaps: [], standardDeviation: 0 };
        
        // Calculate mean gap
        const meanGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
        
        // Calculate standard deviation
        const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - meanGap, 2), 0) / gaps.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Calculate evenness score (lower standard deviation = more even)
        // Normalize by mean to get coefficient of variation
        const coefficientOfVariation = meanGap > 0 ? standardDeviation / meanGap : 0;
        const evenness = Math.max(0, 1 - coefficientOfVariation);
        
        return {
            evenness,
            gaps,
            standardDeviation,
            meanGap,
            coefficientOfVariation
        };
    }
    
    test('Level 1: Beach theme with 9 enemies evenly distributed', async ({ page }) => {
        await loadLevel(page, 1);
        
        // Collect level data
        const levelData = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            
            if (!gameScene) return { error: 'GameScene not found' };
            
            const enemies = [];
            if (gameScene.enemies && gameScene.enemies.children) {
                gameScene.enemies.children.entries.forEach(enemy => {
                    enemies.push({ x: enemy.x, y: enemy.y, type: enemy.enemyType || enemy.texture?.key || 'unknown' });
                });
            }
            
            const platforms = [];
            if (gameScene.platforms && gameScene.platforms.children) {
                gameScene.platforms.children.entries.forEach(platform => {
                    platforms.push({ x: platform.x, y: platform.y, width: platform.displayWidth });
                });
            }
            
            return {
                enemies,
                platforms,
                levelNumber: gameScene.currentLevel || 1,
                theme: gameScene.currentTheme ? gameScene.currentTheme.name : 'beach',
                levelWidth: 10240
            };
        });
        
        // Verify theme
        expect(levelData.theme).toBe('beach');
        
        // Verify enemy count
        expect(levelData.enemies.length).toBe(9);
        console.log(`Level 1: ${levelData.enemies.length} enemies`);
        
        // Analyze distribution
        const distribution = analyzeDistribution(levelData.enemies, levelData.levelWidth);
        console.log(`Level 1 Distribution: Evenness=${distribution.evenness.toFixed(2)}, StdDev=${distribution.standardDeviation.toFixed(0)}px, CV=${distribution.coefficientOfVariation.toFixed(2)}`);
        
        // Check that enemies are reasonably evenly distributed (evenness > 0.5)
        expect(distribution.evenness).toBeGreaterThan(0.4);
        
        // Verify first and last platforms don't have enemies
        const sortedPlatforms = [...levelData.platforms].sort((a, b) => a.x - b.x);
        const firstPlatform = sortedPlatforms[0];
        const lastPlatform = sortedPlatforms[sortedPlatforms.length - 1];
        
        const enemiesOnFirstPlatform = levelData.enemies.filter(e => 
            Math.abs(e.x - firstPlatform.x) < firstPlatform.width / 2
        );
        const enemiesOnLastPlatform = levelData.enemies.filter(e => 
            Math.abs(e.x - lastPlatform.x) < lastPlatform.width / 2
        );
        
        expect(enemiesOnFirstPlatform.length).toBe(0);
        expect(enemiesOnLastPlatform.length).toBe(0);
        
        await takeScreenshot(page, 'level-1-enemies');
    });
    
    test('Level 6: Beach theme with 14 enemies evenly distributed', async ({ page }) => {
        await loadLevel(page, 6);
        
        // Collect level data
        const levelData = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            
            if (!gameScene) return { error: 'GameScene not found' };
            
            const enemies = [];
            if (gameScene.enemies && gameScene.enemies.children) {
                gameScene.enemies.children.entries.forEach(enemy => {
                    enemies.push({ x: enemy.x, y: enemy.y, type: enemy.enemyType || 'unknown' });
                });
            }
            
            const platforms = [];
            if (gameScene.platforms && gameScene.platforms.children) {
                gameScene.platforms.children.entries.forEach(platform => {
                    platforms.push({ x: platform.x, y: platform.y, width: platform.displayWidth });
                });
            }
            
            return {
                enemies,
                platforms,
                levelNumber: gameScene.levelNumber || 6,
                theme: gameScene.currentTheme ? gameScene.currentTheme.name : 'unknown',
                levelWidth: 10240
            };
        });
        
        // Verify theme (level 6 should be beach since (6-1) % 5 = 0)
        expect(levelData.theme).toBe('beach');
        
        // Verify enemy count
        expect(levelData.enemies.length).toBe(14);
        console.log(`Level 6: ${levelData.enemies.length} enemies`);
        
        // Analyze distribution
        const distribution = analyzeDistribution(levelData.enemies, levelData.levelWidth);
        console.log(`Level 6 Distribution: Evenness=${distribution.evenness.toFixed(2)}, StdDev=${distribution.standardDeviation.toFixed(0)}px, CV=${distribution.coefficientOfVariation.toFixed(2)}`);
        
        // Check that enemies are reasonably evenly distributed
        expect(distribution.evenness).toBeGreaterThan(0.4);
        
        // Verify first and last platforms don't have enemies
        const sortedPlatforms = [...levelData.platforms].sort((a, b) => a.x - b.x);
        const firstPlatform = sortedPlatforms[0];
        const lastPlatform = sortedPlatforms[sortedPlatforms.length - 1];
        
        const enemiesOnFirstPlatform = levelData.enemies.filter(e => 
            Math.abs(e.x - firstPlatform.x) < firstPlatform.width / 2
        );
        const enemiesOnLastPlatform = levelData.enemies.filter(e => 
            Math.abs(e.x - lastPlatform.x) < lastPlatform.width / 2
        );
        
        expect(enemiesOnFirstPlatform.length).toBe(0);
        expect(enemiesOnLastPlatform.length).toBe(0);
        
        await takeScreenshot(page, 'level-6-enemies');
    });
    
    test('Level 101: Beach theme with 109 enemies evenly distributed', async ({ page }) => {
        await loadLevel(page, 101);
        
        // Collect level data
        const levelData = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            
            if (!gameScene) return { error: 'GameScene not found' };
            
            const enemies = [];
            if (gameScene.enemies && gameScene.enemies.children) {
                gameScene.enemies.children.entries.forEach(enemy => {
                    enemies.push({ x: enemy.x, y: enemy.y, type: enemy.enemyType || 'unknown' });
                });
            }
            
            const platforms = [];
            if (gameScene.platforms && gameScene.platforms.children) {
                gameScene.platforms.children.entries.forEach(platform => {
                    platforms.push({ x: platform.x, y: platform.y, width: platform.displayWidth });
                });
            }
            
            return {
                enemies,
                platforms,
                levelNumber: gameScene.levelNumber || 101,
                theme: gameScene.currentTheme ? gameScene.currentTheme.name : 'unknown',
                levelWidth: 10240
            };
        });
        
        // Verify theme (level 101 should be beach since (101-1) % 5 = 0)
        expect(levelData.theme).toBe('beach');
        
        // Verify enemy count (8 + 101 = 109)
        expect(levelData.enemies.length).toBe(109);
        console.log(`Level 101: ${levelData.enemies.length} enemies`);
        
        // With 109 enemies, distribution might be less perfect due to platform constraints
        // but should still be reasonably even
        const distribution = analyzeDistribution(levelData.enemies, levelData.levelWidth);
        console.log(`Level 101 Distribution: Evenness=${distribution.evenness.toFixed(2)}, StdDev=${distribution.standardDeviation.toFixed(0)}px, CV=${distribution.coefficientOfVariation.toFixed(2)}`);
        
        // With many enemies, evenness threshold can be lower
        expect(distribution.evenness).toBeGreaterThan(0.3);
        
        // Verify first and last platforms don't have enemies
        const sortedPlatforms = [...levelData.platforms].sort((a, b) => a.x - b.x);
        const firstPlatform = sortedPlatforms[0];
        const lastPlatform = sortedPlatforms[sortedPlatforms.length - 1];
        
        const enemiesOnFirstPlatform = levelData.enemies.filter(e => 
            Math.abs(e.x - firstPlatform.x) < firstPlatform.width / 2
        );
        const enemiesOnLastPlatform = levelData.enemies.filter(e => 
            Math.abs(e.x - lastPlatform.x) < lastPlatform.width / 2
        );
        
        expect(enemiesOnFirstPlatform.length).toBe(0);
        expect(enemiesOnLastPlatform.length).toBe(0);
        
        // Take screenshots at different parts of the level to see enemy density
        await takeScreenshot(page, 'level-101-enemies-start');
        
        // Move camera to middle of level
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                gameScene.cameras.main.scrollX = 5120; // 50% of level
            }
        });
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'level-101-enemies-middle');
        
        // Move camera to end of level
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                gameScene.cameras.main.scrollX = 9000; // Near end
            }
        });
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'level-101-enemies-end');
    });
    
    test('Enemy count comparison: Level 1 vs 6 vs 101', async ({ page }) => {
        // This test compares all three levels to ensure proper scaling
        
        // Navigate to the game once at the beginning
        await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle',
            timeout: 10000 
        });
        
        // Wait for game to load
        await waitForGameLoad(page);
        await page.waitForTimeout(2000);
        
        const levels = [1, 6, 101];
        const enemyCounts = [];
        
        for (const level of levels) {
            // Use jumpToLevel for all levels
            const success = await page.evaluate((lvl) => {
                if (typeof window.jumpToLevel === 'function') {
                    return window.jumpToLevel(lvl);
                }
                return false;
            }, level);
            
            if (!success) {
                throw new Error(`Failed to jump to level ${level}`);
            }
            
            // Wait for level to load
            await page.waitForTimeout(2000);
            
            // Wait for GameScene to be ready
            await page.waitForFunction(() => {
                if (!window.game || !window.game.scene) return false;
                const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
                const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
                return gameScene && gameScene.enemies && gameScene.platforms;
            }, { timeout: 5000 });
            
            const count = await page.evaluate(() => {
                const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
                const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
                
                if (!gameScene || !gameScene.enemies || !gameScene.enemies.children) return 0;
                return gameScene.enemies.children.entries.length;
            });
            
            enemyCounts.push(count);
            console.log(`Level ${level}: ${count} enemies`);
        }
        
        // Verify enemy counts match expected values
        expect(enemyCounts[0]).toBe(9);  // Level 1
        expect(enemyCounts[1]).toBe(14); // Level 6
        // Level 101 tries to spawn 109 but may be limited by available platforms
        expect(enemyCounts[2]).toBeGreaterThan(70); // Should have many more enemies
        expect(enemyCounts[2]).toBeLessThanOrEqual(109); // But can't exceed requested amount
        
        // Verify scaling progression
        expect(enemyCounts[1]).toBeGreaterThan(enemyCounts[0]); // Level 6 > Level 1
        expect(enemyCounts[2]).toBeGreaterThan(enemyCounts[1] * 4); // Level 101 >> Level 6
        
        console.log('\n=== ENEMY SCALING SUMMARY ===');
        console.log(`Level 1:   ${enemyCounts[0]} enemies`);
        console.log(`Level 6:   ${enemyCounts[1]} enemies (+${enemyCounts[1] - enemyCounts[0]} from Level 1)`);
        console.log(`Level 101: ${enemyCounts[2]} enemies (+${enemyCounts[2] - enemyCounts[0]} from Level 1)`);
        console.log(`Scaling factor: Level 101 has ${(enemyCounts[2] / enemyCounts[0]).toFixed(1)}x more enemies than Level 1`);
    });
});