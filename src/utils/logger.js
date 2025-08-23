import { DEBUG } from './constants.js';

// Log levels in order of priority
const LOG_LEVELS = {
    none: 0,
    info: 1,
    debug: 2
};

class Logger {
    constructor() {
        // Get configured log level from constants, default to 'info' if not set
        this.logLevel = LOG_LEVELS[DEBUG.LOG_LEVEL || 'info'];
    }

    debug(...args) {
        if (this.logLevel >= LOG_LEVELS.debug) {
            console.log('[DEBUG]', ...args);
        }
    }

    info(...args) {
        if (this.logLevel >= LOG_LEVELS.info) {
            console.log('[INFO]', ...args);
        }
    }

    warn(...args) {
        // Warnings are always shown (like errors)
        console.warn('[WARN]', ...args);
    }

    error(...args) {
        // Errors are always shown
        console.error('[ERROR]', ...args);
    }

    // Convenience method for logging objects with pretty formatting
    debugObject(label, obj) {
        if (this.logLevel >= LOG_LEVELS.debug) {
            console.log(`[DEBUG] ${label}:`, obj);
        }
    }

    // Convenience method for grouped debug logs
    debugGroup(label, fn) {
        if (this.logLevel >= LOG_LEVELS.debug) {
            console.group(`[DEBUG] ${label}`);
            fn();
            console.groupEnd();
        }
    }
}

// Create singleton instance
const logger = new Logger();

export default logger;