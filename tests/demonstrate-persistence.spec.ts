import { test, expect } from '@playwright/test';

test('End-to-end level persistence: Create A, Level Up A, Create B, Switch to A', async ({ page }) => {
  // 1. Setup: Clear all characters to avoid naming conflicts
  await page.goto('http://localhost:3000/creator');
  await page.locator('#characterMenuButton').click();
  const clearAllBtn = page.getByRole('button', { name: /LIMPAR TUDO/i });
  if (await clearAllBtn.isVisible()) {
    await clearAllBtn.click();
    await page.getByRole('button', { name: /SIM, LIMPAR/i }).click();
    await expect(page.getByText(/Todas as fichas foram apagadas/i)).toBeVisible();
  }
  await page.keyboard.press('Escape');

  // 2. Create Character A (Barbarian Level 1)
  await page.getByLabel('Nome da ficha').fill('Hero-A');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Orc' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Classe').selectOption({ label: 'Barbarian' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Farmer' });
  await page.getByRole('button', { name: 'FOR' }).last().click();
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'FOR' }).first().click();
  await page.getByRole('button', { name: 'CON' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Método de Geração').selectOption('standard');
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/.*sheet/);
  await expect(page.getByText(/^Barbarian 1$/)).toBeVisible();

  // 3. Level Up Character A to Level 2
  await page.getByRole('button', { name: 'LEVEL UP' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  await expect(page.getByText(/^Barbarian 2$/)).toBeVisible();
  
  // Wait for auto-save confirmation
  await expect(page.locator('#syncState')).toHaveText('salvo', { timeout: 15000 });

  // 4. Create Character B (Fighter Level 1)
  await page.locator('#characterMenuButton').click();
  await page.getByRole('button', { name: 'NOVA FICHA' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  
  await page.getByLabel('Nome da ficha').fill('Hero-B');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Human' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Classe').selectOption({ label: 'Fighter' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Sage' });
  await page.getByRole('button', { name: 'INT' }).last().click();
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'INT' }).first().click();
  await page.getByRole('button', { name: 'SAB' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Método de Geração').selectOption('standard');
  await page.getByRole('button', { name: 'Finalizar' }).click();
  
  await expect(page).toHaveURL(/.*sheet/);
  await expect(page.getByText(/^Fighter 1$/)).toBeVisible();

  // 5. Switch back to Character A
  await page.locator('#characterMenuButton').click();
  await page.getByText('Hero-A').first().click();

  // 6. FINAL VERIFICATION: Character A must be Level 2
  await expect(page.getByText('Hero-A').first()).toBeVisible();
  await expect(page.getByText(/^Barbarian 2$/)).toBeVisible({ timeout: 15000 });
  
  console.log('--- TEST SUCCESS: Level persisted correctly across character switch ---');
});
