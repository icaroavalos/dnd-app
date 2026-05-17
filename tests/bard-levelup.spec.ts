import { test, expect } from '@playwright/test';

test('Bard level-up test (Level 1 to 3)', async ({ page }) => {
  // 1. Create Level 1 Bard
  await page.goto('http://localhost:3000/creator');
  await page.getByLabel('Nome da ficha').fill('Test Bard');
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Elf' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Classe').selectOption({ label: 'Bard' });
  
  // Esperar carregar as perícias
  await expect(page.getByText('Perícias de Classe (Escolha 3)')).toBeVisible();
  
  // Selecionar 3 perícias de bardo (2024)
  await page.getByText('Acrobatics', { exact: true }).click();
  await page.getByText('Stealth', { exact: true }).click();
  await page.getByText('Performance', { exact: true }).click();
  
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Acolyte' });
  await page.getByRole('button', { name: '+2 / +1' }).click();
  await page.getByRole('button', { name: 'SAB' }).first().click();
  await page.getByRole('button', { name: 'INT' }).first().click();
  
  // Escolher equipamento para habilitar o Próximo
  await page.getByTestId('equipment-option-A').click();
  
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  await page.getByLabel('Método de Geração').selectOption('standard');
  const selects = page.locator('select');
  await selects.nth(1).selectOption('8');  // Força
  await selects.nth(2).selectOption('14'); // Destreza
  await selects.nth(3).selectOption('12'); // Constituição (Mod +1)
  await selects.nth(4).selectOption('13'); // Inteligência
  await selects.nth(5).selectOption('10'); // Sabedoria
  await selects.nth(6).selectOption('15'); // Carisma
  await page.getByRole('button', { name: 'Finalizar' }).click();

  // 2. Validate Level 1 Sheet
  await expect(page).toHaveURL(/.*sheet/);
  await expect(page.getByText('Bard 1')).toBeVisible();
  
  // Calculate expected HP: 8 (d8) + 1 (Con) = 9
  await expect(page.locator('strong:has-text("9")').first()).toBeVisible();

  // 3. Level Up to 2
  await page.getByRole('button', { name: 'LEVEL UP' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR SUBIDA' }).click();
  
  // Check Level Up Modal for Level 2
  // Bard 2 features: Expertise
  await expect(page.getByText('Você alcançou o Nível 2')).toBeVisible();
  
  // HP Gain check: Average(5) + 1 (Con) = 6. Total: 9 + 6 = 15.
  await expect(page.getByText('+6 Pontos de Vida')).toBeVisible();

  // Bard needs to select 2 Expertise at level 2
  // Skills available should include Acrobatics, Stealth, Performance, Insight, Religion, Perception (from Elf/Bg)
  await page.getByRole('button', { name: 'Acrobatics' }).first().click();
  await page.getByRole('button', { name: 'Performance' }).first().click();
  
  // Finish level 2
  await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  await expect(page.getByText('Bard 2')).toBeVisible();
  await expect(page.locator('strong:has-text("15")').first()).toBeVisible();

  // 4. Level Up to 3 (Subclass Choice)
  await page.getByRole('button', { name: 'LEVEL UP' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR SUBIDA' }).click();
  
  await expect(page.getByText('Você alcançou o Nível 3')).toBeVisible();
  
  // HP Gain: 6 again. Total: 15 + 6 = 21.
  await expect(page.getByText('+6 Pontos de Vida')).toBeVisible();

  // Subclass decision should be visible
  await expect(page.getByText('Decisões do Novo Nível')).toBeVisible();
  
  // Select College of Lore
  await page.getByRole('button', { name: 'College of Lore' }).click();
  
  // College of Lore grants Bonus Proficiencies (3 skills)
  await expect(page.getByText('Bonus Proficiencies').first()).toBeVisible();
  // Select 3 skills (Lore Bard)
  await page.getByRole('button', { name: 'Arcana' }).first().click();
  await page.getByRole('button', { name: 'Nature' }).first().click();
  await page.getByRole('button', { name: 'History' }).first().click();
  
  await page.getByRole('button', { name: 'Finalizar Evolução' }).click();
  
  // Final validation
  await expect(page.getByText('Bard 3')).toBeVisible();
  await expect(page.locator('strong:has-text("21")').first()).toBeVisible();
  
  console.log('Bard Level-Up Test: SUCCESS');
});
