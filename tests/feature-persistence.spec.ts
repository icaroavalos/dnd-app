import { test, expect } from '@playwright/test';

test('verify features persistence when switching characters', async ({ page }) => {
  // Pipe browser logs to terminal
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  // 1. Create Character A (Fighter)
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('Fighter A');
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
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15');
  await selects.nth(3).selectOption('14');
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/.*sheet/);
  await page.getByRole('button', { name: 'Habilidades' }).click();
  const fighterFeatures = page.locator('article');
  const countA = await fighterFeatures.count();
  console.log(`Fighter A features count: ${countA}`);
  await expect(countA).toBeGreaterThan(0);

  // 2. Create Character B (Wizard)
  // Abrir o menu lateral primeiro clicando no botão de usuário/hambúrguer no header
  await page.locator('header button').first().click(); 
  await expect(page.getByText('Suas Fichas')).toBeVisible();
  
  await page.getByRole('button', { name: 'NOVA FICHA' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR' }).click();

  await page.getByLabel('Nome da ficha').fill('Wizard B');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Elf' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Wizard' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Sage' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'INT' }).first().click();
  await page.getByRole('button', { name: 'SAB' }).first().click();
  await page.getByTestId('equipment-option-A').click();
  await page.waitForTimeout(500); // Wait for state to settle
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  await selects.nth(1).selectOption('8');
  await selects.nth(4).selectOption('15');
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/.*sheet/);
  await page.getByRole('button', { name: 'Habilidades' }).click();
  const wizardFeatures = page.locator('article');
  const countB = await wizardFeatures.count();
  console.log(`Wizard B features count: ${countB}`);
  await expect(countB).toBeGreaterThan(0);

  // 3. Switch back to Fighter A
  await page.locator('header button').first().click(); // Open menu
  await page.getByText('Fighter A').first().click();
  
  await page.waitForTimeout(1000); // Give time for state and UI to sync
  
  // O nome deve aparecer na barra de identidade da ficha
  await expect(page.getByText('Fighter A').last()).toBeVisible();
  
  await page.getByRole('button', { name: 'Habilidades' }).click();
  const switchedFeatures = page.locator('article');
  const countSwitched = await switchedFeatures.count();
  console.log(`Switched back to Fighter A features count: ${countSwitched}`);
  
  await expect(countSwitched).toBe(countA);
});
