const path = require('path');
const fs = require('fs');

/**
 * Takes a screenshot of the current page and saves it with a timestamp
 * @param {Page} page - Playwright page object
 * @param {string} name - Base name for the screenshot file
 * @returns {string} - Path to the saved screenshot
 */
async function takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, '..', 'screenshots', filename);
    
    // Ensure screenshots directory exists
    const screenshotsDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    await page.screenshot({ 
        path: screenshotPath,
        fullPage: false // Just capture the viewport
    });
    
    console.log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
}

/**
 * Takes a screenshot of just the canvas element
 * @param {Page} page - Playwright page object
 * @param {string} name - Base name for the screenshot file
 * @returns {string} - Path to the saved screenshot
 */
async function takeCanvasScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `canvas-${name}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, '..', 'screenshots', filename);
    
    // Ensure screenshots directory exists
    const screenshotsDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Get canvas element and take screenshot
    const canvas = page.locator('canvas');
    await canvas.screenshot({ path: screenshotPath });
    console.log(`Canvas screenshot saved: ${screenshotPath}`);
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
    takeCanvasScreenshot,
    getCanvasData
};