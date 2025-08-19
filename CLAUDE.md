# CLAUDE.md - Seal of Approval

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design Iteration Process

### Working with Visual Assets
When improving visual elements (sprites, backgrounds, UI), follow this iterative process:

1. **Reference Images**: If the user provides reference images, analyze them carefully for:
   - Art style (pixel art, hand-drawn, realistic)
   - Color palettes and gradients
   - Proportions and scaling
   - Detail level and texture patterns

2. **Feedback Loop Process**:
   - Create initial implementation
   - Generate test screenshot using automated tests
   - Ask user: "Do you prefer this iteration over the previous one?"
   - Identify specific elements user likes/dislikes
   - Make targeted improvements based on feedback
   - Repeat until satisfied (typically 3-4 iterations max)

3. **Screenshot Testing**:
   ```javascript
   // Use Playwright tests to capture visual changes
   npx playwright test --headed
   ```

### Phaser Graphics Capabilities & Limitations

**Available Drawing Methods**:
- `fillRect()`, `strokeRect()` - Rectangles
- `fillTriangle()`, `strokeTriangle()` - Triangles  
- `fillCircle()`, `strokeCircle()` - Circles
- `lineBetween()` - Simple lines
- `beginPath()`, `moveTo()`, `lineTo()`, `strokePath()` - Path drawing
- `arc()` - Arc segments
- `fillStyle()`, `lineStyle()` - Colors and line styles

**NOT Available (Common Mistakes)**:
- ❌ `quadraticBezierTo()` - Use line segments to approximate curves
- ❌ `bezierCurveTo()` - Break into multiple `lineTo()` calls
- ❌ Direct curve drawing - Use `Phaser.Curves` classes with `draw()` method

**Workaround for Curves**:
```javascript
// Instead of quadraticBezierTo, use segments:
const segments = 10;
for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t + Math.sin(t * Math.PI) * curveHeight;
    if (i > 0) graphics.lineBetween(prevX, prevY, x, y);
    prevX = x; prevY = y;
}
```

### Best Practices for Retro Graphics
- **Repeated Backgrounds**: Classic 8-bit games use tiled backgrounds - create a few variations and repeat
- **Limited Variations**: 2-4 variations of objects (trees, clouds, buildings) is authentic
- **Consistent Pixel Size**: Maintain consistent "pixel" size across all graphics
- **Color Palettes**: Use limited, cohesive color palettes per theme

## Commands

### Development
```bash
npm run dev         # Start Vite dev server with hot reload on port 3000
npm run build       # Build production bundle to dist/
npm run preview     # Preview production build locally
```

### Dependencies
```bash
npm install         # Install all dependencies (Phaser 3 and Vite)
```

## Architecture Overview

### Game Engine
"Seal of Approval" is a Phaser 3-based 8-bit retro side-scrolling platformer game featuring a seal character. The game uses Vite for bundling and development server capabilities. Resolution is 1024x768.

### Core Systems

#### Scene Management
The game uses Phaser's scene system with four main scenes:
- **PreloadScene**: Creates emoji-based textures dynamically using canvas, generates platform textures and detailed themed backgrounds with visual elements (icebergs, buildings, ships, etc.)
- **MenuScene**: Main menu with high score display from localStorage and background music
- **GameScene**: Side-scrolling gameplay with camera following, physics, collision detection, level progression, and goal completion
- **GameOverScene**: Score display and restart options

#### Entity System
All game entities extend Phaser's physics sprites:
- **Seal** (player): Mario-style physics with variable jump height, double jump mechanic (with fart animation), power-up states, and 3-size growth system
  - **Size System**: Seal grows when eating fish (sizes 1-3), shrinks when taking damage, resets to size 1 per level
  - **Physics Body Tuning**: Empirically-tuned collision boxes for each size - do not change without visual testing using Physics Debug overlay
- **Enemy**: Base class with four enemy types (human, hawk, orca, crab), each with unique AI behaviors
- **Collectible**: Power-ups and fish with theme-specific behavior. Ocean fish float without gravity with bobbing animation. Non-ocean fish fall with gravity

#### Manager Classes
- **LevelGenerator**: Procedurally generates side-scrolling levels with gap validation and bridge platforms for vertical gaps
- **ScoreManager**: Handles scoring with visual feedback popups
- **AudioManager**: Web Audio API-based sound system, all sounds generated programmatically

### Key Technical Details

