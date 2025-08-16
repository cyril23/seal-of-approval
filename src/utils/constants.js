export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;
export const TILE_SIZE = 16;
export const LEVEL_WIDTH = 10240; // 10x screen width for side-scrolling

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
    INITIAL_LIVES: 3,
    INITIAL_SIZE: 1,
    MAX_SIZE: 3,
    SIZE_SCALE: {
        1: 1,
        2: 1.3,
        3: 1.6
    },
    INVINCIBLE_TIME: 2000,
    BLINK_RATE: 100,
    DISABLE_GROWING: false  // Set to true to disable size changes for debugging
};

export const LEVEL = {
    TIME_LIMIT: 180, // More time for longer levels
    MIN_PLATFORMS: 15,  // Increased for better coverage
    MAX_PLATFORMS: 25,  // Increased for more platforms
    MIN_ENEMIES: 8,
    MAX_ENEMIES: 15,
    MIN_COLLECTIBLES: 20,
    MAX_COLLECTIBLES: 40,
    PLATFORM_HEIGHT_VARIANCE: 200,
    MIN_GAP: 120,  // Reduced for easier jumps
    MAX_GAP: 200,  // Further reduced to ensure all gaps are jumpable
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
    POLAR_BEAR: {
        SPEED: 80,
        CHARGE_SPEED: 150,
        DETECTION_RANGE: 100,
        POINTS: 300,
        TYPE: 'polar_bear'
    },
    SEAGULL: {
        SPEED: 60,
        DIVE_SPEED: 200,
        HOVER_HEIGHT: 100,
        POINTS: 250,
        TYPE: 'seagull'
    },
    ORCA: {
        JUMP_HEIGHT: 150,
        POINTS: 400,
        TYPE: 'orca'
    },
    CRAB: {
        SPEED: 100,
        POINTS: 150,
        TYPE: 'crab'
    }
};

export const THEMES = {
    ARCTIC: {
        name: 'arctic',
        background: '#E8F4F8',
        platform: '#FFFFFF',
        enemies: ['polar_bear', 'human'],
        tint: 0xE8F4F8
    },
    BEACH: {
        name: 'beach',
        background: '#F4E4C1',
        platform: '#D4A373',
        enemies: ['crab', 'seagull', 'human'],
        tint: 0xF4E4C1
    },
    CITY: {
        name: 'city',
        background: '#8B8B8B',
        platform: '#5A5A5A',
        enemies: ['human', 'seagull'],
        tint: 0x8B8B8B
    },
    OCEAN: {
        name: 'ocean',
        background: '#006994',
        platform: '#4A90E2',
        enemies: ['orca', 'seagull'],
        tint: 0x006994
    },
    HARBOR: {
        name: 'harbor',
        background: '#7B8D8E',
        platform: '#4A5859',
        enemies: ['human', 'crab', 'seagull'],
        tint: 0x7B8D8E
    }
};

export const EMOJIS = {
    SEAL: '🦭',
    FISH: '🐟',
    STAR: '⭐',
    HEART: '❤️',
    CLOCK: '⏰',
    MAGNET: '🧲',
    SPEED: '💨',
    HUMAN: '🚶',
    POLAR_BEAR: '🐻',
    SEAGULL: '🦅',
    ORCA: '🐋',
    CRAB: '🦀',
    GOAL: '🏁'
};