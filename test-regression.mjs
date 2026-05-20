import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const snap = async (name) => {
      await page.screenshot({ path: `${name}.png` });
      console.log(`Snapshot: ${name}`);
  };

  try {
    console.log('--- Step 0: Open App ---');
    await page.goto('http://localhost:3000/creator');
    await page.fill('input#char-name', 'Regression Fighter');
    await page.selectOption('select[id*="espécie"]', 'dwarf|xphb');
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="classe"]', 'fighter|xphb');
    await page.waitForTimeout(1000);
    const masterySelects = await page.$$('select[id*="weapon-mastery"]');
    for (let i = 0; i < masterySelects.length; i++) await masterySelects[i].selectOption({ index: i + 1 });
    await page.click('button:has-text("Próximo")');
    await page.selectOption('select[id*="background"]', 'soldier|xphb');
    await page.waitForTimeout(1000);
    const bgSelects = await page.$$('select');
    for (const s of bgSelects) {
        const val = await s.evaluate(el => el.value);
        if (!val) {
            const options = await s.$$eval('option', opts => opts.map(o => o.value).filter(v => v !== ''));
            if (options.length > 0) await s.selectOption(options[0]);
        }
    }
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Finalizar")');
    await page.waitForURL('**/sheet', { timeout: 15000 });
    console.log('Character Created!');
    
    // Level Up to 10
    for (let l = 2; l <= 10; l++) {
        console.log(`Leveling up to ${l}...`);
        await page.click('button:has-text("LEVEL UP")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("CONFIRMAR")');
        await page.waitForTimeout(2000);
        
        const modalSelector = 'div.fixed.z-\\[100\\]';
        
        // Loop to make choices
        for (let attempt = 0; attempt < 10; attempt++) {
            const finalizeBtn = await page.locator(`${modalSelector} button:has-text("Finalizar Evolução")`);
            if (await finalizeBtn.isEnabled()) break;

            // 1. Selects in modal
            const selects = await page.$$(`${modalSelector} select`);
            for (const s of selects) {
                try {
                    const val = await s.evaluate(el => el.value);
                    if (!val) {
                        const options = await s.$$eval('option', opts => opts.map(o => o.value).filter(v => v !== ''));
                        if (options.length > 0) await s.selectOption(options[0]);
                    }
                } catch (e) { /* ignore detached */ }
            }

            // 2. Choice Buttons in modal
            const choiceButtons = await page.$$(`${modalSelector} button`);
            let clicked = false;
            for (const b of choiceButtons) {
                try {
                    const text = await b.textContent();
                    if (text.includes('Finalizar') || text.includes('Cancelar') || text === '') continue;
                    
                    const isSelected = await b.evaluate(el => el.classList.contains('bg-teal') || el.classList.contains('bg-gold') || el.classList.contains('bg-mint'));
                    if (!isSelected) {
                        const isDisabled = await b.isDisabled();
                        if (!isDisabled) {
                            await b.click();
                            clicked = true;
                            await page.waitForTimeout(300);
                            break; // Re-fetch buttons after click
                        }
                    }
                } catch (e) { /* ignore detached */ }
            }
            if (!clicked) {
                // Check if we are stuck but button is still disabled
                await page.waitForTimeout(500);
            }
        }

        const finalizeBtnFinal = await page.locator(`${modalSelector} button:has-text("Finalizar Evolução")`);
        if (await finalizeBtnFinal.isVisible()) {
             await finalizeBtnFinal.click();
             console.log(`Level ${l} confirmed.`);
        } else {
             console.log(`Finalizar button NOT found at level ${l}.`);
             await snap(`levelup_${l}_failed`);
             break;
        }
        await page.waitForTimeout(1000);
    }
    
    console.log('--- Step 6: Final Review ---');
    await page.click('button:has-text("Habilidades")');
    await page.waitForTimeout(1000);
    const text = await page.textContent('body');
    if (text.includes('Subclass Feature')) {
        console.log('PROBLEM: Found generic "Subclass Feature" label.');
    } else {
        console.log('No generic "Subclass Feature" found (Good).');
    }
    
    await snap('final_fighter_robust');
    
  } catch (error) {
    console.error('Test failed:', error);
    await snap('test-failure');
  } finally {
    await browser.close();
  }
})();
