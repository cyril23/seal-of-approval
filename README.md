# Seal of Approval

A retro 8-bit style side-scrolling platformer game featuring a seal character navigating through themed levels collecting fish and avoiding enemies.

## About

Seal of Approval is a browser-based platformer game built with Phaser 3 and implemented using [Claude Code](https://claude.ai/code). The game features classic Mario-style physics with modern gameplay mechanics including double jumping, power-ups, and procedurally generated levels.

## Features

- **Retro 8-bit Style**: Emoji-based sprites and pixel-perfect visuals at 1024x768 resolution
- **Side-scrolling Platformer**: Smooth camera following with physics-based movement
- **Multiple Themes**: Beach, City, Ocean, Harbor, and Arctic environments
- **Enemy Variety**: Five unique enemy types with distinct AI behaviors
- **Power-up System**: Invincibility stars, speed boosts, magnets, time bonuses, and extra lives
- **Procedural Levels**: Dynamically generated platforms with gap validation
- **Audio**: Programmatically generated sound effects and music using Web Audio API
- **Developer Tools**: Built-in developer menu with god mode and level selection

## Gameplay

Control a seal character through themed levels, collecting fish and avoiding enemies:

- **Arrow Keys**: Move left/right
- **Spacebar**: Jump (hold for higher jumps, press again for double jump with fart effect 💨)
- **P**: Pause game
- **M**: Mute audio
- **R**: Restart level (keeps current lives and score, resets seal to size 1)
- **I**: Toggle level info overlay
- **ESC**: Return to menu

### Game Mechanics

- **Lives System**: Start with 1 life, gain extra lives from heart power-ups
- **Checkpoint System**: Red flag 🚩 at 50% of level width - respawn there after death if reached
- **Seal Growth**: Grows through 3 sizes when eating fish, shrinks when damaged
- **Ghost Mode**: Temporary invulnerability after taking damage (when size > 1)
- **Power-ups**: Star (invincibility), Speed boost, Magnet (attracts fish), Clock (time bonus), Heart (extra life), Mushroom (size growth)
- **Level Progression**: Complete levels by reaching the goal flag, seal size preserved between levels
- **Death & Respawn**: Lose 1 life and reset to size 1, respawn at checkpoint if reached (sky drop) or level start
- **High Scores**: Persistent high score tracking

### Enemies

- **Human** 🚶: Walks back and forth on platforms
- **Crab** 🦀: Scuttles quickly with occasional hops
- **Hawk** 🦅: Patrols and dive-attacks, shows 💤 when resting
- **Orca** 🐋: Ocean predator with large detection range (cannot be stomped)
- **Polar Bear** 🐻‍❄️: Arctic hunter with charge attack (cannot be stomped)

## Scoring System

### Base Points

- **Fish Collection**: 100 points per fish 🐟
- **Enemy Defeat**: Points vary by enemy type (when stomped or destroyed while invincible)
  - Crab: 150 points
  - Human: 200 points
  - Hawk: 250 points
  - Polar Bear: 300 points (invincibility required - cannot stomp)
  - Orca: 400 points (invincibility required - cannot stomp)
- **Level Completion Bonus**: 1000 points for reaching the goal flag
- **Time Bonus**: 10 points × remaining seconds (awarded at level completion)
- **Distance Bonus**: 10 points per 100 pixels traveled (awarded at level end or game over)

### Combo Multiplier

Consecutive scoring actions within 3 seconds trigger the combo system:
- **Multiplier Formula**: 1 + (combo count × 0.5)
- **Example Progression**:
  - 1st fish/enemy: 1.0x multiplier (100 points for fish)
  - 2nd consecutive: 1.5x multiplier (150 points for fish)
  - 3rd consecutive: 2.0x multiplier (200 points for fish)
  - 4th consecutive: 2.5x multiplier (250 points for fish)
  - And so on...
- **Reset**: Combo resets after 3 seconds of no scoring actions
- **Visual Feedback**: Yellow score popups for combos, "COMBO x#!" text appears for 3+ combos

### Scoring Strategy Tips

- **Maintain Combos**: Chain fish collection and enemy defeats for maximum points
- **Speed Completion**: Finish levels quickly for higher time bonuses
- **Explore Thoroughly**: Travel the full level width for distance bonus points
- **Use Power-ups**: Invincibility allows defeating lethal enemies for high points
- **Perfect Runs**: Combine all bonuses for maximum score potential

## Technical Details

- **Engine**: Phaser 3 with Vite build system
- **Resolution**: 1024x768 pixels
- **Physics**: Arcade physics with custom variable jump mechanics
- **Sprites**: Dynamically generated from emoji characters
- **Audio**: Web Audio API for procedural sound generation
- **Testing**: Playwright end-to-end testing suite

## Development

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

```bash
git clone <repository-url>
cd retro8bit
npm install
```

### Development Commands

```bash
npm run dev         # Start development server on port 3000
npm run build       # Build for production
npm run preview     # Preview production build
npm test            # Run automated tests
```

### Architecture

The game follows a component-based architecture with:

- **Scene Management**: PreloadScene, MenuScene, GameScene, GameOverScene
- **Entity System**: Player (Seal), Enemies, Collectibles extending Phaser sprites
- **Manager Classes**: LevelGenerator, ScoreManager, AudioManager
- **Constants**: Centralized game configuration

### Developer Features

Press **DD** (double-tap D) to open the developer menu with options for:
- God Mode (flying, invincibility, super speed)
- Level selection with theme preview
- Physics Debug mode (visualize collision boxes)
- High score reset

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Implementation

This game was implemented using [Claude Code](https://claude.ai/code), Anthropic's AI-powered development assistant, demonstrating the capabilities of AI-assisted game development.