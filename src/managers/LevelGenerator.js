import Enemy from '../entities/Enemy.js';
import Collectible from '../entities/Collectible.js';
import SpawnManager from './SpawnManager.js';
import { LEVEL_WIDTH, GAME_HEIGHT, LEVEL, TILE_SIZE } from '../utils/constants.js';

export default class LevelGenerator {
    constructor(scene) {
        this.scene = scene;
        this.spawnManager = new SpawnManager(scene);
    }

    generateLevel(theme, levelNumber) {
        console.log('Generating level', levelNumber, 'with theme', theme.name);
        
        // Reset spawn manager for new level
        this.spawnManager.reset();
        
        const difficulty = levelNumber;
        const platformCount = LEVEL.MIN_PLATFORMS + Math.floor(Math.random() * (LEVEL.MAX_PLATFORMS - LEVEL.MIN_PLATFORMS));
        let enemyCount = Math.min(LEVEL.MIN_ENEMIES + difficulty, LEVEL.MAX_ENEMIES);
        
        // Enemy count is consistent across all themes for simplicity
        
        const collectibleCount = LEVEL.MIN_COLLECTIBLES + Math.floor(Math.random() * (LEVEL.MAX_COLLECTIBLES - LEVEL.MIN_COLLECTIBLES));
        
        // All themes including ocean need platforms for collectibles
        console.log('Creating', platformCount, 'platforms...');
        const platforms = this.createSideScrollingPlatforms(platformCount);
        
        console.log('Validating platform gaps...');
        this.validateAndFixPlatformGaps(platforms);
        
        // Apply arctic theme modifications if needed
        if (theme.name === 'arctic') {
            console.log('Applying arctic ice physics to platforms...');
            this.applyArcticFeatures(platforms);
        }
        
        console.log('Creating goal...');
        this.createGoal();
        
        console.log('Spawning', enemyCount, 'enemies...');
        this.spawnEnemies(theme, enemyCount);
        
        console.log('Spawning', collectibleCount, 'collectibles...');
        this.spawnCollectibles(collectibleCount, theme);
        
        console.log('Level generation complete!');
    }
    