#### Physics System
- Uses Phaser's Arcade physics with gravity (800)
- Variable jump physics - hold spacebar for higher jumps
- Double jump mechanic - press spacebar again in mid-air (90% strength)
- Platform collision handled through static groups
- Fall death when player falls below screen bottom (respawns at start)
- Manual world bounds checking for left/right/top edges only

#### Sprite Generation
Instead of external sprite files, the game generates sprites dynamically:
- Emoji characters rendered to canvas textures in PreloadScene
- Platform textures created procedurally with gradient effects
- Themed backgrounds generated procedurally for each theme

#### Level Generation Algorithm
Located in `LevelGenerator.js`:
- Generates 10x screen width side-scrolling levels
- Creates start/end platforms with goal flag
- Procedurally places platforms with gap validation
- Adds bridge platforms for vertical gaps
- Some platforms are animated (moving vertically)

#### Enemy Spawning System
- Even X-axis distribution across level width
- Platform-based placement
- Start/end platforms excluded for safe spawn/goal areas
- Difficulty scales with level number (see constants.js for specifics)

#### Collectible Spawning
- Collectible spawning is theme-dependent:
  - **Ocean theme**: Fish spawn at various heights throughout the water (Y: 100-600px) with gravity disabled, creating an underwater environment
  - **Non-ocean themes**: Collectibles spawn above platforms and fall naturally with gravity

#### Powerup Spawn Distribution
Controlled powerup spawning in `spawnSpecialPowerups()` method:
- Various powerups spawn at strategic progress points throughout the level
- See LevelGenerator.js for specific spawn logic and counts

#### Collectible Animations
Theme-specific animations for collectibles:
- **Ocean fish**: Gentle vertical bobbing
- **Non-ocean fish**: No animation, physics-based movement
- **Star/Magnet power-ups**: Continuous rotation
- **Other power-ups**: Static

#### Power-up System
Power-ups modify player state temporarily:
- Invincibility: Yellow tint with blinking effect
- Speed boost: Particle trail effect
- Magnet: Visual field circle that attracts nearby fish

#### Camera System
- Follows player with smooth lerping (0.1 factor)
- Deadzone of 200x200 pixels for stable following
- Camera bounded to level width (10,240px)
- UI elements fixed to camera viewport with setScrollFactor(0)

#### Audio System
No external audio files - all sounds generated via Web Audio API:
- Tone generation for jump, double jump, eat, power-up sounds
- Noise generation for hurt and fall sounds
- Arpeggio sequences for level complete/game over
- Menu music: simple looping patterns
- In-game music: complex bass and melody tracks per theme

### Game Constants
All game configuration in `src/utils/constants.js`:
- Physics values (gravity, speeds, jump velocities)
- Enemy configurations and behaviors
- Theme definitions with color schemes
- Power-up durations and effects
- Scoring multipliers

### Gameplay Features

#### Size System Visual Effects
The seal growth/shrink system includes polished visual feedback:
- **Growth**: Golden flash, "NOM NOM!" text, and bouncy scale animation
- **Shrink**: Red flash with camera shake, smoke puffs, and compression animation
- Effects are purely visual and don't interfere with physics calculations

#### Controls
- **Arrow Keys**: Move left/right (all directions in Developer Mode)
- **Spacebar**: Jump (hold for higher), press again for double jump
- **P**: Pause game
- **M**: Mute audio
- **R**: Restart current level (with confirmation)
- **I**: Show info overlay (displays level information again)
- **S**: Take screenshot (developer tool)
- **DD** (double-tap D quickly): Open Developer Menu
- **ESC**: Return to menu

#### Scoring System
- Fish collection: 100 points
- Enemy defeat: 200 points (stomp or invincible)
- Distance traveled: 10 points per 100px
- Time bonus: Remaining seconds × 10 at level completion
- Level complete bonus: 1000 points
- Visual feedback: Floating text popups show point sources

#### Death & Respawn
- Player starts with 1 life (not 3)
- Lives accumulate across levels (can collect extra lives)
- Death occurs from enemy contact or falling below screen (fall death bypasses invincibility)
- Respawn at level start with 3 seconds invincibility
- Camera flash and position reset on respawn
- Seal always resets to size 1 after death

#### Level Restart System
- Press 'R' to restart current level (shows confirmation dialog)
- **Checkpoint System**: When entering a new level, the game saves:
  - Current lives count (checkpoint)
  - Current score (checkpoint)
