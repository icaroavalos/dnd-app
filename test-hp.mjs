import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'HP Check');
    await page.selectOption('select[id*="espécie"]', 'dwarf|xphb');
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="classe"]', 'fighter|xphb');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="background"]', 'soldier|xphb');
    await page.waitForTimeout(500);
    const selects = await page.$$('select');
    for (const s of selects) {
        const val = await s.evaluate(el => el.value);
        if (!val) {
            const options = await s.$$eval('option', opts => opts.map(o => o.value).filter(v => v !== ''));
            if (options.length > 0) await s.selectOption(options[0]);
        }
    }
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Finalizar")');
    await page.waitForURL('**/sheet');
    
    // Level 2
    await page.click('button:has-text("LEVEL UP")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("CONFIRMAR")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Finalizar Evolução")');
    await page.waitForTimeout(1000);
    
    // Level 3
    await page.click('button:has-text("LEVEL UP")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("CONFIRMAR")');
    await page.waitForTimeout(1500);
    
    console.log('--- Level 3 Modal Audit ---');
    const finalizeBtn = await page.locator('button:has-text("Finalizar Evolução")');
    console.log('Finalizar Enabled (Pre-choices):', await finalizeBtn.isEnabled());
    
    // Check for choice text
    const bodyText = await page.textContent('body');
    console.log('Contains "Martial Archetype"?', bodyText.includes('Martial Archetype'));

    // Handle choices
    const choiceButtons = await page.$$('div.fixed.z-\\[100\\] button');
    for (const b of choiceButtons) {
        const text = await b.textContent();
        if (text.includes('Champion')) {
            console.log('Found Champion button. Clicking...');
            await b.click();
            await page.waitForTimeout(500);
        }
    }
    
    console.log('Finalizar Enabled (Post-choices):', await finalizeBtn.isEnabled());
    if (await finalizeBtn.isDisabled()) {
        console.log('STILL DISABLED. Listing all choice buttons state...');
        for (const b of choiceButtons) {
            const text = await b.textContent();
            if (text.trim() === '') continue;
            const isSelected = await b.evaluate(el => el.classList.contains('bg-teal') || el.classList.contains('bg-gold'));
            console.log(`Button "${text}": selected=${isSelected}`);
        }
    }

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
