import { test, expect } from '@playwright/test';

test('debug form render', async ({ page }) => {
  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
      console.error('CONSOLE ERROR:', text);
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message, err.stack);
    errors.push(err.message);
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.log('FAILED RESPONSE:', response.status(), response.url());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  console.log('=== LOGS ===');
  logs.slice(-20).forEach(l => console.log(l));

  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(e));

  // Check form
  const form = page.locator('#builderForm');
  const formExists = await form.count() > 0;
  console.log('Form exists:', formExists);

  if (formExists) {
    const html = await form.innerHTML();
    console.log('Form HTML length:', html.length);

    if (html.trim() === '') {
      console.log('FORM IS EMPTY!');
    }
  }
});