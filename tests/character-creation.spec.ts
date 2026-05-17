import { test, expect } from '@playwright/test';

test('full character creation and persistence test', async ({ page }) => {
  // 1. Acessar o Criador
  await page.goto('http://localhost:3000/creator');
  
  // 2. Passo 1: Identidade e Espécie
  await page.getByLabel('Nome da ficha').fill('Test Elf Persistent');
  
  // Selecionar Elf
  await page.getByLabel('Espécie (Species)').selectOption({ label: 'Elf' });
  
  // Verificar se sub-raças apareceram e selecionar Drow
  const subraceSelect = page.getByLabel('Linhagem / Subespécie');
  await expect(subraceSelect).toBeVisible();
  await subraceSelect.selectOption({ label: 'Drow' });
  
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  // 3. Passo 2: Classe
  await page.getByLabel('Classe').selectOption({ label: 'Fighter' });
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  // 4. Passo 3: Background
  await page.getByLabel('Escolha seu background').selectOption({ label: 'Acolyte' });
  
  // Testar Seleção de Equipamento (Opção A e B)
  const optionA = page.getByTestId('equipment-option-A');
  const optionB = page.getByTestId('equipment-option-B');
  
  await optionA.click();
  // Verificamos o atributo customizado que reflete o estado do store
  await expect(optionA).toHaveAttribute('data-selected', 'true');
  
  await optionB.click();
  await expect(optionB).toHaveAttribute('data-selected', 'true');
  await expect(optionA).toHaveAttribute('data-selected', 'false');
  
  // Escolher bônus de atributo (+2/+1)
  await page.getByRole('button', { name: '+2 / +1' }).click();
  // Usamos first() para garantir que pegamos o bônus de atributo e não a escolha de magia (que pode ter labels iguais)
  await page.getByRole('button', { name: 'SAB' }).first().click(); // +2 (Wisdom)
  await page.getByRole('button', { name: 'INT' }).first().click(); // +1 (Intelligence)
  
  await page.getByRole('button', { name: 'Próximo' }).click();
  
  // 5. Passo 4: Atributos
  await page.getByLabel('Método de Geração').selectOption('standard');
  
  // Distribuir atributos (Standard Array)
  // Como os selects de atributos são renderizados em ordem após o select de método:
  const selects = page.locator('select');
  await selects.nth(1).selectOption('15'); // Força
  await selects.nth(2).selectOption('14'); // Destreza
  await selects.nth(3).selectOption('13'); // Constituição
  await selects.nth(4).selectOption('12'); // Inteligência
  await selects.nth(5).selectOption('10'); // Sabedoria
  await selects.nth(6).selectOption('8');  // Carisma

  await page.getByRole('button', { name: 'Finalizar' }).click();
  
  // 6. Validar Ficha (Sheet)
  await expect(page).toHaveURL(/.*sheet/);
  // O nome do personagem deve estar na ficha
  await expect(page.locator('body')).toContainText('Test Elf Persistent');
  
  console.log('Test completed successfully: Full UI flow verified.');
});
