import { PLATFORM_COLORS } from '../utils/constants.js';

export default class PlatformColorManager {
    constructor() {
        // Use platform colors from constants
        this.themes = PLATFORM_COLORS;
    }

    /**
     * Get the base color for a specific theme and platform type
     */
    getBaseColor(theme, platformType = 'normal') {
        const themeColors = this.themes[theme] || this.themes.default;
        return themeColors[platformType] || themeColors.normal;
    }

    /**
     * Automatically calculate edge colors based on base color
     * @param {number} baseColor - The base color in hex format
     * @returns {object} Object with top and bottom edge colors
     */
    getEdgeColors(baseColor) {
        const topEdge = this.lightenColor(baseColor, 0.15);
        const bottomEdge = this.darkenColor(baseColor, 0.15);
        return { top: topEdge, bottom: bottomEdge };
    }

    /**
     * Lighten a color by a given factor
     */
    lightenColor(color, factor) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        return (newR << 16) | (newG << 8) | newB;
    }

    /**
     * Darken a color by a given factor
     */
    darkenColor(color, factor) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));
        
        return (newR << 16) | (newG << 8) | newB;
    }

    /**
     * Get the texture key for a specific theme and platform type
     */
    getTextureKey(theme, platformType = 'normal') {
        // For non-arctic themes, use the default platform texture for now
        if (theme !== 'arctic' && platformType !== 'crackingIce' && platformType !== 'floatingIce') {
            return 'platform';
        }
        return `platform-${theme}-${platformType}`;
    }

    /**
     * Get all platform types that need textures for a theme
     */
    getPlatformTypes(theme) {
        if (theme === 'arctic') {
            return ['normal', 'start', 'end', 'moving', 'crackingIce', 'floatingIce'];
        }
        return ['normal', 'start', 'end', 'moving'];
    }
}