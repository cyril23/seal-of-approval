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
- **Seal** (player): Mario-style physics with variable jump height, double jump mechanic, power-up states, and 3-size growth system
  - **Size System**: Seal grows when eating fish (sizes 1-3), shrinks when taking damage, resets to size 1 per level
  - **Physics Body Tuning**: Complex empirically-tuned collision boxes for each size due to emoji sprite irregularities:
    - Size 1 (scale 1.5): 65%×45% body, offsets [-1,4] - negative X due to emoji asymmetry
    - Size 2 (scale 2.0): 43%×35% body, offsets [2,3] - proportionally smaller collision
    - Size 3 (scale 3.0): 27.5%×22% body, offsets [3,5] - dramatically reduced for visual accuracy
  - **Critical**: These values are empirically tuned using Physics Debug overlay - do not change without visual testing
- **Enemy**: Base class with four enemy types (human, hawk, orca, crab), each with unique AI behaviors
- **Collectible**: Power-ups and fish with theme-specific behavior. Fish in ocean levels float with no gravity and gentle vertical bobbing animation. Fish in non-ocean levels fall with gravity to platforms. Star and magnet power-ups rotate continuously

#### Manager Classes
- **LevelGenerator**: Procedurally generates side-scrolling levels with intelligent gap validation, adds stepped bridge platforms for vertical gaps, skips overlapping platforms, ensures all jumps are possible within double jump distance (220px horizontal, 150px up, 250px down)
- **ScoreManager**: Handles scoring with visual feedback popups showing point sources (distance, fish, enemies)
- **AudioManager**: Web Audio API-based sound system with separate menu and in-game background music tracks, all sounds generated programmatically

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
- Emoji characters rendered to canvas textures in PreloadScene using consistent naming (LIFE: ❤️, TIME: ⏰)
- Platform textures created procedurally with gradient effects
- Detailed themed backgrounds with visual elements:
  - Beach: sun, palm trees, waves
  - City: building silhouettes, windows, street lights
  - Ocean: wave patterns, ships, hawks
  - Harbor: cranes, containers, docks

#### Level Generation Algorithm
Located in `LevelGenerator.js`:
- Generates 10x screen width (10,240px) side-scrolling levels
- Creates start and end platforms with goal flag at finish
- Procedurally places 15-25 platforms with gap constraints (120-200px)
- Validates all gaps are jumpable with stepped platforms for vertical gaps, wider bridge platforms (10 tiles) for reliability
- 15% of platforms are animated (moving vertically)
- Safety ground platforms every 2000px as fallback

#### Enemy Spawning System
- **Even X-axis distribution**: Enemies spawn evenly across the level width, preventing clustering
- **Platform-based placement**: Each enemy is placed on the nearest valid platform to its target X position
- **First/last platform exclusion**: Start and end platforms never have enemies for safe spawn/goal areas
- **Difficulty scaling**:
  - Base formula: `MIN_ENEMIES (8) + levelNumber`
  - MAX_ENEMIES: 1000 (no artificial cap)
  - Examples: Level 1 = 9 enemies, Level 6 = 14 enemies, Level 101 = 109 enemies (limited by platforms)
- **Theme consistency**: All themes have the same enemy count for predictable difficulty

#### Collectible Spawning
- Collectible spawning is theme-dependent:
  - **Ocean theme**: Fish spawn at various heights throughout the water (Y: 100-600px) with gravity disabled, creating an underwater environment
  - **Non-ocean themes**: Collectibles spawn above platforms and fall naturally with gravity

#### Powerup Spawn Distribution
Controlled powerup spawning implemented in `spawnSpecialPowerups()` method (src/managers/LevelGenerator.js:480-539):
- **Magnets**: Exactly 2 per level at 25-35% and 55-65% progress
- **Stars (Invincibility)**: 1-2 per level at 20-80% progress
- **Speed Boosts**: 0-2 per level at 20-90% progress  
- **Time Bonuses**: 1-3 per level at 50-95% progress
- **Extra Lives**: 1-3 per level at 20-95% progress
- All powerups use `findNearestPlatformAtProgress()` helper for placement
- Positions have ±5% variance for unpredictability

