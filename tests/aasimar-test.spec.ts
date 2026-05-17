import { test, expect } from '@playwright/test';

test('create aasimar barbarian acolyte', async ({ page }) => {
  // 1. Início do Construtor
  await page.goto('http://localhost:5173/creator');
  await page.fill('input[placeholder="Digite o nome..."]', 'Aasimar Barbarian Test');
  
  // 2. Seleção de Espécie: Aasimar
  await page.selectOption('select:near(label:has-text("Espécie"))', { label: 'Aasimar' });
  
  // Verificar se há sub-raças (MPMM ou Legacy)
  const subraceLabel = page.locator('label:has-text("Linhagem / Subespécie")');
  if (await subraceLabel.isVisible()) {
     await page.selectOption('select:near(label:has-text("Linhagem"))', { index: 1 });
  }

  await page.click('button:has-text("Próximo")');
  
  // 3. Seleção de Classe: Barbarian
  await page.selectOption('select:near(label:has-text("Classe"))', { label: 'Barbarian' });
  await page.click('button:has-text("Próximo")');
  
  // 4. Seleção de Background: Acolyte
  await page.selectOption('select:near(label:has-text("Origem (Background)"))', { label: 'Acolyte' });
  await page.click('button:has-text("Próximo")');
  
  // 5. Atributos (Manual)
  // Devem estar vazios por padrão
  const inputs = page.locator('input[type="number"]');
  await expect(inputs.first()).toHaveValue('');
  
  // Preencher alguns valores
  await inputs.nth(0).fill('16'); // STR
  await inputs.nth(2).fill('14'); // CON
  
  await page.click('button:has-text("Finalizar")');
  
  // 6. Verificações na Ficha
  await expect(page).toHaveURL(/.*sheet/);
  
  // A. Verificar HP (Barbarian d12 + CON mod)
  // CON 14 = +2 mod. Nível 1 = 12 + 2 = 14 HP.
  const hpDisplay = page.locator('text=/14 HP/').first();
  await expect(hpDisplay).toBeVisible();
  
  // B. Verificar Nome Completo da Aba
  await expect(page.locator('button:has-text("Habilidades")')).toBeVisible();
  
  // C. Verificar Pesos (Barbarian começa com Greataxe [7lb] e Explorer's Pack [59lb])
  await page.click('button:has-text("Itens")');
  const weightText = page.locator('strong:has-text("Carga:")');
  await expect(weightText).not.toContainText('0.0 lb.');
  
  // D. Verificar Ações Categorizadas
  await page.click('button:has-text("Ações")');
  await expect(page.locator('strong:has-text("Actions in Combat")')).toBeVisible();
  
  console.log('Aasimar Barbarian Acolyte flow verified successfully.');
});
