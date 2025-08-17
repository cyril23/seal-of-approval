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
        
        const difficulty = Math.min(levelNumber, 10);
        const platformCount = LEVEL.MIN_PLATFORMS + Math.floor(Math.random() * (LEVEL.MAX_PLATFORMS - LEVEL.MIN_PLATFORMS));
        const enemyCount = Math.min(LEVEL.MIN_ENEMIES + difficulty, LEVEL.MAX_ENEMIES);
        const collectibleCount = LEVEL.MIN_COLLECTIBLES + Math.floor(Math.random() * (LEVEL.MAX_COLLECTIBLES - LEVEL.MIN_COLLECTIBLES));
        
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
        this.spawnCollectibles(collectibleCount);
        
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
        const platforms = this.scene.platforms.children.entries;
        
        // Get spawnable platforms based on theme
        const spawnablePlatforms = this.spawnManager.getSpawnablePlatforms(platforms, theme);
        
        // Shuffle platforms for random distribution
        const shuffledPlatforms = [...spawnablePlatforms].sort(() => Math.random() - 0.5);
        
        let enemiesSpawned = 0;
        
        for (const platform of shuffledPlatforms) {
            if (enemiesSpawned >= count) break;
            
            const enemyType = Phaser.Utils.Array.GetRandom(enemyTypes);
            
            // Find valid spawn position using SpawnManager
            const position = this.spawnManager.findValidSpawnPosition(
                platform, 
                enemyType,
                -30 // Y offset for enemies
            );
            
            if (position) {
                const enemy = new Enemy(this.scene, position.x, position.y, enemyType);
                this.scene.enemies.add(enemy);
                
                // Register position to prevent overlaps
                this.spawnManager.registerPosition(position.x, position.y, enemyType);
                enemiesSpawned++;
                
                // For polar bears, skip nearby platforms to give them space
                if (enemyType === 'polarbear') {
                    // Remove next platform from consideration
                    const currentIndex = shuffledPlatforms.indexOf(platform);
                    if (currentIndex < shuffledPlatforms.length - 1) {
                        shuffledPlatforms.splice(currentIndex + 1, 1);
                    }
                }
            }
        }
        
        console.log(`Spawned ${enemiesSpawned}/${count} enemies`);
    }

    spawnCollectibles(count) {
        const platforms = this.scene.platforms.children.entries;
        const collectibleTypes = ['fish', 'fish', 'fish', 'star', 'speed', 'time', 'life', 'magnet'];
        
        let collectiblesSpawned = 0;
        
        // First pass: Try to distribute collectibles evenly across the level
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
                const collectible = new Collectible(this.scene, position.x, position.y, type);
                this.scene.collectibles.add(collectible);
                
                // Register position to prevent overlaps
                this.spawnManager.registerPosition(position.x, position.y, type);
                collectiblesSpawned++;
            }
        }
        
        // Add floating fish in the air (these don't need collision checks as they're in open space)
        const floatingFishCount = 10;
        let floatingSpawned = 0;
        
        for (let i = 0; i < floatingFishCount * 2 && floatingSpawned < floatingFishCount; i++) {
            const x = Phaser.Math.Between(500, LEVEL.GOAL_POSITION - 500);
            const y = Phaser.Math.Between(100, 300);
            
            // Check if position is valid (not overlapping with other floating items)
            if (this.spawnManager.isPositionValid(x, y, 'fish')) {
                const collectible = new Collectible(this.scene, x, y, 'fish');
                collectible.body.setAllowGravity(false);
                this.scene.collectibles.add(collectible);
                
                // Register floating fish position
                this.spawnManager.registerPosition(x, y, 'fish');
                floatingSpawned++;
            }
        }
        
        console.log(`Spawned ${collectiblesSpawned}/${count} collectibles and ${floatingSpawned} floating fish`);
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