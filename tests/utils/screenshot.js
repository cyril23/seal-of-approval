const path = require('path');
const fs = require('fs');

// Check if screenshots should be skipped (default: true for performance)
const SKIP_SCREENSHOTS = process.env.SKIP_SCREENSHOTS !== 'false';

if (SKIP_SCREENSHOTS) {
    console.log('Screenshots disabled for performance (set SKIP_SCREENSHOTS=false to enable)');
}

/**
 * Takes a screenshot of the game canvas (or optionally full viewport)
 * @param {Page} page - Playwright page object
 * @param {string} name - Base name for the screenshot file
 * @param {boolean} fullViewport - If true, captures full viewport instead of just canvas (default: false)
 * @returns {string|null} - Path to the saved screenshot or null if skipped
 */
async function takeScreenshot(page, name, fullViewport = false) {
    // Skip screenshots for performance unless explicitly enabled
    if (SKIP_SCREENSHOTS) {
        return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = fullViewport ? '' : 'canvas-';
    const filename = `${prefix}${name}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, '..', 'screenshots', filename);
    
    // Ensure screenshots directory exists
    const screenshotsDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    if (fullViewport) {
        // Capture full viewport (rarely needed)
        await page.screenshot({ 
            path: screenshotPath,
            fullPage: false // Just capture the viewport
        });
    } else {
        // Default: capture just the canvas element (cleaner, no browser chrome)
        const canvas = page.locator('canvas');
        await canvas.screenshot({ path: screenshotPath });
    }
    
    console.log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
}

/**
 * Gets the canvas data as base64 for analysis
 * @param {Page} page - Playwright page object
 * @returns {string} - Base64 encoded image data
 */
async function getCanvasData(page) {
    return await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            return canvas.toDataURL('image/png');
        }
        return null;
    });
}

module.exports = {
    takeScreenshot,
    getCanvasData
};