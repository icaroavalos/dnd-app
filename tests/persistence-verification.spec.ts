import { test, expect } from '@playwright/test';

test('Verification of level persistence across characters', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  console.log('--- STARTING VERIFICATION TEST ---');
  
  // 1. Setup: Goto creator and clear all characters
  await page.goto('http://localhost:3000/creator');
  await page.locator('#characterMenuButton').click();
  
  // Wait for menu to be visible
  await expect(page.getByText('Suas Fichas')).toBeVisible();
  
  const clearAllBtn = page.getByRole('button', { name: /LIMPAR TUDO/i });
  if (await clearAllBtn.isVisible()) {
    await clearAllBtn.click();
    await page.getByRole('button', { name: /SIM, LIMPAR/i }).click();
    // Wait for toast and for characters to be cleared
    await expect(page.getByText(/Todas as fichas foram apagadas/i)).toBeVisible();
  }
  
  await page.reload();
  await expect(page.getByText('Suas Fichas')).toBeHidden();

  // 2. Create Character A (Level 1)
  console.log('Action: Creating Character A (Level 1)');
  await page.getByLabel('Nome da ficha').fill('Char-A');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Orc' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Barbarian' });
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
  await expect(page.getByText(/^Barbarian 1$/)).toBeVisible();

  // 3. Level Up Character A to Level 2
  console.log('Action: Leveling up Character A to Level 2');
  await page.getByRole('button', { name: 'LEVEL UP' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  
  await expect(page.getByText(/^Barbarian 2$/)).toBeVisible();
  // Ensure auto-save completes
  await expect(page.locator('#syncState')).toHaveText('salvo', { timeout: 15000 });

  // 4. Create Character B (Level 1)
  console.log('Action: Creating Character B (Level 1)');
  await page.locator('#characterMenuButton').click();
  await page.getByRole('button', { name: 'NOVA FICHA' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  
  await page.getByLabel('Nome da ficha').fill('Char-B');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Human' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Classe').selectOption({ label: 'Fighter' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Acolyte' });
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
  console.log('Action: Switching back to Character A');
  await page.locator('#characterMenuButton').click();
  await page.getByText('Char-A').first().click();
  
  // 6. FINAL VERIFICATION: Character A must be Level 2
  console.log('Action: Verifying Character A level');
  await expect(page.getByText('Char-A').first()).toBeVisible();
  await expect(page.getByText(/^Barbarian 2$/)).toBeVisible({ timeout: 15000 });
  
  console.log('--- TEST SUCCESS: Level 2 persisted correctly for Character A ---');
});