    createSideScrollingPlatforms(count) {
        const platforms = [];
        
        // Create ground platform at start
        const startPlatform = this.scene.platforms.create(300, GAME_HEIGHT - 40, 'platform');
        startPlatform.setScale(40, 3);
        startPlatform.refreshBody();
        platforms.push(startPlatform);
        
        // Create ground platform at end for goal
        const endPlatform = this.scene.platforms.create(LEVEL.GOAL_POSITION, GAME_HEIGHT - 40, 'platform');
        endPlatform.setScale(20, 3);
        endPlatform.refreshBody();
        platforms.push(endPlatform);
        
        // Generate platforms along the level
        let currentX = 600;
        let lastY = GAME_HEIGHT - 150;
        let actualPlatformsGenerated = 0;
        
        // Version 9.4: Generate platforms more consistently without early cutoff
        // Continue until we actually reach near the goal
        while (currentX < LEVEL.GOAL_POSITION - 600 && actualPlatformsGenerated < count) {
            // Calculate next platform position
            const gap = Phaser.Math.Between(LEVEL.MIN_GAP, LEVEL.MAX_GAP);
            const platformWidth = Phaser.Math.Between(5, 12) * TILE_SIZE;
            
            currentX += gap;
            
            // Only stop if we're very close to the goal
            if (currentX > LEVEL.GOAL_POSITION - 300) {
                console.log(`Platform generation stopping at X=${currentX} (${Math.floor(currentX / LEVEL.GOAL_POSITION * 100)}% progress)`);
                break;
            }
            
            // Vary height but keep it jumpable
            // Reduce max height change for more gradual progression
            const maxHeightChange = 100; // Reduced from 150
            let heightChange = Phaser.Math.Between(-maxHeightChange, maxHeightChange);
            
            // Bias towards smaller changes for smoother gameplay
            if (Math.abs(heightChange) > 50) {
                heightChange = heightChange * 0.7; // Reduce large changes
            }
            
            let newY = lastY + heightChange;
            
            // Keep platforms within screen bounds with more margin
            newY = Phaser.Math.Clamp(newY, 150, GAME_HEIGHT - 100);
            
            // Create the platform
            const platform = this.scene.platforms.create(currentX, newY, 'platform');
            platform.setScale(platformWidth / TILE_SIZE, 1);
            platform.refreshBody();
            platforms.push(platform);
            
            // Occasionally add a moving platform
            if (Math.random() < 0.15 && actualPlatformsGenerated > 2) { // Reduced frequency slightly
                this.createMovingPlatform(currentX + platformWidth + 100, newY);
            }
            
            currentX += platformWidth;
            lastY = newY;
            actualPlatformsGenerated++;
        }
        
        console.log(`Generated ${actualPlatformsGenerated} regular platforms, last at X=${currentX}`);
        
        // Add more frequent ground platforms throughout the level for safety
        // Version 9.4: Increased frequency from 1500 to 1000 for better coverage
        for (let x = 1000; x < LEVEL.GOAL_POSITION - 100; x += 1000) {
            const groundPlatform = this.scene.platforms.create(x, GAME_HEIGHT - 40, 'platform');
            groundPlatform.setScale(20, 3);
            groundPlatform.refreshBody();
            platforms.push(groundPlatform);
        }
        
        // Version 9.4: Enhanced gap detection and filling
        // Ensure continuous path to goal by checking ALL gaps
        const sortedPlatforms = [...platforms].sort((a, b) => a.x - b.x);
        let lastRegularPlatform = null;
        
        for (let i = sortedPlatforms.length - 1; i >= 0; i--) {
            // Skip the goal platform itself
            if (Math.abs(sortedPlatforms[i].x - LEVEL.GOAL_POSITION) > 100) {
                lastRegularPlatform = sortedPlatforms[i];
                break;
            }
        }
        
        if (lastRegularPlatform) {
            const gapToGoal = LEVEL.GOAL_POSITION - (lastRegularPlatform.x + lastRegularPlatform.displayWidth / 2);
            console.log(`Gap from last platform (x=${lastRegularPlatform.x}) to goal: ${gapToGoal.toFixed(0)}px`);
            
            // Version 9.4: Fill ANY gap larger than jump distance
            if (gapToGoal > LEVEL.MAX_GAP) {
                console.log(`Filling gap to goal with bridge platforms...`);
                
                // Calculate how many platforms we need
                const numBridges = Math.ceil(gapToGoal / 180) - 1;
                const bridgeSpacing = gapToGoal / (numBridges + 1);
                
                for (let i = 1; i <= numBridges; i++) {
                    const bridgeX = lastRegularPlatform.x + lastRegularPlatform.displayWidth / 2 + (bridgeSpacing * i);
                    // Gradually descend towards goal platform height
                    const progress = i / (numBridges + 1);
                    const bridgeY = Phaser.Math.Linear(
                        lastRegularPlatform.y,
                        GAME_HEIGHT - 100,
                        progress
                    );
                    
                    const bridgePlatform = this.scene.platforms.create(bridgeX, bridgeY, 'platform');
                    bridgePlatform.setScale(10, 1);
                    bridgePlatform.refreshBody();
                    platforms.push(bridgePlatform);
                    console.log(`Added bridge platform ${i}/${numBridges} at X:${bridgeX.toFixed(0)}, Y:${bridgeY.toFixed(0)}`);
                }
            }
        } else {
            console.log('WARNING: Could not find last regular platform before goal!');
        }
        
        // Version 9.4: Final validation - check for any remaining large gaps
        const finalSorted = [...platforms].sort((a, b) => a.x - b.x);
        let largeGapFound = false;
        for (let i = 0; i < finalSorted.length - 1; i++) {
            const gap = finalSorted[i + 1].x - (finalSorted[i].x + finalSorted[i].displayWidth / 2);
            if (gap > LEVEL.MAX_GAP + 100) {
                const progress = Math.floor(finalSorted[i].x / LEVEL.GOAL_POSITION * 100);
                console.log(`WARNING: Large gap of ${gap.toFixed(0)}px remains at ${progress}% progress!`);
                largeGapFound = true;
            }
        }
        
        if (!largeGapFound) {
            console.log('Platform generation complete - all gaps are jumpable');
        }
        
        return platforms;
    }

