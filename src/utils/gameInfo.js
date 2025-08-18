// Level info content - describes theme characteristics and enemy behaviors
// No survival tips or strategies, just descriptions

export const LEVEL_INFO = {
    // Level 1 - Basic introduction
    1: {
        environment: [
            'Tropical paradise with waves and palm trees',
            'Standard platforms with normal physics'
        ],
        creatures: [
            {
                emoji: '🚶',
                name: 'HUMAN',
                behaviors: [
                    'Walks back and forth',
                    'Turns at edges and walls'
                ]
            },
            {
                emoji: '🦀',
                name: 'CRAB',
                behaviors: [
                    'Scuttles sideways quickly',
                    'Occasionally hops'
                ]
            }
        ]
    },

    // Level 2 - City theme
    2: {
        environment: [
            'Urban landscape with tall buildings',
            'Streetlights illuminate the platforms',
            'Some platforms move up and down'
        ],
        creatures: [
            {
                emoji: '🚶',
                name: 'HUMAN',
                behaviors: [
                    'Patrols the city streets',
                    'Turns at building edges'
                ]
            },
            {
                emoji: '🦅',
                name: 'HAWK',
                behaviors: [
                    'Circles between buildings',
                    'Swoops down when spotting movement'
                ]
            }
        ]
    },

    // Level 3 - Ocean theme
    3: {
        environment: [
            'Underwater ocean environment - the seal swims!',
            'Use arrow keys to swim in ALL directions',
            'Swimming has momentum - smooth turns with inertia',
            'Underwater platforms hold collectibles',
            'Swim over platforms to collect items'
        ],
        creatures: [
            {
                emoji: '🐋',
                name: 'ORCA',
                behaviors: [
                    'Swims faster than hawks fly',
                    'Detects seal within huge radius (750px)',
                    'Ascends slowly before diving attack',
                    'Lightning-fast dive at 350 speed',
                    'LETHAL - touching or stomping kills the seal',
                    'Rests with 💤 after attacking',
                    'Wakes up after 3 seconds to hunt again'
                ]
            }
        ]
    },

    // Level 4 - Harbor theme
    4: {
        environment: [
            'Industrial docks with cargo containers',
            'Cranes tower overhead',
            'Water reflections shimmer below'
        ],
        creatures: [
            {
                emoji: '🚶',
                name: 'DOCK WORKER',
                behaviors: [
                    'Patrols the loading area',
                    'Navigates around containers'
                ]
            },
            {
                emoji: '🦀',
                name: 'CRAB',
                behaviors: [
                    'Scurries along the docks',
                    'Quick sideways movement'
                ]
            },
            {
                emoji: '🦅',
                name: 'SEAGULL',
                behaviors: [
                    'Circles the harbor',
                    'Dives for opportunities'
                ]
            }
        ]
    },

    // Level 5 - Arctic theme (special mechanics)
    5: {
        environment: [
            'Slippery ice surfaces reduce control',
            'Some platforms crack and break after standing',
            'Floating ice platforms bob up and down',
            'Aurora borealis illuminates the sky'
        ],
        creatures: [
            {
                emoji: '🐻‍❄️',
                name: 'POLAR BEAR',
                behaviors: [
                    'Patrols the ice carefully',
                    'Shows ❗ alert when detecting intruders',
                    'Roars before charging',
                    'Charges at high speed',
                    'Avoid - touching or stomping kills the seal',
                    'Needs recovery time after charging'
                ]
            }
        ]
    }
};

// Get info for a specific level
export function getLevelInfo(level, theme) {
    // Check if we have specific info for this level
    if (LEVEL_INFO[level]) {
        return LEVEL_INFO[level];
    }

    // For levels without specific info, generate based on theme
    return getThemeInfo(theme, level);
}

// Generate theme-based info for levels without specific definitions
function getThemeInfo(theme, level) {
    const info = {
        environment: [],
        creatures: []
    };

    switch (theme) {
        case 'beach':
            info.environment = [
                'Sunny beach with palm trees',
                'Waves crash in the background'
            ];
            info.creatures = [
                { emoji: '🦀', name: 'CRAB', behaviors: ['Sideways scuttling', 'Random hops'] },
                { emoji: '🚶', name: 'BEACHGOER', behaviors: ['Walking patrol', 'Edge detection'] }
            ];
            break;

        case 'city':
            info.environment = [
                'Urban environment with skyscrapers',
                'Moving platforms between buildings'
            ];
            info.creatures = [
                { emoji: '🚶', name: 'PEDESTRIAN', behaviors: ['Street patrol', 'Avoids edges'] },
                { emoji: '🦅', name: 'PIGEON', behaviors: ['Flying between buildings', 'Swooping dives'] }
            ];
            break;

        case 'ocean':
            info.environment = [
                'Underwater ocean environment',
                'Arrow keys control swimming in ALL directions',
                'Momentum-based movement - smooth turns',
                'Underwater platforms hold collectibles',
                'Orcas swim freely throughout the water'
            ];
            info.creatures = [
                { emoji: '🐋', name: 'ORCA', behaviors: ['Fast swimmer with huge detection range', 'Lightning-fast diving attacks', 'LETHAL to touch - kills the seal', 'Rest period after diving'] }
            ];
            break;

        case 'harbor':
            info.environment = [
                'Industrial port with containers',
                'Cranes and loading equipment'
            ];
            info.creatures = [
                { emoji: '🚶', name: 'WORKER', behaviors: ['Dock patrol', 'Container navigation'] },
                { emoji: '🦀', name: 'CRAB', behaviors: ['Quick movement', 'Dock scurrying'] },
                { emoji: '🦅', name: 'SEAGULL', behaviors: ['Harbor circling', 'Opportunistic dives'] }
            ];
            break;

        case 'arctic':
            // Arctic appears every 5 levels
            info.environment = [
                'Icy surfaces are slippery',
                'Some ice cracks under weight',
                'Floating platforms bob up and down',
                'Northern lights dance overhead'
            ];
            info.creatures = [
                { 
                    emoji: '🐻‍❄️', 
                    name: 'POLAR BEAR', 
                    behaviors: [
                        'Ice patrol with edge detection',
                        'Alert state with ❗ indicator',
                        'Loud roar before action',
                        'High-speed charging',
                        'Fatal to touch - stomping kills the seal',
                        'Cooldown period after charging'
                    ] 
                }
            ];
            break;
    }

    return info;
}

// Check if level should show info screen
export function shouldShowInfo(level) {
    // Show info for specific milestone levels
    const infoLevels = [1, 2, 3, 4, 5];
    
    // Always show for defined levels
    if (infoLevels.includes(level)) {
        return true;
    }
    
    // Show for every 5th level (Arctic theme)
    if (level % 5 === 0) {
        return true;
    }
    
    return false;
}