- **On Restart**:
  - Lives reset to checkpoint value (what you had when entering the level)
  - Score resets to checkpoint value
  - Seal always resets to size 1 (regardless of current size)
- **Strategic Choice**: Players must decide whether to restart (regain lost lives) or continue with fewer lives
- Example: Enter level 6 with 7 lives → lose 2 lives → restart → back to 7 lives

### State Management
- Lives tracked in Seal entity (starts with 1 life)
- Score managed by ScoreManager with visual feedback
- High scores persisted to localStorage
- Level progression with increasing difficulty
- Progress percentage shown (distance to goal)
- Goal completion triggers next level

#### Developer Menu
Activated by pressing **DD** (double-tap D quickly):

1. **Toggle God Mode**: Flying, super speed, invincibility, purple visual indicators
2. **Change Level**: Jump to any level with theme preview
3. **Physics Debug Settings**: Visualize collision boxes (green=physics body, blue=sprite bounds)
4. **Reset High Score**: Clear high score

**Navigation:** Arrow keys to navigate, Enter to select, ESC to go back/close

### Important Notes
- **ALWAYS advise user to restart the webserver** after modifying source files (especially src/main.js)
- `window.game` is exposed globally for testing purposes (set in src/main.js)
- **Game Info Descriptions** (src/utils/gameInfo.js): Keep descriptions qualitative, not quantitative. Use descriptive terms like "quickly", "from far away" instead of specific metrics
- **Fall Death System**: Uses Phaser's worldbounds event for detection
  - **CRITICAL**: `this.playerFalling = false` must be reset in GameScene.create() to prevent blocking subsequent falls after respawn
  - Collision disabled/re-enabled appropriately when falling/respawning

### Fixed Resolution Display
The game uses a fixed 1024x768 resolution with `Phaser.Scale.NONE` (no automatic scaling). Game is centered in window with black borders if window is larger.

### Enemy Behaviors

#### Hawk Enemy
Two-phase attack system:
- **Patrol**: Flies horizontally, periodically turning
- **Detection & Attack**: Ascends then dives at player when detected
- **Rest Cycle**: Shows 💤 sleep indicator and rests after attack
- **Death Cleanup**: Sleep indicator properly removed when destroyed

#### Orca Enemy (Ocean Theme)
Swims freely in ocean levels:
- **Swimming**: Moves without gravity
- **Detection & Attack**: Large detection radius, ascend-dive pattern
- **LETHAL**: Cannot be stomped - any contact kills the seal
- **Rest Cycle**: Same as hawk with 💤 indicator
- **Spawning**: Distributed throughout water

#### Beach Theme Features
Tropical daytime atmosphere with sun (display-once), palm trees, and wave patterns.

#### City Theme Features
Nighttime urban atmosphere:
- **3-Layer Building System** with varying opacity for depth
- **Windows** with varied lighting states
- **Celestial Objects**: Crescent moon (display-once) and blinking stars
- **Ground Fog** for atmospheric depth

#### Ocean Theme Features
Underwater gameplay:
- **Swimming Physics**: Free movement in all directions with momentum and water drag
- **Level Design**: Underwater platforms and open water
- **Orca Enemies**: Swim freely throughout water

#### Arctic Theme Features
Appears every 5 levels with special mechanics:
- **Polarbear Enemy**: 4-state AI (PATROL, ALERT, CHARGING, COOLDOWN)
  - **LETHAL**: Cannot be stomped
- **Ice Physics**: Variable slipperiness by platform type
- **Cracking Ice**: Breaks after standing on it
- **Floating Ice**: Bobbing platforms with extreme slipperiness
- **Visual Effects**: Aurora borealis, icebergs, snow particles

### Automated Testing

#### Test Framework
The game uses Playwright for end-to-end testing, which runs in headless Chromium on WSL/Linux environments. Originally attempted with Puppeteer but Playwright provides better WSL support and automatic browser management.

#### Test Commands
```bash
npm test            # Run tests in headless mode (screenshots disabled by default)
npm run test:headed # Show browser while testing  
npm run test:debug  # Debug mode with step-through
npm run test:ui     # Interactive UI mode
npm run test:report # View HTML test report

# Run with screenshots enabled (slower)
SKIP_SCREENSHOTS=false npm test

# Run a specific test by name pattern
npx playwright test -g "can make the seal jump"

# Run specific test in headed mode for debugging
npx playwright test -g "can make the seal jump" --headed
```

