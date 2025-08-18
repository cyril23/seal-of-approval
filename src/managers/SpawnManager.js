import { TILE_SIZE } from '../utils/constants.js';

export default class SpawnManager {
    constructor(scene) {
        this.scene = scene;
        this.occupiedPositions = [];
        this.MIN_DISTANCE = 60; // Minimum distance between entities
        this.MIN_DISTANCE_POLARBEAR = 80; // Larger distance for polar bears
        this.MAX_ATTEMPTS = 5; // Max attempts to find valid position
    }

    reset() {
        this.occupiedPositions = [];
    }

    isPositionValid(x, y, entityType = 'default') {
        const minDistance = entityType === 'polarbear' ? 
            this.MIN_DISTANCE_POLARBEAR : this.MIN_DISTANCE;

        // Check distance to all occupied positions
        for (const pos of this.occupiedPositions) {
            const distance = Math.sqrt(
                Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
            );
            
            // Use larger radius for polar bears
            const requiredDistance = pos.type === 'polarbear' || entityType === 'polarbear' ?
                this.MIN_DISTANCE_POLARBEAR : minDistance;
                
            if (distance < requiredDistance) {
                return false;
            }
        }
        
        return true;
    }

    registerPosition(x, y, type = 'default') {
        this.occupiedPositions.push({ x, y, type });
    }

    getPlatformZones(platform, entityType = 'default') {
        const zones = [];
        const platformWidth = platform.displayWidth;
        const platformX = platform.x;
        const platformY = platform.y;
        
        // Determine number of zones based on platform width
        const tileCount = Math.floor(platformWidth / TILE_SIZE);
        let numZones;
        
        // For polar bears on wide platforms, create more zones
        if (entityType === 'polarbear' && tileCount >= 12) {
            numZones = 4; // Very large platform - more zones for multiple polar bears
        } else if (tileCount < 8) {
            numZones = 1; // Small platform - center only
        } else if (tileCount <= 12) {
            numZones = 2; // Medium platform - left and right
        } else {
            numZones = 3; // Large platform - left, center, right
        }
        
        // Calculate zone positions
        const zoneWidth = platformWidth / numZones;
        const halfZone = zoneWidth / 2;
        
        for (let i = 0; i < numZones; i++) {
            const zoneX = platformX - (platformWidth / 2) + halfZone + (i * zoneWidth);
            zones.push({
                x: zoneX,
                y: platformY,
                occupied: false
            });
        }
        
        return zones;
    }

    findValidSpawnPosition(platform, entityType = 'default', yOffset = -30) {
        const zones = this.getPlatformZones(platform, entityType);
        
        // Shuffle zones for random placement
        const shuffledZones = [...zones].sort(() => Math.random() - 0.5);
        
        for (const zone of shuffledZones) {
            const testX = zone.x + (Math.random() - 0.5) * 20; // Small random offset
            const testY = zone.y + yOffset;
            
            if (this.isPositionValid(testX, testY, entityType)) {
                return { x: testX, y: testY };
            }
        }
        
        // If no zone is valid, try center with different offsets
        for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
            const testX = platform.x + (Math.random() - 0.5) * platform.displayWidth * 0.4;
            const testY = platform.y + yOffset + (Math.random() - 0.5) * 10;
            
            if (this.isPositionValid(testX, testY, entityType)) {
                return { x: testX, y: testY };
            }
        }
        
        return null; // No valid position found
    }

    shouldSkipPlatform(platform, theme) {
        // Skip cracking ice platforms for heavy enemies like polar bears
        if (theme && theme.name === 'arctic' && platform.getData('crackingIce')) {
            return true;
        }
        
        // Skip very small platforms for polar bears (reduced from 10 to 8 tiles)
        if (platform.displayWidth < 8 * TILE_SIZE) {
            return true; // Too small for polar bear patrol
        }
        
        return false;
    }

    getSpawnablePlatforms(platforms, theme = null) {
        // Filter out start and end platforms
        const filtered = platforms.slice(1, -1);
        
        if (theme && theme.name === 'arctic') {
            // For arctic, prefer stable platforms for polar bears
            return filtered.filter(p => !this.shouldSkipPlatform(p, theme));
        }
        
        return filtered;
    }
}