#### Collectible Animations
Theme-specific animations for collectibles:
- **Ocean fish**: Gentle vertical bobbing (8px amplitude, 2 second period, Sine.inOut easing)
- **Non-ocean fish**: No animation, natural physics-based movement
- **Star/Magnet power-ups**: Continuous 360° rotation (3 second period)
- **Other power-ups**: Static, no animation

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
Activated by pressing **DD** (double-tap D quickly) to open the main developer menu:

**Main Menu Options:**
1. **Toggle God Mode**: Activates/deactivates developer mode features
   - **Flying**: Gravity disabled, arrow keys control vertical movement
   - **Super Speed**: 5x normal movement speed
   - **God Mode**: Invincible to all damage (enemies, falls)
   - **Visual Indicators**: Purple tint, "DEV MODE" UI text, particle trail
   - **Fish Collection**: Still works normally for testing
   - **Camera Flash**: Purple flash when enabled, cyan when disabled

2. **Change Level**: Opens submenu for level selection
   - **Level Selection**: Choose any level to jump to
   - **Theme Preview**: Shows theme name and color for each level
   - **Navigation**: Arrow keys to select, Enter to jump, ESC to go back to main menu
   - **Theme Rotation**: Themes cycle deterministically: Beach → City → Ocean → Harbor
   - **Level Display**: Shows 20 levels before and after current level

3. **Physics Debug Settings**: Toggle collision box visualization (separate from God Mode)
   - **Physics Debug Overlay**: Shows real-time collision boundaries
   - **Green Rectangle**: Physics body collision box (actual hitbox)
   - **Green Dot**: Center point of physics body
   - **Blue Rectangle**: Visual sprite bounds (for comparison)
   - **Purpose**: Critical for tuning size system collision boxes at all sizes
   - **Benefit**: Test normal jumping/gravity while seeing collision boundaries

4. **Reset High Score**: Resets the high score to 0
   - Shows current high score value
   - Displays confirmation when reset

**Navigation:**
- **Arrow Keys**: Navigate menu options
- **Enter**: Activate selected option
- **ESC**: From submenu returns to main menu, from main menu closes everything

### Important Notes
- do not `npm run dev` yourself, but ask the user to do it
- **ALWAYS advise user to restart the webserver** after modifying source files (especially src/main.js)
- Game resolution is 1024x768 (fixed, no scaling)
- All platforms are guaranteed jumpable through gap validation
- Seal physics body: **Size-specific tuned values** - Size 1: 65%×45% (offsetY=4), Size 2: 43%×35% (offsetY=3), Size 3: 27.5%×22% (offsetY=5) with custom offsets for perfect visual alignment
- Time is properly reset when scene restarts to prevent negative time values
- `window.game` is exposed globally for testing purposes (set in src/main.js)
- **Game Info Descriptions** (src/utils/gameInfo.js): Keep descriptions qualitative, not quantitative. Avoid specific metrics like "2 seconds", "400px range", or exact speeds. Use descriptive terms like "quickly", "after standing", "from far away" instead
- **Fall Death System**: Uses Phaser's worldbounds event for detection (GameScene.js:116)
  - World bounds extended by 200px below screen (GAME_HEIGHT + 200) for visual fall effect
  - **CRITICAL**: `this.playerFalling = false` must be reset in GameScene.create() to prevent blocking subsequent falls after respawn
  - Collision disabled with `setCollideWorldBounds(false)` when falling to prevent sprite sticking at boundary
  - Re-enabled with `setCollideWorldBounds(true)` on respawn for normal physics

### Fixed Resolution Display
The game uses a fixed 1024x768 resolution without any dynamic scaling:
- **Scale Mode**: Set to `Phaser.Scale.NONE` - no automatic scaling or zooming
- **Window Requirements**: Users need a browser window of at least 1024x768 pixels to see the full game
- **No Resize Handling**: Window resize events are not handled - game stays at fixed size
- **Centering**: Game is centered in the window using `Phaser.Scale.CENTER_BOTH`
- **Behavior**:
  - Smaller windows will clip/cut off parts of the game
  - Larger windows will show black borders around the centered 1024x768 game area
  - No zoom issues or scaling problems regardless of window resizing

