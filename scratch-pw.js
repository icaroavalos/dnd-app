import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Go to creation/background tab
  await page.click('text="Background"');
  
  // Select Acolyte
  await page.selectOption('[data-bg-select]', 'Acolyte');
  
  // Wait for Guidance to appear
  await page.waitForSelector('input[data-bg-spell="Guidance"]');
  
  // Click Guidance
  await page.click('input[data-bg-spell="Guidance"]');
  
  // Evaluate the state in the browser context
  const stateData = await page.evaluate(() => {
    return localStorage.getItem('dnd-character-state');
  });
  
  console.log('State bgSpellChoices:', JSON.parse(stateData).character.bgSpellChoices);
  
  await browser.close();
})();
