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
- **Seal** (player): Mario-style physics with variable jump height, double jump mechanic, size growth system (3 sizes), power-up states, physics body properly scaled with 70% of visual size to account for emoji padding and aligned to sprite bottom
- **Enemy**: Base class with five enemy types (human, polar_bear, seagull, orca, crab), each with unique AI behaviors
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
  - Arctic: icebergs, snow particles, aurora
  - Beach: sun, palm trees, waves
  - City: building silhouettes, windows, street lights
  - Ocean: wave patterns, ships, seagulls
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
- **D**: Toggle Developer Mode (flying, 5x speed, god mode)
- **ESC**: Return to menu

#### Scoring System
- Fish collection: 100 points × seal size (100/200/300)
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
- Lives and size tracked in Seal entity (3 lives, 3 size levels)
- Score managed by ScoreManager with visual feedback
- High scores persisted to localStorage
- Level progression with increasing difficulty
- Progress percentage shown (distance to goal)
- Goal completion triggers next level

#### Developer Mode
Activated with the **D** key for testing and debugging:
- **Flying**: Gravity disabled, arrow keys control vertical movement
- **Super Speed**: 5x normal movement speed
- **God Mode**: Invincible to all damage (enemies, falls)
- **Visual Indicators**: Purple tint, "DEV MODE" UI text, particle trail
- **Fish Collection**: Still works normally for testing
- **Camera Flash**: Purple flash when enabled, cyan when disabled

### Important Notes
- do not `npm run dev` yourself, but ask the user to do it
- Game resolution is 1024x768
- All platforms are guaranteed jumpable through gap validation
- Physics bodies properly scaled to 70% of visual size and bottom-aligned to prevent floating appearance
- When seal grows after eating fish, uses updateFromGameObject() to let Phaser handle physics body positioning
- Different lift amounts based on movement: 2px when moving horizontally, 3px when stationary
- Time is properly reset when scene restarts to prevent negative time values
- Debug flag DISABLE_GROWING in constants.js can be set to true to test without size changes