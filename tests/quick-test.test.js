import { test, expect } from '@playwright/test';

test('form should render', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Check for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait for app to load
  await page.waitForTimeout(2000);
  
  // Check if form has content
  const form = page.locator('#builderForm');
  await form.waitFor({ state: 'visible' });
  const html = await form.innerHTML();
  
  console.log('Form HTML length:', html.length);
  console.log('Errors:', errors);
  
  // Form should not be empty
  expect(html.trim()).not.toBe('');
});
