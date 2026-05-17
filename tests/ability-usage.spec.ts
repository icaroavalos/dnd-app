import { test, expect } from '@playwright/test';

test('Barbarian Rage usage and recovery test', async ({ page }) => {
  // 1. Create Barbarian
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('Barbarian Tester');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Human' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Barbarian' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Farmer' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'FOR' }).first().click();
  await page.getByRole('button', { name: 'CON' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15'); // STR
  await selects.nth(3).selectOption('14'); // CON
  await page.getByRole('button', { name: 'Finalizar' }).click();

  // 2. Go to Features Tab
  await expect(page).toHaveURL(/.*sheet/);
  await page.getByRole('button', { name: 'Habilidades' }).click();
  
  // 3. Find Rage and use it
  const rageArticle = page.locator('article', { hasText: 'Rage' });
  await expect(rageArticle).toBeVisible();
  
  const useButton = rageArticle.getByRole('button', { name: 'USE' });
  await expect(useButton).toContainText('2'); // Start with 2 uses
  
  await useButton.click();
  await expect(useButton).toContainText('1'); // Should be 1
  
  await useButton.click();
  await expect(useButton).toContainText('0'); // Should be 0
  await expect(useButton).toBeDisabled();
  
  // 4. Test Short Rest (Rage SHOULD recover ONE use - 2024 rule)
  await page.getByRole('button', { name: 'Resumo' }).click();
  await page.getByRole('button', { name: 'Short Rest' }).click();
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  await expect(useButton).toContainText('1'); // Recovered 1 (0 -> 1)
  
  // 5. Test Long Rest (Rage SHOULD recover ALL uses)
  await page.getByRole('button', { name: 'Resumo' }).click();
  await page.getByRole('button', { name: 'Long Rest' }).click();
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  await expect(useButton).toContainText('2'); // Recovered to 2
  
  console.log('Barbarian Rage Usage and Recovery Test: SUCCESS');
});
