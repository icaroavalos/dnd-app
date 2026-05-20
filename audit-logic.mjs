import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'Audit Logic');
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
    
    console.log('--- Clicking Champion ---');
    await page.click('button:has-text("Champion")');
    await page.waitForTimeout(500);
    
    const storeState = await page.evaluate(() => {
        return window.useCharacterStore.getState();
    });
    console.log('Current Selections:', JSON.stringify(storeState.pendingLevelUp?.selections, null, 2));

    const visibleButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div.fixed.z-\\[100\\] button'))
            .map(b => b.textContent.trim())
            .filter(t => t !== '' && !t.includes('Finalizar') && !t.includes('Cancelar'));
    });
    console.log('Visible Buttons after selecting Champion:', visibleButtons);

    // Check if any of these buttons should NOT be visible
    // Battle Master maneuver/skill buttons should be hidden if Champion is selected
    const battleMasterKeywords = ["Insight", "Performance", "Persuasion", "Battle Master"];
    const foundBattleMaster = visibleButtons.filter(b => battleMasterKeywords.some(k => b.includes(k)));
    console.log('Battle Master buttons still visible?', foundBattleMaster);

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
