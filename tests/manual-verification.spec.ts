import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Manual-style verification of level persistence', async ({ page }) => {
  const screenshotDir = 'test-snapshots/manual-verification';
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  console.log('--- STEP 1: Cleaning workspace ---');
  await page.goto('http://localhost:3000/creator');
  await page.locator('#characterMenuButton').click();
  const clearAllBtn = page.getByRole('button', { name: /LIMPAR TUDO/i });
  if (await clearAllBtn.isVisible()) {
    await clearAllBtn.click();
    await page.getByRole('button', { name: /SIM, LIMPAR/i }).click();
    await page.waitForTimeout(1000);
  }
  await page.keyboard.press('Escape');

  console.log('--- STEP 2: Creating Character A (Level 1) ---');
  await page.getByLabel('Nome da ficha').fill('Hero-A');
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
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15'); 
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/.*sheet/);
  await expect(page.getByText(/^Barbarian 1$/)).toBeVisible();
  await page.screenshot({ path: path.join(screenshotDir, '1-character-a-level-1.png') });
  console.log('Action: Created Hero-A at Level 1');

  console.log('--- STEP 3: Leveling up to Level 2 ---');
  await page.getByRole('button', { name: 'LEVEL UP' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  
  await expect(page.getByText(/^Barbarian 2$/)).toBeVisible();
  // Ensure auto-save completes
  await expect(page.locator('#syncState')).toHaveText('salvo', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotDir, '2-character-a-level-2.png') });
  console.log('Action: Hero-A is now Level 2 and saved');

  console.log('--- STEP 4: Creating Character B (Level 1) ---');
  await page.locator('#characterMenuButton').click();
  await page.getByRole('button', { name: 'NOVA FICHA' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();
  
  await page.getByLabel('Nome da ficha').fill('Hero-B');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Orc' });
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
  await expect(page.getByText(/^Fighter 1$/)).toBeVisible();
  await page.screenshot({ path: path.join(screenshotDir, '3-character-b-level-1.png') });
  console.log('Action: Created Hero-B at Level 1');

  console.log('--- STEP 5: Switching back to Character A ---');
  await page.locator('#characterMenuButton').click();
  await page.getByText('Hero-A').first().click();
  
  // Give it a moment to load and sync
  await page.waitForTimeout(1000);

  console.log('--- STEP 6: Final Verification ---');
  await expect(page.getByText('Hero-A').first()).toBeVisible();
  // CRITICAL CHECK: Still Level 2?
  const levelText = page.getByText(/^Barbarian 2$/);
  await expect(levelText).toBeVisible({ timeout: 15000 });
  
  await page.screenshot({ path: path.join(screenshotDir, '4-verification-hero-a-still-level-2.png') });
  console.log('Action: Verification SUCCESS. Hero-A is still Barbarian 2');
});
