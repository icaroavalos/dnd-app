import { test, expect } from '@playwright/test';

test('Level 4 ASI Verification: +2 STR bonus', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  console.log('--- STARTING ASI VERIFICATION TEST ---');
  
  await page.goto('http://localhost:3000/creator');
  await page.locator('#characterMenuButton').click();
  const clearAllBtn = page.getByRole('button', { name: /LIMPAR TUDO/i });
  if (await clearAllBtn.isVisible()) {
    await clearAllBtn.click();
    await page.getByRole('button', { name: /SIM, LIMPAR/i }).click();
  }
  await page.reload();

  const charName = 'ASI-Tester';
  await page.getByLabel('Nome da ficha').fill(charName);
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Orc' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Classe').selectOption({ label: 'Barbarian' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Farmer' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.locator('button:has-text("FOR")').first().click();
  await page.locator('button:has-text("CON")').first().click();
  
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15'); // STR
  
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/.*sheet/);
  
  const strValue = page.locator('article:has-text("STR") strong').first();
  await expect(strValue).toHaveText('17');

  console.log('Action: Leveling up to Level 4');
  for (let i = 2; i <= 4; i++) {
    await page.getByRole('button', { name: 'LEVEL UP' }).click();
    await page.getByRole('button', { name: 'CONFIRMAR' }).click();
    
    if (i === 3) {
      await page.waitForTimeout(500);
      await page.getByText('Berserker').first().click();
      await page.getByText('Athletics').first().click();
    }
    
    if (i === 4) {
      await page.waitForTimeout(500);
      await page.locator('button:has-text("FORÇA")').click();
    }
    
    await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
    await expect(page.getByText('Level Up!')).toBeHidden();
    await expect(page.locator('#syncState')).toHaveText('salvo', { timeout: 15000 });
  }

  await expect(strValue).toHaveText('19');
  
  // Reload and re-select to verify persistence
  console.log('Action: Reloading and re-selecting character');
  await page.reload();
  await page.locator('#characterMenuButton').click();
  await page.getByText(charName).first().click();
  
  // Wait for setCharacter to finish
  await page.waitForTimeout(1000);
  
  await expect(strValue).toHaveText('19');

  console.log('--- TEST SUCCESS: ASI +2 STR correctly applied and persisted ---');
});
