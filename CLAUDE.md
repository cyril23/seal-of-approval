# CLAUDE.md - Seal of Approval

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Seal** (player): Mario-style physics with variable jump height, double jump mechanic, power-up states. Physics body scaled to 75% width and 50% height of sprite, with offsetY=2 for perfect visual alignment
- **Enemy**: Base class with four enemy types (human, hawk, orca, crab), each with unique AI behaviors
- **Collectible**: Power-ups and fish with magnetic attraction system, physics bodies update during animations for reliable collision

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
- Emoji characters rendered to canvas textures in PreloadScene
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
- Enemy and collectible placement based on platform positions
- Safety ground platforms every 2000px as fallback

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

#### Controls
- **Arrow Keys**: Move left/right (all directions in Developer Mode)
- **Spacebar**: Jump (hold for higher), press again for double jump
- **P**: Pause game
- **M**: Mute audio
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
- Player has 3 lives
- Death occurs from enemy contact or falling below screen (fall death bypasses invincibility)
- Respawn at level start with 3 seconds invincibility
- Camera flash and position reset on respawn

### State Management
- Lives tracked in Seal entity (3 lives)
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

3. **Reset High Score**: Resets the high score to 0
   - Shows current high score value
   - Displays confirmation when reset

**Navigation:**
- **Arrow Keys**: Navigate menu options
- **Enter**: Activate selected option
- **ESC**: From submenu returns to main menu, from main menu closes everything

### Important Notes
- do not `npm run dev` yourself, but ask the user to do it
- **ALWAYS advise user to restart the webserver** after modifying source files (especially src/main.js)
- Game resolution is 1024x768
- All platforms are guaranteed jumpable through gap validation
- Seal physics body: 75% width, 50% height, offsetY=2 for perfect visual alignment (seal sits at Y=689 on platform at Y=704)
- Time is properly reset when scene restarts to prevent negative time values
- `window.game` is exposed globally for testing purposes (set in src/main.js)

### Arctic Theme Features
The Arctic theme (appears every 5 levels) includes special gameplay mechanics:
- **Polarbear Enemy**: Intelligent AI with 4-state behavior system
  - PATROL: Walks with edge detection to avoid falling
  - ALERT: Detects player within 400x250px range, shows exclamation mark
  - CHARGING: Rushes at 240 speed with visual effects, stops at edges
  - COOLDOWN: Recovery period with breathing animation
- **Ice Physics**: Slippery platforms with reduced friction (0.15)
- **Cracking Ice**: Some platforms break after 2 seconds of standing
- **Floating Ice**: Platforms that bob up and down
- **Visual Effects**: Aurora borealis, icebergs, snow particles
- **Audio**: Special roar, charge, and ice break sound effects

### Automated Testing

#### Test Framework
The game uses Playwright for end-to-end testing, which runs in headless Chromium on WSL/Linux environments. Originally attempted with Puppeteer but Playwright provides better WSL support and automatic browser management.

#### Test Commands
```bash
npm test            # Run tests in headless mode
npm run test:headed # Show browser while testing  
npm run test:debug  # Debug mode with step-through
npm run test:ui     # Interactive UI mode
npm run test:report # View HTML test report
```

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
- **Seal Position**: Y=689 when sitting flush on platform (platform top at Y=704)
- **Jump Timing**: Use 200ms delay after pressing Space to catch upward motion (not 500ms)
- **Canvas Dimensions**: May be scaled by browser (1174x880 instead of 1024x768)
- **Test Completion**: Tests output "Serving HTML report at http://localhost:9323. Press Ctrl+C to quit." when done - need to Ctrl+C to exit
- **Test Timeouts**: Tests may take 30-60 seconds to complete, be patient
- **Test Failures**: If tests fail with timeouts, ensure the dev server is running and restart it after source changes
- **Physics Settlement**: Always wait for `body.blocked.down` to be true before testing seal position

#### Test Configuration (playwright.config.js)
- Auto-starts dev server on port 3000
- Viewport: 1024x768 to match game resolution
- Screenshots on failure for debugging
- HTML reports for test results
- Chromium browser with WSL-optimized settings
- Tests may need 30-60 seconds to complete due to physics settling

#### Emoji Sprite Positioning Insights
- **Visual vs Mathematical Center**: Emoji sprites have transparent padding that affects positioning
- **Actual measurements**: 
  - Sprite is 48px tall (32px base × 1.5 scale)
  - Mathematical sprite center would be 24px above platform (half of 48px sprite)
  - Visual center is actually 15px above platform due to emoji padding
  - Physics body: 36px width (75% of 48px), 24px height (50% of 48px)
  - Physics body offsetY=2 achieves perfect visual alignment
  - When sitting flush: Seal Y=689, Platform top Y=704, Physics body bottom=704
- **Key findings from empirical testing**:
  - offsetY = 0-1: Seal appears slightly underground/embedded in platform
  - offsetY = 2: PERFECT - Seal sits visually flush on platform
  - offsetY = 3+: Seal begins to float visibly above platform
  - The 9px difference from mathematical expectations (689 vs expected 680) is due to emoji visual weight distribution
- **Testing approach**: 
  - Always verify visual appearance with screenshots, not just mathematical calculations
  - Empirical testing is crucial - what looks right visually may differ from calculations
  - Test expectations must match visual reality, not theoretical calculations
  - Platform detection in tests should look for platforms within 25px of expected position to account for physics variations