#### Test Performance Optimization
- Screenshots disabled by default (enable with `SKIP_SCREENSHOTS=false`)
- Tests use intelligent waits instead of fixed timeouts
- Performance: ~30s runtime

#### Test Mode Recommendations
- **Normal**: `npm test`
- **Debug specific**: `npx playwright test -g "test name" --headed`
- **With screenshots**: `SKIP_SCREENSHOTS=false npm test`
- **Interactive**: `npm run test:debug`

#### Test Structure
- **tests/game.spec.js**: Main test suite covering game startup, movement, jumping, positioning
- **tests/utils/**: Helper modules - screenshot utilities, game interactions, image analysis

#### Important Test Implementation Details
- **Canvas Focus**: Must focus canvas before keyboard events using `focusCanvas(page)`
- **Scene Transitions**: Wait for physics to settle (3+ seconds)
- **Game State Access**: Via `page.evaluate()` using `window.game`
- **Screenshots**: Saved to `tests/screenshots/`
- **Test Completion**: Ctrl+C to exit after "Serving HTML report" message
- **Physics Settlement**: Always wait for `body.blocked.down` before testing seal position

#### Critical Test Timing Patterns
**Scene Transition Waiting**: Tests must wait for scene transitions to complete before assertions
```javascript
// Wait for GameScene to be active with player ready
await page.waitForFunction(() => {
    if (!window.game || !window.game.scene) return false;
    const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
    const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
    return gameScene && gameScene.player && gameScene.player.sprite;
}, { timeout: 5000 });
```

**Jump Test Requirements**: Before testing jumps, ensure seal is on ground
```javascript
// Wait for seal to be standing on platform
await page.waitForFunction(() => {
    if (!window.game || !window.game.scene) return false;
    const activeScenes = window.game.scene.scenes.filter(scene => scene.scene.isActive());
    const gameScene = activeScenes.find(scene => scene.scene.key === 'GameScene');
    if (!gameScene || !gameScene.player || !gameScene.player.sprite || !gameScene.player.sprite.body) {
        return false;
    }
    // Check if seal is on ground (blocked.down means standing on something)
    return gameScene.player.sprite.body.blocked.down;
}, { timeout: 5000 });
```

**Key Timing Insights**:
- Seal must settle on platform before testing (check `body.blocked.down`)
- Scene transitions and player initialization take time - wait for completion
- Tests checking game state too early get null player or wrong scene

#### Test Configuration (playwright.config.js)
- Auto-starts dev server on port 3000
- Viewport: 1024x768 to match game resolution
- Screenshots on failure for debugging
- HTML reports for test results
- Test timeout: 90 seconds
- Tests may need 60-90 seconds to complete

#### Test Artifact Management
- **Cleanup**: Run `./scripts/clean-test-artifacts.sh` to remove all test artifacts
- **Gitignore**: Test artifacts automatically ignored (screenshots, test-results, playwright-report, logs)

#### Emoji Sprite Positioning Insights
- **Visual vs Mathematical Center**: Emoji sprites have transparent padding affecting positioning
- **Key findings**: Each seal size requires different empirically-tuned offsets for visual alignment
- **Testing approach**: Always verify visual appearance with screenshots, not mathematical calculations. Platform detection in tests should account for physics variations.

### Testing Helpers

#### Global Functions (available in browser console and tests)
- **`window.jumpToLevel(levelNumber)`**: Jump directly to any level without using menus
  - Uses the same proven logic as DevMenuScene for consistency
  - Stops any active GameScene and DevMenuScene
  - Restarts with specified level number
  - Returns true on success, false if game not initialized
  - Example: `window.jumpToLevel(101)` jumps to level 101

#### Base Helper Functions (from tests/utils/gameHelpers.js)
- **`initializeGame(page)`**: Core game loading and page navigation
- **`startGameFromMenu(page)`**: Menu → GameScene transition  
- **`handleInfoOverlay(page)`**: Dismiss info overlay if present
- **`waitForGameReady(page)`**: Wait for player, enemies, platforms to load
- **`jumpToSpecificLevel(page, levelNumber)`**: Jump to specific level with validation

#### Composed Helper Functions
- **`loadLevel(page, levelNumber)`**: Complete level loading (init → jump → overlay → ready)
- **`startGameWithInfoOverlay(page)`**: Start from menu and handle overlay