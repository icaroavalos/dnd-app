import { test, expect } from '@playwright/test';

test('Fighter Second Wind and species trait detection', async ({ page }) => {
  // 1. Create Fighter (Dragonborn)
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('Fighter Dragon');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Dragonborn' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Fighter' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Soldier' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'FOR' }).first().click();
  await page.getByRole('button', { name: 'CON' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15');
  await page.getByRole('button', { name: 'Finalizar' }).click();

  // 2. Verify Features
  await expect(page).toHaveURL(/.*sheet/);
  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  // Verify Second Wind (Regains 1 on Short Rest in 2024)
  const secondWind = page.locator('article', { hasText: 'Second Wind' });
  await expect(secondWind).toBeVisible();
  const swUse = secondWind.getByRole('button', { name: 'USE' });
  await expect(swUse).toContainText('2'); // Fighter level 1 has 2 uses in 2024
  
  // Use both
  await swUse.click();
  await swUse.click();
  await expect(swUse).toContainText('0');
  
  // Verify Breath Weapon (Dragonborn)
  const breath = page.locator('article', { hasText: 'Breath Weapon' });
  await expect(breath).toBeVisible();
  const breathUse = breath.getByRole('button', { name: 'USE' });
  // PB uses (2 at lvl 1), regains on Long Rest
  await expect(breathUse).toContainText('2');
  await breathUse.click();
  await expect(breathUse).toContainText('1');
  
  // 3. Short Rest
  await page.getByRole('button', { name: 'Resumo' }).click();
  await page.getByRole('button', { name: 'Short Rest' }).click();
  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  // Second Wind should be 1 (0 -> 1)
  await expect(swUse).toContainText('1');
  // Breath weapon should still be 1 (Long Rest recovery)
  await expect(breathUse).toContainText('1');
  
  console.log('Fighter and Species Resource Test: SUCCESS');
});
