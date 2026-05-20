import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'Debug L3');
    await page.selectOption('select[id*="espécie"]', 'dwarf|xphb');
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="classe"]', 'fighter|xphb');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="background"]', 'soldier|xphb');
    await page.waitForTimeout(500);
    const selects = await page.$$('select');
    for (const s of selects) {
        const options = await s.$$eval('option', opts => opts.map(o => o.value).filter(v => v !== ''));
        if (options.length > 0) await s.selectOption(options[0]);
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
    
    await page.screenshot({ path: 'level3-debug.png', fullPage: true });
    const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('.fixed button')).map(b => b.textContent.trim()));
    console.log('Level 3 Modal Buttons:', JSON.stringify(buttons, null, 2));
    
    const bodyText = await page.textContent('body');
    console.log('Body text contains "Subclasse":', bodyText.includes('Subclasse'));

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
