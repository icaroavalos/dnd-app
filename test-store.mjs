import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'Store Check');
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
    
    console.log('--- Checking Store ---');
    const state = await page.evaluate(() => {
        // Find the store if it's attached to window or something
        // Often in these apps we might expose it for debugging or it's in localStorage
        return JSON.parse(localStorage.getItem('dnd-character-state') || '{}');
    });
    console.log('Class:', state.state?.character?.class);
    console.log('Level:', state.state?.character?.level);
    
    await page.click('button:has-text("LEVEL UP")');
    await page.waitForTimeout(1000);
    
    const modalVisible = await page.isVisible('text="Evolução de Personagem"');
    console.log('Modal "Evolução de Personagem" visible:', modalVisible);
    
    const bodyContent = await page.textContent('body');
    if (bodyContent.includes('Evolução de Personagem')) {
        console.log('Found "Evolução de Personagem" text in body.');
    } else {
        console.log('Did NOT find "Evolução de Personagem" text.');
        console.log('Body Text:', bodyContent.slice(0, 1000));
    }

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