### Enemy Behaviors

#### Hawk Enemy
The hawk enemy features a sophisticated two-phase attack system:
- **Patrol**: Flies horizontally at speed 50, turning every 200px
- **Detection**: Scans for player within 500px radius
- **Attack Sequence**:
  1. **Ascend Phase**: Rises slowly (60 speed) for 800ms when detecting player
  2. **Dive Phase**: Calculates straight-line trajectory to player's stored position, dives at 250 speed
- **Rest Cycle**: After attack, hawk becomes tired for 3 seconds
  - Shows 💤 sleep indicator above hawk
  - Physics completely disabled during rest
  - Automatically wakes up and resumes hunting after 3 seconds
- **Death Cleanup**: Sleep indicator properly removed when hawk is destroyed

#### Orca Enemy (Ocean Theme)
The orca enemy swims freely in ocean levels with enhanced capabilities:
- **Swimming**: Moves through water without gravity, patrol speed 80 (faster than hawk's 50)
- **Detection**: Huge detection radius of 750px (1.5x hawk's range)
- **Attack Pattern**: Identical to hawk - ascend then dive, but with 350 dive speed
- **LETHAL**: Cannot be stomped - any contact kills the seal (like polar bears)
- **Rest Cycle**: Same as hawk with 💤 indicator and 3-second recovery
- **Spawning**: Distributed evenly throughout the water, not restricted to platforms

#### Beach Theme Features
The Beach theme features a tropical daytime atmosphere:
- **Visual Elements**:
  - **Sun**: Display-once at fixed position (x: width-150, y: 150), doesn't repeat with background tiles
  - **Palm Trees**: Three distinct coconut palms with detailed bark texture and dense fronds
  - **Wave Patterns**: Horizontal wave lines with sine wave undulation

#### City Theme Features
The City theme features a nighttime urban atmosphere with layered depth:
- **Visual Enhancements**:
  - **Sky Gradient**: Smooth 100-step gradient from dark blue (0x0A1929) to lighter blue (0x2E5266)
  - **3-Layer Building System**: 
    - Background buildings at 35% opacity (far distance)
    - Mid-layer building (3rd building) at 50% opacity with 50% opacity windows
    - Foreground buildings at 80% opacity (main layer)
  - **Antennas**: 50px tall on buildings with height ≥ 350, multiple crossbars, no red lights
  - **Window Variety**: 70% yellow (lit), 20% dark gray (unoccupied), 10% light gray
  - **Ground Fog**: 25% opacity gradient at bottom 150px for atmospheric depth
- **Celestial Objects**:
  - **Crescent Moon**: Display-once at fixed position (x: width-150, y: 100), doesn't repeat
  - **Blinking Stars**: 15 stars per screen, repeating pattern across entire level
    - 30% blink with slow sine wave (3-5 second cycles)
    - Positioned in upper 30% of screen to avoid buildings
    - White color with 0.5-2px radius variations

#### Ocean Theme Features
The Ocean theme features underwater gameplay with swimming mechanics:
- **Swimming Physics**: Seal swims freely with momentum-based movement
  - Arrow keys control movement in ALL directions (up/down/left/right)
  - Smooth inertia with 0.92 water drag and 0.15 acceleration factor
  - No gravity underwater, bubble particle effects while swimming
- **Level Design**: Underwater platforms for collectibles, open water for swimming
- **Orca Enemies**: Swim freely throughout the water (see Orca Enemy section above)

#### Arctic Theme Features
The Arctic theme (appears every 5 levels) includes special gameplay mechanics:
- **Polarbear Enemy**: Intelligent AI with 4-state behavior system
  - PATROL: Walks with edge detection to avoid falling
  - ALERT: Detects player within 400x250px range, shows exclamation mark
  - CHARGING: Rushes at 240 speed with visual effects, stops at edges
  - COOLDOWN: Recovery period with breathing animation
  - **LETHAL**: Cannot be stomped - any contact kills the seal
- **Ice Physics**: Variable slipperiness based on platform type
  - Standard ice (light blue): Normal ice physics (acceleration=0.5, drag=0.95)
  - Glacier ice (bright blue): Extreme slipperiness (acceleration=0.3, drag=0.98)
- **Cracking Ice**: Glacier blue platforms with visible crack patterns, break after 2 seconds
- **Floating Ice**: Glacier blue platforms that bob up and down, extremely slippery
- **Visual Effects**: Aurora borealis, icebergs, snow particles
- **Audio**: Special roar, charge, and ice break sound effects

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
- **Screenshots are disabled by default** to reduce disk I/O and simplify test runs
- Screenshots only save when `SKIP_SCREENSHOTS=false` is set
- All screenshots capture canvas-only by default (cleaner, no browser chrome)
- Tests use intelligent waits instead of fixed timeouts where possible
- Only essential screenshots are taken (e.g., for image analysis tests)
- Performance: ~30s with screenshots disabled, ~30.4s with screenshots enabled

#### When to Advise Different Test Modes
When helping users with test issues, Claude should recommend:
1. **Normal test run**: `npm test` - For CI/CD and general testing
2. **Debug specific test**: `npx playwright test -g "test name" --headed` - To see what's happening
3. **With screenshots**: `SKIP_SCREENSHOTS=false npm test` - Only when visual artifacts are needed
4. **Interactive debugging**: `npm run test:debug` - For step-by-step debugging

#### Test Structure
- **tests/game.spec.js**: Main test suite covering:
  - Game startup and menu interaction (verifies scene transition from MenuScene to GameScene)
  - Seal movement with arrow keys (verifies X position changes after arrow key press)
  - Jump mechanics with spacebar (verifies Y position decreases during jump)
  - Seal position verification (ensures seal sits flush on platforms without floating)
  - Screenshot capture capabilities (both full page and canvas-only)
  
- **tests/utils/**: Helper modules for test support:
  - `screenshot.js`: Screenshot capture utilities
  - `gameHelpers.js`: Game interaction functions (keyboard, focus, state inspection)
  - `imageAnalysis.js`: Mock image analysis for future visual testing

#### Important Test Implementation Details
- **Canvas Focus**: Tests must focus the canvas element before sending keyboard events using `focusCanvas(page)`
- **Scene Transitions**: Tests wait for scene changes after actions (3+ seconds for physics to settle)
- **Game State Access**: Tests can inspect internal game state via `page.evaluate()` using `window.game`
- **Screenshots**: Automatically saved to `tests/screenshots/` with timestamps
- **Seal Position**: Y=689.6 when sitting flush on platform (platform top at Y=704)
- **Jump Timing**: Use 200ms delay after pressing Space to catch upward motion (not 500ms)
- **Canvas Dimensions**: May be scaled by browser (1174x880 instead of 1024x768)
- **Test Completion**: Tests output "Serving HTML report at http://localhost:9323. Press Ctrl+C to quit." when done - need to Ctrl+C to exit
- **Test Timeouts**: Tests take 60-90 seconds to complete, be patient
- **Test Failures**: If tests fail with timeouts, ensure the dev server is running and restart it after source changes
- **Physics Settlement**: Always wait for `body.blocked.down` to be true before testing seal position

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
- Seal starts at Y=689 when properly settled on platform (not mid-air)
- Jump tests fail if seal hasn't settled - initial Y might be ~598 (falling) instead of 689 (on platform)
- Scene transitions from MenuScene to GameScene take time - must wait for completion
- Player object doesn't exist immediately after scene transition - wait for it
- Tests that check game state too early get null player or wrong scene

#### Test Configuration (playwright.config.js)
- Auto-starts dev server on port 3000
- Viewport: 1024x768 to match game resolution
- Screenshots on failure for debugging
- HTML reports for test results
- Chromium browser with WSL-optimized settings
- **Test timeout**: 90 seconds (increased for reliability)
- **Test workers**: 16 workers for faster parallel execution (1 on CI)
- Tests may need 60-90 seconds to complete due to physics settling

#### Test Artifact Management
- **Complete cleanup**: Run `./scripts/clean-test-artifacts.sh` to remove all test artifacts
- **Cleanup behavior**: Script removes ALL files instead of keeping recent ones
- **Gitignore configuration**: Test artifacts automatically ignored:
  - `tests/screenshots/` - Test screenshot outputs
  - `test-results/` - Playwright test results
  - `playwright-report/` - HTML test reports
- **Cleanup script location**: `scripts/clean-test-artifacts.sh`
- **What gets cleaned**:
  - All test screenshots in tests/screenshots/
  - All test-results directory contents
  - All playwright-report directory contents  
  - All log files in logs/ directory
  - All screenshots in logs/ directory

#### Emoji Sprite Positioning Insights
- **Visual vs Mathematical Center**: Emoji sprites have transparent padding that affects positioning
- **Actual measurements**: 
  - Sprite is 48px tall (32px base × 1.5 scale)
  - Mathematical sprite center would be 24px above platform (half of 48px sprite)
  - Visual center is actually 15px above platform due to emoji padding
  - Physics body: 36px width (75% of 48px), 24px height (50% of 48px)
  - Physics body offsetY=4 achieves perfect visual alignment (size 1)
  - When sitting flush: Seal Y=689.6, Platform top Y=704, Physics body bottom=704
- **Key findings from empirical testing**:
  - Size 1 (scale 1.5): offsetY = 4 - Seal sits visually flush on platform at Y=689.6
  - Size 2 (scale 2.0): offsetY = 3 - Proportionally adjusted for larger size
  - Size 3 (scale 3.0): offsetY = 5 - Further adjusted for maximum size
  - The Y position varies slightly with each size due to empirically tuned offsets
- **Testing approach**: 
  - Always verify visual appearance with screenshots, not just mathematical calculations
  - Empirical testing is crucial - what looks right visually may differ from calculations
  - Test expectations must match visual reality, not theoretical calculations
  - Platform detection in tests should look for platforms within 25px of expected position to account for physics variations

### Testing Helpers

#### Global Functions (available in browser console and tests)
- **`window.jumpToLevel(levelNumber)`**: Jump directly to any level without using menus
  - Uses the same proven logic as DevMenuScene for consistency
  - Stops any active GameScene and DevMenuScene
  - Restarts with specified level number
  - Returns true on success, false if game not initialized
  - Example: `window.jumpToLevel(101)` jumps to level 101

#### Base Helper Functions (from tests/utils/gameHelpers.js)
Atomic helper functions that can be composed together:

- **`initializeGame(page)`**: Core game loading and page navigation
  - Navigates to game page with networkidle wait
  - Calls waitForGameLoad() and settles timing
  - Use at start of tests to ensure clean game state

- **`startGameFromMenu(page)`**: Menu → GameScene transition
  - Focuses canvas and presses Space
  - Waits for GameScene to be active with 30s timeout

- **`handleInfoOverlay(page)`**: Info overlay management  
  - Detects if info overlay is showing (appears on level 1)
  - Dismisses overlay if present by pressing Space
  - Waits for game to resume normally

- **`waitForGameReady(page)`**: Comprehensive game state validation
  - Waits for player, enemies, platforms to be fully loaded
  - Uses 30s timeout for reliability
  - Call before accessing game state in tests

- **`jumpToSpecificLevel(page, levelNumber)`**: Level jumping with validation
  - Uses global window.jumpToLevel() function
  - Includes error handling and success validation
  - Waits for level transition to complete

#### Composed Helper Functions
High-level functions that combine base helpers:

- **`loadLevel(page, levelNumber)`**: Complete level loading workflow
  - Calls: initializeGame() → jumpToSpecificLevel() → handleInfoOverlay() → waitForGameReady()
  - Use for enemy scaling tests and level-specific testing

- **`startGameWithInfoOverlay(page)`**: Game startup from menu 
  - Calls: startGameFromMenu() → handleInfoOverlay() → waitForGameReady()
  - Use for basic game tests starting from menu (assumes page already loaded)