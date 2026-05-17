import { test, expect } from '@playwright/test';

test('Species trait resource detection', async ({ page }) => {
  // Create Goliath Fighter
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('Goliath Test');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Goliath' });
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
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/.*sheet/);
  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  // Giant Ancestry: PB times (2 at lvl 1)
  const giant = page.locator('article', { hasText: 'Giant Ancestry' });
  await expect(giant.getByRole('button', { name: 'USE' })).toContainText('2');
  
  console.log('Species Trait Test: SUCCESS');
});
