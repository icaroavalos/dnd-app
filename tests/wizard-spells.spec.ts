import { test, expect } from '@playwright/test';

test('Wizard spell selection test (Level 1)', async ({ page }) => {
  // 1. Create Level 1 Wizard
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('Test Wizard Spells');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Human' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Wizard' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  // 2. Validate Spell Step (New Step 3)
  await expect(page.getByText('Magias de Wizard')).toBeVisible();
  await expect(page.getByText('0 / 3')).toBeVisible(); // Cantrips
  await expect(page.getByText('0 / 6')).toBeVisible(); // Level 1 (Spellbook)
  
  // Select 3 Cantrips
  await page.getByText('Light', { exact: true }).click();
  await page.getByText('Mage Hand', { exact: true }).click();
  await page.getByText('Prestidigi', { exact: false }).click();
  await expect(page.getByText('3 / 3')).toBeVisible();
  
  // Select 6 Level 1 Spells
  // Search for specific spells to make sure they are in view and clickable
  const selectSpell = async (name: string) => {
    await page.getByPlaceholder('Buscar magias...').fill(name);
    await page.getByText(name, { exact: true }).click();
    await page.getByPlaceholder('Buscar magias...').fill('');
  };

  await selectSpell('Magic Missile');
  await selectSpell('Shield');
  await selectSpell('Mage Armor');
  await selectSpell('Sleep');
  await selectSpell('Detect Magic');
  await selectSpell('Thunderwave');
  
  await expect(page.getByText('6 / 6')).toBeVisible();
  
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  // 3. Background and Finish
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Sage' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'INT' }).first().click();
  await page.getByRole('button', { name: 'SAB' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  const selects = page.locator('select');
  await selects.nth(1).selectOption('8');
  await selects.nth(4).selectOption('15');
  await page.getByRole('button', { name: 'Finalizar' }).click();

  // 4. Validate Sheet Spells
  await expect(page).toHaveURL(/.*sheet/);
  await page.getByRole('button', { name: 'Magias' }).click();
  
  // Should see the selected spells
  await expect(page.getByText('Magic Missile')).toBeVisible();
  await expect(page.getByText('Light')).toBeVisible();
  
  console.log('Wizard Spell Selection Test: SUCCESS');
});
