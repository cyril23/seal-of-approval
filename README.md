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
- **ESC**: Return to menu

### Game Mechanics

- **Lives System**: Start with 3 lives, checkpoint saves on level entry
- **Seal Growth**: Grows through 3 sizes when eating fish, shrinks when damaged
- **Ghost Mode**: Temporary invulnerability after taking damage (when size > 1)
- **Scoring**: Fish (100), enemies (200), distance bonus, level completion (1000)
- **Power-ups**: Star (invincibility), Speed boost, Magnet (attracts fish), Clock (time bonus), Heart (extra life), Mushroom (size growth)
- **Level Progression**: Complete levels by reaching the goal flag
- **High Scores**: Persistent high score tracking

### Enemies

- **Human** 🚶: Walks back and forth on platforms
- **Crab** 🦀: Scuttles quickly with occasional hops
- **Hawk** 🦅: Patrols and dive-attacks, shows 💤 when resting
- **Orca** 🐋: Ocean predator with large detection range (cannot be stomped)
- **Polar Bear** 🐻‍❄️: Arctic hunter with charge attack (cannot be stomped)

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