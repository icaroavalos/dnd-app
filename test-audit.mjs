import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('--- Step 1: Create Character ---');
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'Test Audit');
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
    
    console.log('--- Step 2: Level up to 3 ---');
    for (let l = 2; l <= 3; l++) {
        await page.click('button:has-text("LEVEL UP")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("CONFIRMAR")');
        await page.waitForTimeout(2000);
        
        // Robust choice selection
        for (let attempt = 0; attempt < 10; attempt++) {
            const isEnabled = await page.isEnabled('button:has-text("Finalizar Evolução")');
            if (isEnabled) break;

            const selects = await page.$$('div.fixed.z-\\[100\\] select');
            for (const s of selects) {
                const val = await s.evaluate(el => el.value);
                if (!val) {
                    const opts = await s.$$eval('option', os => os.map(o => o.value).filter(v => v !== ''));
                    if (opts.length > 0) await s.selectOption(opts[0]);
                }
            }

            const buttons = await page.$$('div.fixed.z-\\[100\\] button:not(:has-text("Finalizar")):not(:has-text("Cancelar"))');
            for (const b of buttons) {
                const text = await b.textContent();
                if (!text || text === '') continue;
                const isSelected = await b.evaluate(el => el.classList.contains('bg-teal') || el.classList.contains('bg-gold') || el.classList.contains('bg-mint'));
                if (!isSelected) {
                    const isDisabled = await b.isDisabled();
                    if (!isDisabled) {
                        await b.evaluate(el => el.click());
                        await page.waitForTimeout(500);
                        break; 
                    }
                }
            }
        }
        await page.click('button:has-text("Finalizar Evolução")');
        await page.waitForTimeout(1000);
    }
    
    console.log('--- Step 3: Check Features ---');
    await page.click('button:has-text("Habilidades")');
    await page.waitForTimeout(1000);
    const features = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('strong')).map(s => s.textContent);
    });
    console.log('Features found:', features);
    
    // Check if generic "Subclass Feature" is present
    const hasGeneric = features.some(f => f === 'Subclass Feature');
    console.log('Has generic "Subclass Feature":', hasGeneric);

    // Check HP
    const hp = await page.textContent('button:has-text("HP")');
    console.log('HP at Level 3:', hp);

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
