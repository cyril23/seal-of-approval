// Level info content - describes theme characteristics and enemy behaviors
// No survival tips or strategies, just descriptions

export const LEVEL_INFO = {
    // Level 1 - Welcome to Paradise
    1: {
        environment: [
            'Sun-drenched paradise with swaying palms',
            'Waves crash rhythmically against pristine sandy platforms',
            'A perfect day at the beach... if you can avoid the locals'
        ],
        creatures: [
            {
                emoji: '🚶',
                name: 'BEACHGOER',
                behaviors: [
                    'Patrols the shoreline with determined steps',
                    'Sharp reflexes at platform edges',
                    'Will not tolerate trespassing seals'
                ]
            },
            {
                emoji: '🦀',
                name: 'CRAB',
                behaviors: [
                    'Scuttles sideways with surprising speed',
                    'Unpredictable jumping bursts',
                    'Small but feisty guardian of the beach'
                ]
            }
        ]
    },

    // Level 2 - Urban Jungle
    2: {
        environment: [
            'Towering skyscrapers pierce the skyline',
            'Neon streetlights cast eerie shadows on moving platforms',
            'Elevators rise and fall between the concrete giants',
            'The city never sleeps... and neither do its defenders'
        ],
        creatures: [
            {
                emoji: '🚶',
                name: 'CITY DWELLER',
                behaviors: [
                    'Vigilantly patrols the urban corridors',
                    'Expertly navigates building ledges',
                    'Not amused by seal invasions'
                ]
            },
            {
                emoji: '🦅',
                name: 'HAWK',
                behaviors: [
                    'Circles ominously between skyscrapers',
                    'Locks onto targets from incredible distances',
                    'Ascends slowly before unleashing devastating dive attacks',
                    'Shows 💤 exhaustion after intense hunting',
                    'Brief rest periods before resuming the hunt'
                ]
            }
        ]
    },

    // Level 3 - Into the Abyss
    3: {
        environment: [
            'UNDERWATER REALM - Your seal transforms into a swimmer!',
            'Arrow keys enable full 360° swimming',
            'Momentum-based physics create realistic underwater movement',
            'Inertia makes every turn a graceful arc through the depths',
            'Submerged platforms hold precious treasures',
            'Glide over platforms to claim your bounty'
        ],
        creatures: [
            {
                emoji: '🐋',
                name: 'ORCA - APEX PREDATOR',
                behaviors: [
                    'Patrols with terrifying speed and grace',
                    'Supernatural detection range spans the ocean',
                    'Rises ominously before the killing strike',
                    'LETHAL - Any contact means instant death',
                    'Cannot be defeated by stomping',
                    'Dive attacks strike like underwater missiles',
                    'Shows 💤 exhaustion after each hunt',
                    'Relentless pursuit resumes quickly'
                ]
            }
        ]
    },

    // Level 4 - Industrial Wasteland
    4: {
        environment: [
            'Grimy industrial docks stacked with rusting cargo containers',
            'Massive cranes loom like mechanical monsters',
            'The smell of diesel and danger fills the air'
        ],
        creatures: [
            {
                emoji: '🚶',
                name: 'DOCK WORKER',
                behaviors: [
                    'Tirelessly guards the shipping lanes',
                    'Weaves expertly through container mazes',
                    'Years of experience spotting stowaways'
                ]
            },
            {
                emoji: '🦀',
                name: 'HARBOR CRAB',
                behaviors: [
                    'Skitters along oil-stained docks',
                    'Hardened by industrial pollution'
                ]
            },
            {
                emoji: '🦅',
                name: 'SEAGULL',
                behaviors: [
                    'Swoops through crane cables and rigging',
                    'Opportunistic predator of the port',
                    'Dive-bombs anything that moves'
                ]
            }
        ]
    },

    // Level 5 - Frozen Nightmare
    5: {
        environment: [
            'TREACHEROUS ICE PHYSICS - Every step is a gamble',
            'Standard ice sends you sliding with dangerous momentum',
            'Glacier blue ice - nearly frictionless death traps',
            'Cracked platforms shatter beneath your weight',
            'Floating icebergs bob unpredictably on dark waters',
            'Aurora borealis dances across the frozen wasteland'
        ],
        creatures: [
            {
                emoji: '🐻‍❄️',
                name: 'POLAR BEAR - ARCTIC TITAN',
                behaviors: [
                    'Methodically stalks across the frozen terrain',
                    'Shows ❗ alert stance signaling imminent danger',
                    'Bone-chilling roar precedes the charge',
                    'Thunderous charge shakes the ice',
                    'Cannot be defeated by stomping',
                    'Heavy breathing during recovery phase',
                    'Returns to hunting with renewed fury'
                ]
            }
        ]
    }
};

// Get info for a specific level
export function getLevelInfo(level) {
    // For levels 1-5, return their specific info
    if (level >= 1 && level <= 5) {
        return LEVEL_INFO[level];
    }

    // For levels 6+, cycle through levels 1-5
    // Level 6 → Level 1, Level 7 → Level 2, ... Level 11 → Level 1, etc.
    const cycledLevel = ((level - 1) % 5) + 1;
    return LEVEL_INFO[cycledLevel];
}

// Check if level should show info screen automatically
export function shouldShowInfo(level) {
    // Only auto-show info for levels 1-5
    // Levels 6+ won't auto-show (but user can press 'I' to see cycled info)
    return level >= 1 && level <= 5;
}