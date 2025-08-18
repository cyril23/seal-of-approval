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
    INVINCIBLE_TIME: 2000,
    BLINK_RATE: 100
};

export const LEVEL = {
    TIME_LIMIT: 180, // More time for longer levels
    MIN_PLATFORMS: 15,  // Increased for better coverage
    MAX_PLATFORMS: 25,  // Increased for more platforms
    MIN_ENEMIES: 8,
    MAX_ENEMIES: 15,
    ARCTIC_ENEMY_MULTIPLIER: 1.5,  // Arctic levels get 50% more enemies
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
    HAWK: {
        SPEED: 60,
        DIVE_SPEED: 250,
        HOVER_HEIGHT: 100,
        DETECTION_RANGE: 350,
        DIVE_TRIGGER_RANGE: 150,
        FLY_RADIUS: 250,
        PATROL_SPEED: 50,
        DIVE_COOLDOWN: 1000,
        POINTS: 250,
        TYPE: 'hawk'
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
    },
    POLARBEAR: {
        PATROL_SPEED: 40,
        CHARGE_SPEED: 240,
        DETECTION_RANGE_X: 400,  // Increased from 250 for earlier detection
        DETECTION_RANGE_Y: 250,  // Increased from 150 for better vertical detection
        ESCAPE_RANGE: 500,       // Increased from 400 to match wider detection
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
        tint: 0xE0F4FF,
        friction: 0.15
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
    GOAL: '🏁'
};