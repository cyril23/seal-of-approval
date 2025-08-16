# Arctic Theme Fish Collision Bug Documentation

## Problem Description
In the Arctic theme specifically, the seal cannot collect fish. The fish appear visually but collision detection fails to trigger.

## Symptoms
- Fish sprites are visible in Arctic theme
- Seal passes through fish without collecting them
- No collision events are triggered
- Other themes work correctly

## Root Cause Analysis

### Identified Issue (Version 9.4)
The Arctic-specific body position manual update in the bobbing animation was corrupting the physics body collision detection.

**The Problem Code (lines 39-43 in Collectible.js):**
```javascript
if (this.scene.currentTheme && this.scene.currentTheme.name === 'arctic') {
    // Manual position update was interfering with collision
    this.body.position.x = this.x - this.body.halfWidth;
    this.body.position.y = this.y - this.body.halfHeight;
}
```

This manual positioning was overriding Phaser's internal collision detection system, causing the physics engine to miss overlaps.

## Version 9.4 Fix Implementation ✅

### Solution
Removed the Arctic-specific body update and unified the physics body update across all themes.

**Fixed Code:**
```javascript
onUpdate: () => {
    if (this.body && this.body.enable) {
        // Version 9.4: Always use updateFromGameObject for consistent physics
        this.body.updateFromGameObject();
    }
}
```

### Why This Works
- `updateFromGameObject()` properly syncs the physics body with the sprite position
- Maintains collision detection integrity
- Works consistently across all themes
- Preserves the bobbing animation without breaking physics

### Additional Improvements
1. **Enhanced Collision Logging** (GameScene.js):
   - Logs all fish collisions, not just Arctic
   - Shows body enabled state and visibility
   - Helps diagnose any remaining issues

2. **Z-ordering** (retained from v9.3):
   - Collectibles at depth 10
   - Player at depth 5
   - Ensures proper rendering order

## Testing Verification
1. Start game and wait for Arctic theme (white/blue background)
2. Move seal towards fish
3. Expected console output:
   ```
   Arctic: Created fish at (x, y), texture: fish
   arctic theme: Collision detected with fish at (x, y)
   Collectible body enabled: true, visible: true
   Fish eaten! Score: +200, New seal size: 2
   ```
4. Fish should disappear and score should increase

## Status
✅ **FIXED in Version 1.3** - polar_bear charge timer issue resolved!

## Root Cause Discovered 🎯
The `polar_bear` enemy had a texture loading issue that broke ALL collision detection in Arctic theme!

### The Bug
```javascript
// Enemy.js line 6 (BROKEN):
const textureKey = type.toLowerCase().replace('_', ''); 
// This converted 'polar_bear' to 'polarbear' (removed underscore)

// But PreloadScene created texture as 'polar_bear' (with underscore)
this.textures.addCanvas(key.toLowerCase(), canvas); // 'POLAR_BEAR' -> 'polar_bear'
```

**Result**: Enemy tried to load non-existent texture 'polarbear', causing physics system failure!

## Version 1.3 Complete Fix ✅

### The Real Problem
The polar_bear's charge behavior had **two critical bugs**:

1. **Unsafe delayed callback** (partially fixed)
2. **Missing patrolSpeed causing NaN velocity** (the real culprit!)

When polar_bear's updateCharge() fell back to updatePatrol(), it used undefined `patrolSpeed`, creating NaN velocities that corrupted the entire physics engine:

```javascript
// THE REAL PROBLEM:
setupCharge() {
    // Missing: this.patrolSpeed = this.config.SPEED;
    // When updatePatrol() is called, it uses undefined patrolSpeed!
}

updatePatrol() {
    this.setVelocityX(this.patrolSpeed * this.direction); 
    // undefined * 1 = NaN → Corrupts physics engine!
}
```

### The Solution
Fixed the NaN velocity corruption by initializing patrolSpeed in Enemy.js:

1. **Added patrolSpeed to setupCharge()**:
```javascript
setupCharge() {
    this.chargeSpeed = this.config.CHARGE_SPEED;
    this.normalSpeed = this.config.SPEED;
    this.patrolSpeed = this.config.SPEED; // FIX: Initialize patrolSpeed!
    this.detectionRange = this.config.DETECTION_RANGE;
    this.isCharging = false;
    this.setVelocityX(this.normalSpeed * this.direction);
}
```

This ensures that when polar_bear falls back to patrol behavior, it has a valid speed value instead of undefined, preventing NaN velocities from corrupting the physics engine.

Additional safety improvements:
- Timer cleanup on destroy to prevent accessing destroyed enemies
- Null checks for player parameter
- Safety checks in delayed callbacks

### Result
- polar_bear now works correctly in Arctic theme
- All collisions function properly
- No physics corruption when enemy destroyed while charging

## Technical Notes
- The bobbing animation works via `updateFromGameObject()`
- No Arctic-specific code in Collectible.js (unified across themes)
- Physics bodies should be synchronized with visual positions
- Other themes work correctly, suggesting Arctic-specific issue