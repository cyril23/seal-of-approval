export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;
export const TILE_SIZE = 16;
export const LEVEL_WIDTH = 10240; // 10x screen width for side-scrolling

// Debug settings
export const DEBUG = {
    PHYSICS_ENABLED: false,  // enable only when tuning bounding boxes
    LOG_LEVEL: 'debug'       // 'none', 'info', or 'debug' - set to 'debug' for development
};

export const PHYSICS = {
    GRAVITY: 800,
    JUMP_VELOCITY: -400,
    JUMP_VELOCITY_BOOST: -120,
    MOVE_SPEED: 160,
    MAX_VELOCITY_X: 200,
    MAX_VELOCITY_Y: 600,
    DRAG: 0.8
};

export const PLAYER = {
    INITIAL_LIVES: 1,
    INVINCIBLE_TIME: 2000,
    BLINK_RATE: 100
};

export const LEVEL = {
    TIME_LIMIT: 180, // More time for longer levels
    MIN_PLATFORMS: 15,  // Increased for better coverage
    MAX_PLATFORMS: 25,  // Increased for more platforms
    MIN_ENEMIES: 8,
    MAX_ENEMIES: 1000,
    MIN_COLLECTIBLES: 20,
    MAX_COLLECTIBLES: 40,
    PLATFORM_HEIGHT_VARIANCE: 200,
    MIN_GAP: 120,  // Reduced for easier jumps
    MAX_GAP: 200,  // Further reduced to ensure all gaps are jumpable
    MAX_GAP_ARCTIC: 150,  // Even smaller gaps for Arctic theme with polar bears
    GOAL_POSITION: LEVEL_WIDTH - 200
};

export const SCORING = {
    FISH: 100,
    ENEMY_DEFEAT: 200,
    TIME_BONUS_MULTIPLIER: 10,
    COMBO_MULTIPLIER: 1.5,
    DISTANCE_POINTS: 10, // Points per 100px traveled
    LEVEL_COMPLETE_BONUS: 1000
};

export const CAMERA = {
    DEADZONE_WIDTH: 200,
    DEADZONE_HEIGHT: 200,
    LERP_X: 0.1,
    LERP_Y: 0.1
};

export const POWERUPS = {
    STAR: {
        DURATION: 10000,
        TYPE: 'invincibility'
    },
    SPEED: {
        DURATION: 15000,
        MULTIPLIER: 2,
        TYPE: 'speed'
    },
    MAGNET: {
        DURATION: 10000,
        RANGE: 100,
        TYPE: 'magnet'
    },
    TIME: {
        BONUS: 30,
        TYPE: 'time'
    },
    LIFE: {
        BONUS: 1,
        TYPE: 'life'
    }
};

export const ENEMIES = {
    HUMAN: {
        SPEED: 50,
        POINTS: 200,
        TYPE: 'human'
    },
    HAWK: {
        SPEED: 60,
        DIVE_SPEED: 250,
        HOVER_HEIGHT: 100,
        DETECTION_RANGE: 500,  // Increased from 350
        DIVE_TRIGGER_RANGE: 150,
        FLY_RADIUS: 250,
        PATROL_SPEED: 50,
        DIVE_COOLDOWN: 1000,
        POINTS: 250,
        TYPE: 'hawk'
    },
    ORCA: {
        PATROL_SPEED: 80,  // Faster than hawk (50)
        DIVE_SPEED: 350,   // Much faster dive than hawk (250)
        DETECTION_RANGE: 750,  // 1.5x hawk's range (500)
        DIVE_COOLDOWN: 1000,
        POINTS: 400,
        TYPE: 'orca'
    },
    CRAB: {
        SPEED: 100,
        POINTS: 150,
        TYPE: 'crab'
    },
    POLARBEAR: {
        PATROL_SPEED: 40,
        CHARGE_SPEED: 240,
        DETECTION_RANGE_X: 240,  // Reduced by 40% from 400 for better gameplay balance
        DETECTION_RANGE_Y: 150,  // Reduced by 40% from 250 for better gameplay balance
        ESCAPE_RANGE: 300,       // Reduced by 40% from 500 to match reduced detection
        ALERT_DURATION: 1000,
        CHARGE_MAX_DISTANCE: 500,
        COOLDOWN_DURATION: 2000,
        POINTS: 300,
        STOMP_MULTIPLIER: 2,
        TYPE: 'polarbear'
    }
};