    createMovingPlatform(x, y) {
        const platform = this.scene.platforms.create(x, y, 'platform');
        platform.setScale(6, 1);
        platform.refreshBody();
        
        const moveDistance = 100;
        const duration = 3000;
        
        this.scene.tweens.add({
            targets: platform,
            y: y - moveDistance,
            duration: duration,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                platform.refreshBody();
            }
        });
    }
    
    validateAndFixPlatformGaps(platforms) {
        // Maximum horizontal distance a player can jump with double jump
        const MAX_JUMP_DISTANCE = 220; // Conservative estimate for double jump
        const MAX_VERTICAL_JUMP_UP = 150; // Maximum height player can jump up
        const MAX_VERTICAL_JUMP_DOWN = 250; // Maximum safe fall distance
        
        console.log('Starting platform gap validation with', platforms.length, 'platforms');
        
        // Sort platforms by X position
        platforms.sort((a, b) => a.x - b.x);
        
        // Safety counter to prevent infinite loops
        let bridgesAdded = 0;
        const MAX_BRIDGES = 50;
        
        // Check each gap between consecutive platforms
        for (let i = 0; i < platforms.length - 1; i++) {
            if (bridgesAdded >= MAX_BRIDGES) {
                console.warn('Maximum bridge platforms reached, stopping gap validation');
                break;
            }
            
            const current = platforms[i];
            const next = platforms[i + 1];
            
            // Calculate gap - from right edge of current to left edge of next
            const currentRightEdge = current.x + current.displayWidth / 2;
            const nextLeftEdge = next.x - next.displayWidth / 2;
            const horizontalGap = nextLeftEdge - currentRightEdge;
            const verticalDiff = next.y - current.y; // Positive means next is lower
            
            // Skip overlapping platforms (negative gap)
            if (horizontalGap < 0) {
                continue;
            }
            
            // Check if gap needs fixing
            const isGapTooWide = horizontalGap > MAX_JUMP_DISTANCE;
            const isJumpTooHigh = verticalDiff < 0 && Math.abs(verticalDiff) > MAX_VERTICAL_JUMP_UP;
            const isFallTooFar = verticalDiff > 0 && verticalDiff > MAX_VERTICAL_JUMP_DOWN;
            
            if (isGapTooWide || isJumpTooHigh || isFallTooFar) {
                console.log(`Gap ${i}: ${horizontalGap.toFixed(0)}px wide, ${verticalDiff.toFixed(0)}px vertical - Adding bridge`);
                
                // Calculate bridge position
                let bridgeX, bridgeY;
                
                if (isJumpTooHigh || isFallTooFar) {
                    // For vertical gaps, create stepped platforms
                    bridgeX = currentRightEdge + Math.min(horizontalGap / 2, 150);
                    // Place bridge at intermediate height
                    if (isJumpTooHigh) {
                        // Going up: place bridge halfway up
                        bridgeY = current.y - MAX_VERTICAL_JUMP_UP * 0.7;
                    } else {
                        // Going down: place bridge to break the fall
                        bridgeY = current.y + MAX_VERTICAL_JUMP_DOWN * 0.7;
                    }
                } else {
                    // For horizontal gaps, place bridge in the middle
                    bridgeX = currentRightEdge + horizontalGap / 2;
                    bridgeY = current.y + (Math.random() - 0.5) * 50;
                }
                
                const bridgePlatform = this.scene.platforms.create(bridgeX, bridgeY, 'platform');
                bridgePlatform.setScale(10, 1); // Wide enough to land on
                bridgePlatform.refreshBody();
                
                // Add to platforms array for further validation
                platforms.splice(i + 1, 0, bridgePlatform);
                bridgesAdded++;
                
                // Re-sort platforms to maintain order
                platforms.sort((a, b) => a.x - b.x);
                
                // Don't decrement i, check the next gap
                // This prevents infinite loops on the same gap
            }
        }
        
        console.log('Platform gap validation complete. Added', bridgesAdded, 'bridge platforms');
        return platforms;
    }

    createGoal() {
        // Create the goal/finish flag at the end of the level
        const goal = this.scene.physics.add.sprite(LEVEL.GOAL_POSITION, GAME_HEIGHT - 120, 'goal');
        goal.setScale(3);
        goal.setData('isGoal', true);
        
        // Make it bob up and down
        this.scene.tweens.add({
            targets: goal,
            y: GAME_HEIGHT - 140,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add collision with platforms
        this.scene.physics.add.collider(goal, this.scene.platforms);
        
        // Store reference in scene
        this.scene.goal = goal;
    }

    spawnEnemies(theme, count) {
        const enemyTypes = theme.enemies;
        
        // Ocean theme - spawn swimming enemies in open water
        if (theme.name === 'ocean') {
            console.log(`Spawning ${count} swimming enemies in open water`);
            
            // Calculate evenly distributed X positions
            const minX = 400;
            const maxX = LEVEL.GOAL_POSITION - 400;
            const spawnRange = maxX - minX;
            
            console.log(`Ocean enemy spawn range: X:${minX} to X:${maxX} (${spawnRange}px wide)`);
            
            for (let i = 0; i < count; i++) {
                // Proper even distribution from 0% to 100% of spawn range
                const progress = count === 1 ? 0.5 : i / (count - 1);
                const targetX = minX + (spawnRange * progress);
                
                // Random Y position in the swimming area (avoid floor and ceiling)
                const targetY = Phaser.Math.Between(100, GAME_HEIGHT - 100);
                
                const enemyType = Phaser.Math.RND.pick(enemyTypes);
                const enemy = new Enemy(this.scene, targetX, targetY, enemyType);
                this.scene.enemies.add(enemy);
                
                const percentPosition = (targetX / LEVEL.GOAL_POSITION * 100).toFixed(1);
                console.log(`Spawned swimming ${enemyType} at (${targetX.toFixed(0)}, ${targetY.toFixed(0)}) - ${percentPosition}% of level`);
            }
            return; // Exit early for ocean theme
        }
        
        // Normal platform-based spawning for other themes
        const platforms = this.scene.platforms.children.entries;
        
        // Get spawnable platforms (excludes first and last)
        const spawnablePlatforms = this.spawnManager.getSpawnablePlatforms(platforms, theme);
        
        // Sort platforms by X position for even distribution
        const sortedPlatforms = [...spawnablePlatforms].sort((a, b) => a.x - b.x);
        
        if (sortedPlatforms.length === 0) {
            console.warn('No spawnable platforms available for enemies');
            return;
        }
        
        // Calculate the level range for enemy spawning
        const minX = sortedPlatforms[0].x;
        const maxX = sortedPlatforms[sortedPlatforms.length - 1].x;
        const spawnRange = maxX - minX;
        
        console.log(`Enemy spawn range: X:${minX.toFixed(0)} to X:${maxX.toFixed(0)} (${spawnRange.toFixed(0)}px wide)`);
        console.log(`Spawning ${count} enemies with even distribution`);
        
        // Calculate target X positions for even distribution
        const targetPositions = [];
        for (let i = 0; i < count; i++) {
            // Distribute enemies evenly across the spawn range
            const progress = count === 1 ? 0.5 : i / (count - 1);
            const targetX = minX + (spawnRange * progress);
            targetPositions.push(targetX);
        }
        
        let enemiesSpawned = 0;
        const usedPlatforms = new Set();
        const polarBearsByPlatform = new Map();
        
        // For each target position, find the nearest valid platform
        for (const targetX of targetPositions) {
            // Find the nearest platform to this target X position
            let nearestPlatform = null;
            let minDistance = Infinity;
            
            for (const platform of sortedPlatforms) {
                // Skip already heavily used platforms (unless Arctic with wide platforms)
                if (theme.name === 'arctic') {
                    const platformTileWidth = Math.floor(platform.displayWidth / TILE_SIZE);
                    const bearsOnPlatform = polarBearsByPlatform.get(platform) || 0;
                    
                    if (platformTileWidth >= 12 && bearsOnPlatform >= 2) {
                        continue; // Max 2 bears on wide platforms
                    } else if (platformTileWidth < 12 && bearsOnPlatform >= 1) {
                        continue; // Max 1 bear on normal platforms
                    }
                } else if (usedPlatforms.has(platform)) {
                    // For non-Arctic themes, try to use each platform only once if possible
                    if (sortedPlatforms.length > count) {
                        continue;
                    }
                }
                
                const distance = Math.abs(platform.x - targetX);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPlatform = platform;
                }
            }
            
            if (!nearestPlatform) {
                console.warn(`No valid platform found for target X:${targetX.toFixed(0)}`);
                continue;
            }
            
            // Select enemy type
            const enemyType = Phaser.Utils.Array.GetRandom(enemyTypes);
            
            // Find valid spawn position on the platform
            const position = this.spawnManager.findValidSpawnPosition(
                nearestPlatform,
                enemyType,
                -30 // Y offset for enemies
            );
            
            if (position) {
                const enemy = new Enemy(this.scene, position.x, position.y, enemyType);
                this.scene.enemies.add(enemy);
                
                // Register position to prevent overlaps
                this.spawnManager.registerPosition(position.x, position.y, enemyType);
                enemiesSpawned++;
                usedPlatforms.add(nearestPlatform);
                
                // Track polar bears per platform
                if (enemyType === 'polarbear') {
                    polarBearsByPlatform.set(nearestPlatform, (polarBearsByPlatform.get(nearestPlatform) || 0) + 1);
                }
                
                // Log spawn for debugging
                const actualPercent = ((position.x / LEVEL_WIDTH) * 100).toFixed(1);
                const targetPercent = ((targetX / LEVEL_WIDTH) * 100).toFixed(1);
                console.log(`Enemy ${enemiesSpawned}/${count}: ${enemyType} at X:${position.x.toFixed(0)} (${actualPercent}%, target was ${targetPercent}%)`);
            } else {
                console.warn(`Failed to find valid spawn position on platform at X:${nearestPlatform.x}`);
            }
        }
        
        console.log(`Successfully spawned ${enemiesSpawned}/${count} enemies with even distribution`);
    }

    spawnCollectibles(count, theme) {
        const platforms = this.scene.platforms.children.entries;
        // Only spawn regular fish - all powerups handled by spawnSpecialPowerups
        const collectibleTypes = ['fish', 'fish', 'fish'];
        
        // Spawn special powerups first with exact counts and position constraints
        this.spawnSpecialPowerups();
        
        let collectiblesSpawned = 0;
        
        // Ocean theme: spawn fish at various heights in the water
        if (theme.name === 'ocean') {
            // Spawn fish throughout the ocean at various heights
            for (let i = 0; i < count; i++) {
                const targetX = Phaser.Math.Between(300, LEVEL.GOAL_POSITION - 300);
                const targetY = Phaser.Math.Between(100, GAME_HEIGHT - 150);
                
                const type = i < count * 0.6 ? 'fish' : Phaser.Utils.Array.GetRandom(collectibleTypes);
                
                // Check if position is valid
                if (this.spawnManager.isPositionValid(targetX, targetY, type)) {
                    const collectible = new Collectible(this.scene, targetX, targetY, type, theme);
                    
                    // Ocean fish float in water
                    if (type === 'fish') {
                        collectible.body.setAllowGravity(false);
                    }
                    
                    this.scene.collectibles.add(collectible);
                    this.spawnManager.registerPosition(targetX, targetY, type);
                    collectiblesSpawned++;
                }
            }
        } else {
            // Non-ocean themes: spawn collectibles above platforms
            const spacing = LEVEL_WIDTH / (count + 1);
            
            for (let i = 0; i < count; i++) {
                const targetX = spacing * (i + 1);
                
                // Find nearest platform to this X position
                let nearestPlatform = platforms[0];
                let minDistance = Math.abs(platforms[0].x - targetX);
                
                for (const platform of platforms) {
                    const distance = Math.abs(platform.x - targetX);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPlatform = platform;
                    }
                }
                
                const type = i < count * 0.6 ? 'fish' : Phaser.Utils.Array.GetRandom(collectibleTypes);
                
                // Find valid spawn position using SpawnManager
                const position = this.spawnManager.findValidSpawnPosition(
                    nearestPlatform,
                    type,
                    -50 // Y offset for collectibles
                );
                
                if (position) {
                    const collectible = new Collectible(this.scene, position.x, position.y, type, theme);
                    this.scene.collectibles.add(collectible);
                    
                    // Register position to prevent overlaps
                    this.spawnManager.registerPosition(position.x, position.y, type);
                    collectiblesSpawned++;
                }
            }
        }
        
        console.log(`Spawned ${collectiblesSpawned}/${count} collectibles in ${theme.name} theme`);
    }

    spawnSpecialPowerups() {
        console.log('Spawning special powerups with exact counts and position constraints...');
        
        // Spawn exactly 2 magnets (25-35% and 55-65% progress, never after 80%)
        const magnetPositions = [
            { min: 0.25, max: 0.35 }, // First magnet
            { min: 0.55, max: 0.65 }  // Second magnet
        ];
        
        for (const range of magnetPositions) {
            const progress = Phaser.Math.FloatBetween(range.min, range.max);
            this.spawnPowerupAtProgress('magnet', progress);
        }
        
        // Spawn 1-2 stars (20-80% progress)
        const starCount = Phaser.Math.Between(1, 2);
        if (starCount === 1) {
            const progress = Phaser.Math.FloatBetween(0.40, 0.60);
            this.spawnPowerupAtProgress('star', progress);
        } else {
            this.spawnPowerupAtProgress('star', 0.30 + Phaser.Math.FloatBetween(-0.05, 0.05));
            this.spawnPowerupAtProgress('star', 0.65 + Phaser.Math.FloatBetween(-0.05, 0.05));
        }
        
        // Spawn 0-2 speed boosts (20-90% progress)
        const speedCount = Phaser.Math.Between(0, 2);
        if (speedCount === 1) {
            const progress = Phaser.Math.FloatBetween(0.45, 0.55);
            this.spawnPowerupAtProgress('speed', progress);
        } else if (speedCount === 2) {
            this.spawnPowerupAtProgress('speed', 0.35 + Phaser.Math.FloatBetween(-0.05, 0.05));
            this.spawnPowerupAtProgress('speed', 0.70 + Phaser.Math.FloatBetween(-0.05, 0.05));
        }
        
        // Spawn 1-3 time bonuses (50-95% progress)
        const timeCount = Phaser.Math.Between(1, 3);
        const timeSpacing = 0.45 / (timeCount + 1); // Distribute within 50-95% range
        for (let i = 0; i < timeCount; i++) {
            const baseProgress = 0.50 + timeSpacing * (i + 1);
            const progress = baseProgress + Phaser.Math.FloatBetween(-0.05, 0.05);
            this.spawnPowerupAtProgress('time', Math.min(progress, 0.95));
        }
        
        // Spawn 1-3 extra lives (20-95% progress) - per user request
        // Alternative: 0-2 would make them rarer and more special
        const lifeCount = Phaser.Math.Between(1, 3);
        if (lifeCount === 1) {
            const progress = Phaser.Math.FloatBetween(0.45, 0.65);
            this.spawnPowerupAtProgress('life', progress);
        } else if (lifeCount === 2) {
            this.spawnPowerupAtProgress('life', 0.35 + Phaser.Math.FloatBetween(-0.05, 0.05));
            this.spawnPowerupAtProgress('life', 0.70 + Phaser.Math.FloatBetween(-0.05, 0.05));
        } else if (lifeCount === 3) {
            this.spawnPowerupAtProgress('life', 0.25 + Phaser.Math.FloatBetween(-0.05, 0.05));
            this.spawnPowerupAtProgress('life', 0.50 + Phaser.Math.FloatBetween(-0.05, 0.05));
            this.spawnPowerupAtProgress('life', 0.80 + Phaser.Math.FloatBetween(-0.05, 0.05));
        }
        
        console.log(`Special powerups spawned: 2 magnets, ${starCount} star(s), ${speedCount} speed(s), ${timeCount} time bonus(es), ${lifeCount} extra life/lives`);
    }
    
    spawnPowerupAtProgress(type, progressPercent) {
        const targetX = LEVEL.GOAL_POSITION * progressPercent;
        const platform = this.findNearestPlatformAtProgress(progressPercent);
        
        if (platform) {
            // Use SpawnManager to find valid position
            const position = this.spawnManager.findValidSpawnPosition(
                platform,
                type,
                -50 // Y offset for collectibles
            );
            
            if (position) {
                const collectible = new Collectible(this.scene, position.x, position.y, type);
                this.scene.collectibles.add(collectible);
                this.spawnManager.registerPosition(position.x, position.y, type);
                console.log(`Spawned ${type} at ${Math.round(progressPercent * 100)}% progress (x: ${position.x})`);
            } else {
                console.warn(`Could not find valid position for ${type} at ${Math.round(progressPercent * 100)}% progress`);
            }
        } else {
            console.warn(`No platform found near ${Math.round(progressPercent * 100)}% progress for ${type}`);
        }
    }
    
    findNearestPlatformAtProgress(progressPercent) {
        const targetX = LEVEL.GOAL_POSITION * progressPercent;
        const platforms = this.scene.platforms.children.entries;
        
        let nearestPlatform = null;
        let minDistance = Infinity;
        
        for (const platform of platforms) {
            const distance = Math.abs(platform.x - targetX);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPlatform = platform;
            }
        }
        
        return nearestPlatform;
    }

    applyArcticFeatures(platforms) {
        // Mark all platforms as ice platforms for slippery physics
        platforms.forEach((platform, index) => {
            // Skip start and end platforms
            if (index === 0 || index === platforms.length - 1) return;
            
            // All arctic platforms are ice platforms
            platform.setData('isIce', true);
            
            // 20% chance for special ice platform types
            const rand = Math.random();
            if (rand < 0.1) {
                // Cracking ice - breaks after player stands on it
                platform.setData('crackingIce', true);
                platform.setData('crackTimer', 0);
                platform.setTint(0xE6F3FF); // Lighter tint for cracking ice
            } else if (rand < 0.2) {
                // Floating ice - bobs up and down
                this.makeFloatingIce(platform);
            }
            
            // Visual ice effect - slightly blue tint
            if (!platform.getData('crackingIce')) {
                platform.setTint(0xCCE5FF);
            }
        });
        
        // Add some icicle hazards hanging from platforms
        this.addIcicles(platforms);
    }

    makeFloatingIce(platform) {
        platform.setData('floatingIce', true);
        
        const originalY = platform.y;
        const bobAmount = 30;
        const duration = 3000 + Math.random() * 2000;
        
        this.scene.tweens.add({
            targets: platform,
            y: originalY + bobAmount,
            duration: duration,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                platform.refreshBody();
            }
        });
    }

    addIcicles(platforms) {
        // Add icicles under some platforms (visual only for now)
        platforms.forEach((platform, index) => {
            if (index === 0 || index === platforms.length - 1) return;
            
            if (Math.random() < 0.3) {
                const numIcicles = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numIcicles; i++) {
                    const x = platform.x - platform.displayWidth / 3 + (i * platform.displayWidth / (numIcicles + 1));
                    const y = platform.y + platform.displayHeight / 2;
                    
                    // Create icicle visual (triangle shape)
                    const icicle = this.scene.add.triangle(x, y, 0, 0, -4, 20, 4, 20, 0xCCE5FF);
                    icicle.setDepth(-1); // Behind sprites
                }
            }
        });
    }
}