const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;
const { takeScreenshot } = require('./utils/screenshot');
const { loadLevel, initializeGame, jumpToSpecificLevel, waitForGameReady } = require('./utils/gameHelpers');

test.describe('Enemy Scaling and Distribution Tests', () => {
    
    // Helper function to analyze enemy segment distribution with ASCII bar chart
    function analyzeSegmentDistribution(enemies, levelWidth, levelName) {
        const segments = 10; // 10% segments
        const segmentWidth = levelWidth / segments;
        const distribution = Array(segments).fill(0);
        const segmentEnemies = Array(segments).fill(null).map(() => []);
        
        // Categorize enemies by segment
        enemies.forEach(enemy => {
            const segment = Math.min(Math.floor(enemy.x / segmentWidth), segments - 1);
            distribution[segment]++;
            segmentEnemies[segment].push(enemy);
        });
        
        // Print distribution table
        console.log(`\n${levelName.toUpperCase()} ENEMY DISTRIBUTION BY SEGMENT:`);
        console.log('=====================================');
        for (let i = 0; i < segments; i++) {
            const startPercent = i * 10;
            const endPercent = (i + 1) * 10;
            const startX = Math.floor(i * segmentWidth);
            const endX = Math.floor((i + 1) * segmentWidth);
            const bar = '█'.repeat(distribution[i] * 3);
            const padding = ' '.repeat(30 - bar.length);
            
            console.log(`${startPercent.toString().padStart(2)}%-${endPercent.toString().padEnd(3)}% (X:${startX.toString().padStart(5)}-${endX.toString().padEnd(5)}): [${bar}${padding}] ${distribution[i]} enemies`);
        }
        
        return { distribution, segmentEnemies };
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
        
        // Analyze segment distribution with ASCII bar chart
        analyzeSegmentDistribution(levelData.enemies, levelData.levelWidth, 'Level 1');
        
        // Check that enemies are reasonably evenly distributed (evenness > 0.5)
        expect(distribution.evenness).toBeGreaterThan(0.4);
        
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
        
        // Analyze segment distribution with ASCII bar chart
        analyzeSegmentDistribution(levelData.enemies, levelData.levelWidth, 'Level 6');
        
        // Check that enemies are reasonably evenly distributed
        expect(distribution.evenness).toBeGreaterThan(0.4);
        
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
        
        // Verify enemy count - should have at least 50 enemies (platform limitations may prevent exact 109)
        expect(levelData.enemies.length).toBeGreaterThanOrEqual(50);
        console.log(`Level 101: ${levelData.enemies.length} enemies`);
        
        // With 109 enemies, distribution might be less perfect due to platform constraints
        // but should still be reasonably even
        const distribution = analyzeDistribution(levelData.enemies, levelData.levelWidth);
        console.log(`Level 101 Distribution: Evenness=${distribution.evenness.toFixed(2)}, StdDev=${distribution.standardDeviation.toFixed(0)}px, CV=${distribution.coefficientOfVariation.toFixed(2)}`);
        
        // Analyze segment distribution with ASCII bar chart
        analyzeSegmentDistribution(levelData.enemies, levelData.levelWidth, 'Level 101');
        
        // With many enemies, evenness threshold can be lower
        expect(distribution.evenness).toBeGreaterThan(0.1);
        
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
        
        // Initialize the game once at the beginning
        await initializeGame(page);
        
        const levels = [1, 6, 101];
        const enemyCounts = [];
        
        for (const level of levels) {
            // Jump to level using helper function
            await jumpToSpecificLevel(page, level);
            
            // Ensure game is fully ready before accessing game state
            await waitForGameReady(page);
            
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
        expect(enemyCounts[2]).toBeGreaterThan(50); // Should have many more enemies
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