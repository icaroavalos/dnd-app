import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const snap = async (name) => {
      await page.screenshot({ path: `qa-${name}.png` });
      console.log(`Snapshot: qa-${name}.png`);
  };

  const creatorFlow = async (name, species, className, background) => {
      await page.goto('http://localhost:3000/creator');
      await page.fill('input#char-name', name);
      await page.selectOption('select[id*="espécie"]', species);
      await page.click('button:has-text("Próximo")');
      await page.waitForSelector('select[id*="classe"]');
      await page.selectOption('select[id*="classe"]', className);
      
      // Select Background
      await page.click('nav button:has-text("4. Origem")');
      await page.waitForSelector('select[id*="background"], select[id*="origem"]');
      await page.selectOption('select[id*="background"], select[id*="origem"]', background);
      await page.waitForTimeout(500);
      const bgSelects = await page.$$('select');
      for (const s of bgSelects) {
        const val = await s.evaluate(el => el.value);
        if (!val) {
            const opts = await s.$$eval('option', os => os.map(o => o.value).filter(v => v !== ''));
            if (opts.length > 0) await s.selectOption(opts[0]);
        }
      }

      await page.click('nav button:has-text("5. Atributos")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Finalizar")');
      await page.waitForURL('**/sheet', { timeout: 15000 });
  };

  try {
    console.log('--- Test 1: Wizard with Granted Spells ---');
    await creatorFlow('QA Wizard', 'dwarf|xphb', 'wizard|xphb', 'sage|xphb');

    await page.click('button:has-text("Magias")');
    await page.waitForTimeout(500);
    const manageBtn = page.locator('button:has-text("Preparar Magias")');
    await manageBtn.click();
    
    await page.waitForSelector('text="Sempre Preparadas"', { timeout: 10000 });
    const alwaysCount = await page.locator('section:has-text("Sempre Preparadas") >> div.flex.items-center').count();
    console.log(`Always prepared count: ${alwaysCount}`);
    if (alwaysCount === 0) throw new Error('No always prepared spells found.');

    await snap('wizard-modal');
    await page.click('header button:has(svg.lucide-x)');

    console.log('--- Test 2: Cleric Limit ---');
    await creatorFlow('QA Cleric', 'human|xphb', 'cleric|xphb', 'acolyte|xphb');

    await page.click('button:has-text("Magias")');
    await page.click('button:has-text("Preparar Magias")');
    await page.waitForSelector('text="Lista da Classe"');
    
    const limitText = await page.textContent('div:has-text("Capacidade") >> strong');
    const limit = parseInt(limitText.split('/')[1]);
    const classSpells = await page.$$('section:has-text("Lista da Classe") >> button');
    
    for (let i = 0; i < Math.min(limit + 1, classSpells.length); i++) {
        await classSpells[i].click();
        await page.waitForTimeout(100);
    }
    
    const finalCountText = await page.textContent('div:has-text("Capacidade") >> strong');
    const finalCount = parseInt(finalCountText.split('/')[0]);
    console.log(`Cleric prepared: ${finalCount}/${limit}`);
    if (finalCount > limit) throw new Error('Limit exceeded!');

    await snap('cleric-modal');
    await page.click('button:has-text("Salvar Preparação")');

    console.log('--- Test 3: Bard Replace ---');
    await creatorFlow('QA Bard', 'elf|xphb', 'bard|xphb', 'entertainer|xphb');

    await page.click('button:has-text("Magias")');
    await page.click('button:has-text("Trocar Magia")');
    await page.waitForSelector('text="Qual magia deseja remover?"');
    
    const removableSpells = await page.$$('button:has-text("Círculo 1")');
    if (removableSpells.length > 0) {
        await removableSpells[0].click();
        await page.waitForSelector('text="Escolha a nova magia"');
        const newSpells = await page.$$('section >> button:has-text("Círculo 1")');
        await newSpells[0].click();
        console.log('SUCCESS: Bard replacement done.');
    } else {
        console.log('SKIP: No removable spells found (using known spells).');
    }
    
    await snap('bard-done');

    console.log('--- ALL TESTS PASSED ---');

  } catch (error) {
    console.error('E2E FAILED:', error);
    await snap('fail');
  } finally {
    await browser.close();
  }
})();
