/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

(async () => {
  // Connect to existing Chrome instance
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const contexts = browser.contexts();
  
  if (contexts.length === 0) {
    console.log('No browser contexts found');
    process.exit(1);
  }
  
  const pages = contexts[0].pages();
  const page = pages.find(p => p.url().includes('localhost:3000')) || pages[0];
  
  console.log('Taking screenshot of:', page.url());
  await page.screenshot({ path: process.argv[2] || '/tmp/screenshot.png', fullPage: true });
  console.log('Screenshot saved to:', process.argv[2] || '/tmp/screenshot.png');
  
  await browser.close();
})();
