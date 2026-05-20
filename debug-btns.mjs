import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'Debug');
    await page.selectOption('select[id*="espécie"]', 'dwarf|xphb');
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="classe"]', 'wizard|xphb');
    await page.click('button:has-text("Próximo")');
    await page.waitForSelector('text="Truques (Cantrips)"');
    const cbs = await page.$$('input[type="checkbox"]');
    for(let i=0; i<5; i++) if (cbs[i]) await cbs[i].click();
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="background"]', 'sage|xphb');
    await page.waitForTimeout(500);
    // Background ability score choices
    const bgSelects = await page.$$('select');
    for (const s of bgSelects) {
        const val = await s.evaluate(el => el.value);
        if (!val) {
            const opts = await s.$$eval('option', os => os.map(o => o.value).filter(v => v !== ''));
            if (opts.length > 0) await s.selectOption(opts[0]);
        }
    }
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Finalizar")');
    await page.waitForURL('**/sheet');
    await page.click('button:has-text("Magias")');
    await page.waitForTimeout(1500);
    const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
    console.log('Buttons found:', JSON.stringify(btns, null, 2));
    await page.screenshot({ path: 'debug-wizard.png' });
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
