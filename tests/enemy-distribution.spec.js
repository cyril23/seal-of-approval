const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;
const { takeScreenshot } = require('./utils/screenshot');
const { focusCanvas, pressKey, waitForGameLoad, startGameWithInfoOverlay } = require('./utils/gameHelpers');

test.describe('Enemy Distribution Analysis', () => {
    test('analyze enemy distribution in level 1', async ({ page }) => {
        // Navigate to the game
        await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle',
            timeout: 10000 
        });
        
        // Wait for game to load
        await waitForGameLoad(page);
        await page.waitForTimeout(2000);
        
        // Start the game and handle info overlay
        await startGameWithInfoOverlay(page);
        
        // Wait for level to be fully generated
        await page.waitForTimeout(2000);
        
        // Collect comprehensive game data
        const levelData = await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            
            if (!gameScene) {
                return { error: 'GameScene not found' };
            }
            
            // Collect enemy data
            const enemies = [];
            if (gameScene.enemies && gameScene.enemies.children) {
                gameScene.enemies.children.entries.forEach(enemy => {
                    enemies.push({
                        x: enemy.x,
                        y: enemy.y,
                        type: enemy.enemyType || 'unknown',
                        active: enemy.active
                    });
                });
            }
            
            // Collect platform data
            const platforms = [];
            if (gameScene.platforms && gameScene.platforms.children) {
                gameScene.platforms.children.entries.forEach(platform => {
                    platforms.push({
                        x: platform.x,
                        y: platform.y,
                        width: platform.displayWidth,
                        height: platform.displayHeight
                    });
                });
            }
            
            // Collect collectible data for comparison
            const collectibles = [];
            if (gameScene.collectibles && gameScene.collectibles.children) {
                gameScene.collectibles.children.entries.forEach(collectible => {
                    collectibles.push({
                        x: collectible.x,
                        y: collectible.y,
                        type: collectible.type || 'unknown'
                    });
                });
            }
            
            // Get level info
            const levelInfo = {
                levelNumber: gameScene.levelNumber || 1,
                theme: gameScene.currentTheme ? gameScene.currentTheme.name : 'unknown',
                levelWidth: 10240, // LEVEL.GOAL_POSITION
                goalPosition: gameScene.goal ? gameScene.goal.x : 10240
            };
            
            return {
                enemies,
                platforms,
                collectibles,
                levelInfo
            };
        });
        
        // Check for errors
        if (levelData.error) {
            throw new Error(levelData.error);
        }
        
        console.log('\n========================================');
        console.log('LEVEL 1 ENEMY DISTRIBUTION ANALYSIS');
        console.log('========================================\n');
        
        // Basic statistics
        console.log('LEVEL INFO:');
        console.log(`- Level Number: ${levelData.levelInfo.levelNumber}`);
        console.log(`- Theme: ${levelData.levelInfo.theme}`);
        console.log(`- Level Width: ${levelData.levelInfo.levelWidth}px`);
        console.log(`- Goal Position: ${levelData.levelInfo.goalPosition}px`);
        console.log('\nENTITY COUNTS:');
        console.log(`- Total Enemies: ${levelData.enemies.length}`);
        console.log(`- Total Platforms: ${levelData.platforms.length}`);
        console.log(`- Total Collectibles: ${levelData.collectibles.length}`);
        
        // Analyze enemy distribution by percentage ranges
        const levelWidth = levelData.levelInfo.levelWidth;
        const segments = 10; // 10% segments
        const segmentWidth = levelWidth / segments;
        const distribution = Array(segments).fill(0);
        const segmentEnemies = Array(segments).fill(null).map(() => []);
        
        // Categorize enemies by segment
        levelData.enemies.forEach(enemy => {
            const segment = Math.min(Math.floor(enemy.x / segmentWidth), segments - 1);
            distribution[segment]++;
            segmentEnemies[segment].push(enemy);
        });
        
        // Print distribution table
        console.log('\nENEMY DISTRIBUTION BY LEVEL SEGMENT:');
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
        
        // Highlight the 60-90% range
        console.log('\n60-90% RANGE ANALYSIS (User concern):');
        console.log('=====================================');
        const enemiesIn60to90 = distribution[6] + distribution[7] + distribution[8];
        const totalEnemies = levelData.enemies.length;
        const percentageIn60to90 = totalEnemies > 0 ? (enemiesIn60to90 / totalEnemies * 100).toFixed(1) : 0;
        
        console.log(`Enemies in 60-70% range: ${distribution[6]}`);
        console.log(`Enemies in 70-80% range: ${distribution[7]}`);
        console.log(`Enemies in 80-90% range: ${distribution[8]}`);
        console.log(`Total in 60-90% range: ${enemiesIn60to90} out of ${totalEnemies} (${percentageIn60to90}%)`);
        
        // List specific enemy positions in the 60-90% range
        console.log('\nDetailed enemy positions in 60-90% range:');
        for (let i = 6; i <= 8; i++) {
            if (segmentEnemies[i].length > 0) {
                const startPercent = i * 10;
                const endPercent = (i + 1) * 10;
                console.log(`\n  ${startPercent}-${endPercent}%:`);
                segmentEnemies[i].forEach(enemy => {
                    const percent = (enemy.x / levelWidth * 100).toFixed(1);
                    console.log(`    - ${enemy.type} at X:${enemy.x.toFixed(0)}, Y:${enemy.y.toFixed(0)} (${percent}%)`);
                });
            }
        }
        
        // Analyze platform distribution for comparison
        console.log('\nPLATFORM DISTRIBUTION (for context):');
        console.log('====================================');
        const platformDistribution = Array(segments).fill(0);
        levelData.platforms.forEach(platform => {
            const segment = Math.min(Math.floor(platform.x / segmentWidth), segments - 1);
            platformDistribution[segment]++;
        });
        
        for (let i = 0; i < segments; i++) {
            const startPercent = i * 10;
            const endPercent = (i + 1) * 10;
            const bar = '▓'.repeat(platformDistribution[i] * 2);
            const padding = ' '.repeat(30 - bar.length);
            console.log(`${startPercent.toString().padStart(2)}%-${endPercent.toString().padEnd(3)}%: [${bar}${padding}] ${platformDistribution[i]} platforms`);
        }
        
        // Find gaps in enemy coverage
        console.log('\nGAPS IN ENEMY COVERAGE:');
        console.log('=======================');
        const sortedEnemies = [...levelData.enemies].sort((a, b) => a.x - b.x);
        let largestGap = 0;
        let largestGapStart = 0;
        let largestGapEnd = 0;
        
        for (let i = 0; i < sortedEnemies.length - 1; i++) {
            const gap = sortedEnemies[i + 1].x - sortedEnemies[i].x;
            if (gap > largestGap) {
                largestGap = gap;
                largestGapStart = sortedEnemies[i].x;
                largestGapEnd = sortedEnemies[i + 1].x;
            }
        }
        
        if (largestGap > 0) {
            const startPercent = (largestGapStart / levelWidth * 100).toFixed(1);
            const endPercent = (largestGapEnd / levelWidth * 100).toFixed(1);
            console.log(`Largest gap: ${largestGap.toFixed(0)}px`);
            console.log(`Gap location: X:${largestGapStart.toFixed(0)} (${startPercent}%) to X:${largestGapEnd.toFixed(0)} (${endPercent}%)`);
        }
        
        // List all enemy-free zones larger than 1000px
        console.log('\nEnemy-free zones (>1000px):');
        let previousX = 0;
        sortedEnemies.forEach((enemy, i) => {
            const gap = enemy.x - previousX;
            if (gap > 1000) {
                const startPercent = (previousX / levelWidth * 100).toFixed(1);
                const endPercent = (enemy.x / levelWidth * 100).toFixed(1);
                console.log(`  - ${gap.toFixed(0)}px gap from X:${previousX.toFixed(0)} (${startPercent}%) to X:${enemy.x.toFixed(0)} (${endPercent}%)`);
            }
            previousX = enemy.x;
        });
        
        // Check gap from last enemy to goal
        if (sortedEnemies.length > 0) {
            const lastEnemyX = sortedEnemies[sortedEnemies.length - 1].x;
            const gapToGoal = levelWidth - lastEnemyX;
            if (gapToGoal > 1000) {
                const startPercent = (lastEnemyX / levelWidth * 100).toFixed(1);
                console.log(`  - ${gapToGoal.toFixed(0)}px gap from last enemy at X:${lastEnemyX.toFixed(0)} (${startPercent}%) to goal`);
            }
        }
        
        // Enemy type distribution
        console.log('\nENEMY TYPE DISTRIBUTION:');
        console.log('========================');
        const enemyTypes = {};
        levelData.enemies.forEach(enemy => {
            enemyTypes[enemy.type] = (enemyTypes[enemy.type] || 0) + 1;
        });
        Object.entries(enemyTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });
        
        // Save detailed data to file for further analysis
        const reportData = {
            timestamp: new Date().toISOString(),
            levelInfo: levelData.levelInfo,
            summary: {
                totalEnemies: totalEnemies,
                enemiesIn60to90Range: enemiesIn60to90,
                percentageIn60to90: percentageIn60to90,
                largestGap: largestGap,
                distribution: distribution,
                enemyTypes: enemyTypes
            },
            rawData: levelData
        };
        
        const reportPath = path.join('tests', 'enemy-distribution-report.json');
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\nDetailed report saved to: ${reportPath}`);
        
        // Take screenshots at different parts of the level
        console.log('\nTaking screenshots at different level positions...');
        
        // Move to 30% of level
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                gameScene.cameras.main.scrollX = 3072; // 30% of 10240
            }
        });
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'enemy-dist-30-percent');
        
        // Move to 60% of level
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                gameScene.cameras.main.scrollX = 6144; // 60% of 10240
            }
        });
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'enemy-dist-60-percent');
        
        // Move to 75% of level
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                gameScene.cameras.main.scrollX = 7680; // 75% of 10240
            }
        });
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'enemy-dist-75-percent');
        
        // Move to 90% of level
        await page.evaluate(() => {
            const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
            const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
            if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                gameScene.cameras.main.scrollX = 9216; // 90% of 10240
            }
        });
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'enemy-dist-90-percent');
        
        console.log('\nScreenshots saved to tests/screenshots/');
        
        // Final assertion
        console.log('\n========================================');
        console.log('ANALYSIS COMPLETE');
        console.log('========================================\n');
        
        // Verify we collected data
        expect(levelData.enemies.length).toBeGreaterThan(0);
        expect(levelData.platforms.length).toBeGreaterThan(0);
    });
});