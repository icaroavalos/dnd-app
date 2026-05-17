import { test, expect } from '@playwright/test';

test('High-level resource scaling (Paladin and Fighter)', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
  
  let characterClass = 'Paladin';

  // 1. Create Paladin Level 1
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('HighLevel Paladin');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Human' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Paladin' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  // Spell selection (Step 3) - Paladin has 2 spells at lvl 1
  await page.getByText('Heroism', { exact: true }).click();
  await page.getByText('Searing Smite', { exact: true }).click();
  await page.getByRole('button', { name: 'Próximo' }).click();

  await page.getByLabel('Escolha seu background').selectOption({ label: 'Noble' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'FOR' }).first().click();
  await page.getByRole('button', { name: 'CAR' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15');
  await page.getByRole('button', { name: 'Finalizar' }).click();

  // 2. Verify Level 1 Resources
  await expect(page).toHaveURL(/.*sheet/);
  await page.waitForTimeout(2000); // Wait for render
  
  console.log('[TEST] On sheet page. Level display:', await page.getByText(/Paladin\s+1/i).first().innerText());

  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  // Lay on Hands: 5 * Level = 5
  const loh = page.locator('article', { hasText: 'Lay on Hands' });
  await expect(loh.getByRole('button', { name: 'USE' })).toContainText('5');

  // 3. Level Up Helper
  const levelUp = async () => {
    await page.getByRole('button', { name: 'Resumo' }).click();
    await page.waitForTimeout(500);

    // Wait for the class/level display to be visible
    const levelLocator = page.getByText(new RegExp(`${characterClass}\\s+\\d+`, 'i')).first();
    await expect(levelLocator).toBeVisible();
    const oldLevelText = await levelLocator.innerText();
    console.log(`[TEST] Current: ${oldLevelText}`);

    await page.getByRole('button', { name: 'LEVEL UP' }).click();
    await page.getByRole('button', { name: 'CONFIRMAR SUBIDA' }).click();
    
    // Wait for modal
    await page.waitForTimeout(1000);
    // Exhaustive choice fulfiller
    const fulfillChoices = async () => {
       console.log('[TEST] Checking for choices...');
       // Look for elements that say "Pendente"
       const pending = page.getByText('Pendente');
       const count = await pending.count();
       console.log(`[TEST] Found ${count} pending choices`);

       for (let i = 0; i < count; i++) {
          console.log(`[TEST] Fulfilling choice ${i + 1}/${count}`);
          // Find the parent container (ChoiceSelector)
          const container = page.locator('div.bg-bg').filter({ has: pending.nth(i) }).last();

          // Detect how many options to pick by reading the "Selecione X opções" text
          const instruction = await container.locator('p').first().innerText();
          const match = instruction.match(/Selecione (\d+)/i);
          const total = match ? parseInt(match[1]) : 1;

          console.log(`[TEST] Instruction: "${instruction}", Total to pick: ${total}`);

          const buttons = container.getByRole('button');
          for (let j = 0; j < total; j++) {
             // Click an available button (not already selected/disabled)
             const available = buttons.filter({ hasNot: page.locator('.bg-teal') }).filter({ hasNot: page.locator('.opacity-40') });
             if (await available.count() > 0) {
                await available.first().click();
                await page.waitForTimeout(300);
             }
          }
       }
    };    await fulfillChoices();
    await page.waitForTimeout(500);
    await fulfillChoices();

    const finishButton = page.getByRole('button', { name: 'Finalizar Evolução' });
    if (await finishButton.isDisabled()) {
       console.log('[TEST] Finish button still disabled, retrying choices...');
       await fulfillChoices();
    }

    await finishButton.click();
    
    // Wait for level to actually increase in the UI
    await expect(levelLocator).not.toHaveText(oldLevelText);
  };

  await levelUp(); // Level 2
  await levelUp(); // Level 3

  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  // Lay on Hands: 5 * 3 = 15
  await expect(loh.getByRole('button', { name: 'USE' })).toContainText('15');
  
  // Channel Divinity (Level 3): 2 uses
  const cd = page.locator('article', { hasText: 'Channel Divinity' });
  await expect(cd.getByRole('button', { name: 'USE' })).toContainText('2');
  
  // Use 2 CD
  await cd.getByRole('button', { name: 'USE' }).click();
  await cd.getByRole('button', { name: 'USE' }).click();
  await expect(cd.getByRole('button', { name: 'USE' })).toContainText('0');
  
  // 4. Short Rest: CD should regain ONE (2024 rule)
  await page.getByRole('button', { name: 'Resumo' }).click();
  await page.getByRole('button', { name: 'Short Rest' }).click();
  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  await expect(cd.getByRole('button', { name: 'USE' })).toContainText('1');
  
  // 5. Test Fighter Level 9/13/17 Scaling (Indomitable)
  characterClass = 'Fighter';
  // Create a new Fighter
  await page.locator('header button').first().click();
  await page.getByRole('button', { name: 'NOVA FICHA' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  
  await page.getByLabel('Nome da ficha').fill('Fighter Scaling');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Human' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Classe').selectOption({ label: 'Fighter' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Farmer' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'FOR' }).first().click();
  await page.getByRole('button', { name: 'CON' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Método de Geração').selectOption('standard');
  await page.getByRole('button', { name: 'Finalizar' }).click();
  
  // Loop level up to 9
  for (let i = 2; i <= 9; i++) {
    await page.getByRole('button', { name: 'Resumo' }).click();
    await page.getByRole('button', { name: 'LEVEL UP' }).click();
    await page.getByRole('button', { name: 'CONFIRMAR SUBIDA' }).click();
    await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  }
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  const indomitable = page.locator('article', { hasText: 'Indomitable' });
  await expect(indomitable.getByRole('button', { name: 'USE' })).toContainText('1'); // 1 use at lvl 9
  
  // Level up to 13
  for (let i = 10; i <= 13; i++) {
    await page.getByRole('button', { name: 'Resumo' }).click();
    await page.getByRole('button', { name: 'LEVEL UP' }).click();
    await page.getByRole('button', { name: 'CONFIRMAR SUBIDA' }).click();
    await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  }
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  await expect(indomitable.getByRole('button', { name: 'USE' })).toContainText('2'); // 2 uses at lvl 13
  
  // 6. Test Druid Level 17 Scaling (Wild Shape)
  characterClass = 'Druid';
  await page.locator('header button').first().click();
  await page.getByRole('button', { name: 'NOVA FICHA' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  
  await page.getByLabel('Nome da ficha').fill('Druid Scaling');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Elf' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Classe').selectOption({ label: 'Druid' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByText('Guidance', { exact: true }).click();
  await page.getByText('Starry Wisp', { exact: true }).click();
  await page.getByText('Cure Wounds', { exact: true }).click();
  await page.getByText('Thunderwave', { exact: true }).click();
  await page.getByText('Entangle', { exact: true }).click();
  await page.getByText('Faerie Fire', { exact: true }).click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Hermit' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'SAB' }).first().click();
  await page.getByRole('button', { name: 'CON' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Método de Geração').selectOption('standard');
  await page.getByRole('button', { name: 'Finalizar' }).click();
  
  // Level up to 2 (gets Wild Shape)
  await levelUp();
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  const wildShape = page.locator('article', { hasText: 'Wild Shape' });
  await expect(wildShape.getByRole('button', { name: 'USE' })).toContainText('2'); // 2 uses at lvl 2
  
  // Jump to Level 17 (requires a loop or store manipulation, but we loop for safety)
  for (let i = 3; i <= 17; i++) {
    await levelUp();
  }
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  await expect(wildShape.getByRole('button', { name: 'USE' })).toContainText('4'); // 4 uses at lvl 17
  
  console.log('High-Level Resource Scaling Test: SUCCESS');
});