export const THEMES = {
    BEACH: {
        name: 'beach',
        background: '#F4E4C1',
        platform: '#D4A373',
        enemies: ['crab', 'human'],
        tint: 0xF4E4C1
    },
    CITY: {
        name: 'city',
        background: '#8B8B8B',
        platform: '#5A5A5A',
        enemies: ['human', 'hawk'],
        tint: 0x8B8B8B
    },
    OCEAN: {
        name: 'ocean',
        background: '#006994',
        platform: '#4A90E2',
        enemies: ['orca'],
        tint: 0x006994
    },
    HARBOR: {
        name: 'harbor',
        background: '#7B8D8E',
        platform: '#4A5859',
        enemies: ['human', 'crab', 'hawk'],
        tint: 0x7B8D8E
    },
    ARCTIC: {
        name: 'arctic',
        background: '#E0F4FF',
        platform: '#A8D5E2',
        enemies: ['polarbear'],
        tint: 0xE0F4FF
    }
};

export const EMOJIS = {
    SEAL: '🦭',
    FISH: '🐟',
    STAR: '⭐',
    LIFE: '❤️',
    TIME: '⏰',
    MAGNET: '🧲',
    SPEED: '💨',
    HUMAN: '🚶',
    HAWK: '🦅',
    ORCA: '🐋',
    CRAB: '🦀',
    POLARBEAR: '🐻‍❄️',
    GOAL: '🏁',
    CHECKPOINT: '🚩'  // Red flag for checkpoint
};

export const SIZE_SYSTEM = {
    MAX_SIZE: 3,
    DEFAULT_SIZE: 1,
    SIZE_SCALES: [1.5, 2.0, 3.0], // Scale multipliers for each size (size 3 now bigger!)
    GROWTH_ANIMATION_DURATION: 400,
    SHRINK_ANIMATION_DURATION: 300
};

// Visual effects configuration for size transitions
export const SIZE_EFFECTS = {
    GROWTH: {
        SCREEN_FLASH_ALPHA: 0.3,
        SCREEN_FLASH_DURATION: 150,
        SCALE_POP_MULTIPLIER: 1.3,
        TINT_COLOR: 0xffd700, // Golden
        NOM_TEXT: 'NOM NOM!',
        NOM_FLOAT_DISTANCE: 50,
        NOM_DURATION: 1000,
        NOM_DELAY: 200
    },
    SHRINK: {
        SCREEN_SHAKE_DURATION: 200,
        SCREEN_SHAKE_INTENSITY: 0.01,
        SCREEN_FLASH_ALPHA: 0.2,
        SCREEN_FLASH_DURATION: 250,
        SMOKE_PUFFS: 8,
        COMPRESSION_SCALE: 0.6,
        SQUASH_SCALE: 1.2,
        TINT_COLOR: 0xff3333 // Bright red
    }
};

export const PLATFORM_COLORS = {
    default: {
        normal: 0x4A5859,      // Dark gray (original)
        start: 0x4A5859,       // Same as normal
        end: 0x4A5859,         // Same as normal
        moving: 0x4A5859       // Same as normal
    },
    beach: {
        normal: 0x4A5859,      // Keep default gray for now
        start: 0x4A5859,
        end: 0x4A5859,
        moving: 0x4A5859
    },
    city: {
        normal: 0x4A5859,      // Keep default gray for now
        start: 0x4A5859,
        end: 0x4A5859,
        moving: 0x4A5859
    },
    ocean: {
        normal: 0x4A5859,      // Keep default gray for now
        start: 0x4A5859,
        end: 0x4A5859,
        moving: 0x4A5859
    },
    harbor: {
        normal: 0x4A5859,      // Keep default gray for now
        start: 0x4A5859,
        end: 0x4A5859,
        moving: 0x4A5859
        // Future: Could use container colors
    },
    arctic: {
        normal: 0x7BA7CC,      // Light ice blue
        start: 0x7BA7CC,       // Same as normal ice
        end: 0x7BA7CC,         // Same as normal ice
        moving: 0x7BA7CC,      // Same as normal ice
        crackingIce: 0x4FC3F7, // Glacier blue (like real arctic ice)
        floatingIce: 0x4FC3F7  // Same glacier blue as crackingIce (no cracks)
    }
};