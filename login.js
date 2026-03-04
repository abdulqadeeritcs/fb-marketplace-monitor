const { chromium } = require('playwright');

(async () => {

const browser = await chromium.launch({ headless: false });

const context = await browser.newContext();

const page = await context.newPage();

console.log("Opening Facebook login...");

await page.goto("https://www.facebook.com/login");

console.log("Login manually in the browser...");

await page.waitForTimeout(60000); // time to login

// Save session AFTER login
await context.storageState({ path: 'fb-session.json' });

console.log("Session saved successfully.");

await browser.close();

})();