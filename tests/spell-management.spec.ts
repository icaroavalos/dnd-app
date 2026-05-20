import { test, expect, Page } from '@playwright/test';

// Helper function to create a new QA character via Creator UI
async function createQACharacter(page: Page, name: string, species: string, className: string, background: string) {
  // 1. Go to creator page
  await page.goto('http://localhost:3000/creator');
  await page.waitForLoadState('networkidle');
  
  // 2. Open Sidebar and Clean characters to ensure fresh test state
  await page.locator('#characterMenuButton').click();
  const clearAllBtn = page.getByRole('button', { name: /LIMPAR TUDO/i });
  if (await clearAllBtn.isVisible()) {
    await clearAllBtn.click();
    await page.getByRole('button', { name: /SIM, LIMPAR/i }).click();
  }
  await page.keyboard.press('Escape');

  // 3. Step 1: Identity & Species
  await page.getByLabel('Nome da ficha').fill(name);
  await page.getByLabel('Espécie (Species)').selectOption({ label: species });
  await page.getByRole('button', { name: 'Próximo' }).click();

  // 4. Step 2: Class
  await page.getByLabel('Classe').selectOption({ label: className });
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.waitForTimeout(500);

  // 5. Step 3: Spells (Only for casters)
  const isCaster = ['Wizard', 'Sorcerer', 'Warlock', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger'].includes(className);
  if (isCaster) {
    await page.waitForSelector('text="Truques (Cantrips)"');

    // Selecionar até 2 truques de classe
    const cantripCards = page.locator('div.space-y-8 > div:nth-child(1) div.cursor-pointer');
    const cantripCount = await cantripCards.count();
    let selectedCants = 0;
    for (let i = 0; i < cantripCount && selectedCants < 2; i++) {
      const classAttr = await cantripCards.nth(i).getAttribute('class');
      if (classAttr && !classAttr.includes('bg-teal/10')) {
        await cantripCards.nth(i).click();
        await page.waitForTimeout(100);
        selectedCants++;
      }
    }

    // Selecionar até 2 magias de nível 1 de classe
    const lvl1Cards = page.locator('div.space-y-8 > div:nth-child(2) div.cursor-pointer');
    const lvl1Count = await lvl1Cards.count();
    let selectedLvl1 = 0;
    for (let i = 0; i < lvl1Count && selectedLvl1 < 2; i++) {
      const classAttr = await lvl1Cards.nth(i).getAttribute('class');
      if (classAttr && !classAttr.includes('bg-teal/10')) {
        await lvl1Cards.nth(i).click();
        await page.waitForTimeout(100);
        selectedLvl1++;
      }
    }

    await page.getByRole('button', { name: 'Próximo' }).click();
    await page.waitForTimeout(500);
  }

  // 6. Step 4: Background (Origem)
  await page.getByLabel('Escolha seu background').selectOption({ label: background });
  await page.waitForTimeout(500);

  // Se for Magic Initiate (Sage background), escolhe o atributo de conjuração para liberar as seleções de magias
  const spellcastingBtns = page.locator('div:has-text("Atributo de Conjuração") >> button');
  if (await spellcastingBtns.count() > 0) {
    await spellcastingBtns.first().click();
    await page.waitForTimeout(200);
  }

  // Auto-fill any unselected dropdowns (e.g. Magic Initiate cantrips/spells choices)
  const bgSelects = page.locator('select');
  const selectCount = await bgSelects.count();
  for (let i = 1; i < selectCount; i++) {
    const val = await bgSelects.nth(i).inputValue();
    if (!val) {
      const selectElement = bgSelects.nth(i);
      await selectElement.selectOption({ index: 1 });
      await page.waitForTimeout(100);
    }
  }

  // Select Magic Initiate spells if checkboxes are present
  const checkboxes = page.locator('input[type="checkbox"]:not([disabled])');
  const checkboxCount = await checkboxes.count();
  for (let i = 0; i < Math.min(3, checkboxCount); i++) {
    const isChecked = await checkboxes.nth(i).isChecked();
    if (!isChecked) {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(200);
    }
  }

  // Background attribute bonuses selection (+2 / +1)
  await page.getByRole('button', { name: '+2 / +1' }).click();
  const enabledButtons = page.locator('div.flex.flex-wrap.gap-2 >> button:not([disabled])');
  await enabledButtons.first().click();
  await page.waitForTimeout(100);
  await enabledButtons.nth(1).click();
  await page.waitForTimeout(100);

  // Select Equipment Option A
  const optA = page.getByTestId('equipment-option-A');
  if (await optA.isVisible()) {
    await optA.click();
  }

  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.waitForTimeout(500);

  // 7. Step 5: Attributes Generation (Standard Array)
  await page.getByLabel('Método de Geração').selectOption('standard');
  const abilitySelects = page.locator('div.grid-cols-1.sm\\:grid-cols-2 >> select');
  const valuesToAssign = ['15', '14', '13', '12', '10', '8'];
  for (let i = 0; i < 6; i++) {
    await abilitySelects.nth(i).selectOption(valuesToAssign[i]);
    await page.waitForTimeout(100);
  }
  
  await page.getByRole('button', { name: 'Finalizar' }).click();
  
  // Verify sheet redirect
  await expect(page).toHaveURL(/.*sheet/);
  await page.waitForLoadState('networkidle');

  // Clear automatic initial spell preparation modal if it appears
  const savePrepBtn = page.getByRole('button', { name: 'Salvar Preparação' });
  if (await savePrepBtn.isVisible()) {
    await savePrepBtn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Spell Management E2E Tests', () => {

  test('Cenário 1: Wizard com magia concedida por background/feat', async ({ page }) => {
    // Criar Wizard com Sage background (que concede talento Magic Initiate)
    await createQACharacter(page, 'QA-Wizard-Initiate', 'Dwarf', 'Wizard', 'Sage');

    // Navegar para a aba de Magias (usando exact para evitar conflito com botão do builder)
    const spellsTabBtn = page.getByRole('button', { name: 'Magias', exact: true });
    await expect(spellsTabBtn).toBeVisible();
    await spellsTabBtn.click();

    // Confirmar visualização do botão "Preparar Magias"
    const prepBtn = page.getByRole('button', { name: 'Preparar Magias' });
    await expect(prepBtn).toBeVisible();

    // Abrir o modal
    await prepBtn.click();
    await page.waitForSelector('text="Preparar Magias"');

    // Confirmar que magia concedida aparece na seção "Sempre Preparadas"
    const alwaysPrepHeader = page.locator('h3:has-text("Sempre Preparadas")');
    await expect(alwaysPrepHeader).toBeVisible();

    // O modal deve conter a seção de Sempre Preparadas
    const alwaysPrepSection = page.locator('section:has-text("Sempre Preparadas")');
    const grantedSpells = alwaysPrepSection.locator('div.flex.items-center');
    await expect(grantedSpells.first()).toBeVisible();

    // Confirmar que a magia concedida tem indicador "Sage" ou "Concedida"
    const originLabel = grantedSpells.first().locator('p.text-teal\\/60');
    const originText = await originLabel.textContent();
    expect(originText).toMatch(/Sage|Concedida|Magic Initiate/i);

    // Confirmar que ela não conta no limite de Capacidade de Preparação (Capacidade deve ser 0/4)
    const capacityText = page.locator('div.flex.flex-col.items-center:has-text("Capacidade") >> strong');
    await expect(capacityText).toHaveText('0 / 4');

    // Confirmar que ela não pode ser removida (ela é uma div estática, não há botões de ação na seção)
    const alwaysPrepButtons = alwaysPrepSection.locator('button');
    await expect(alwaysPrepButtons).toHaveCount(0);

    // Fechar modal
    await page.locator('header button').filter({ has: page.locator('svg') }).first().click();
  });

  test('Cenário 2: Cleric com limite de preparação', async ({ page }) => {
    // Criar Cleric com Acolyte background
    await createQACharacter(page, 'QA-Cleric-Limit', 'Human', 'Cleric', 'Acolyte');

    // Navegar para a aba Magias
    await page.getByRole('button', { name: 'Magias', exact: true }).click();

    // Abrir modal "Preparar Magias"
    await page.getByRole('button', { name: 'Preparar Magias' }).click();
    await page.waitForSelector('text="Lista da Classe"');

    // Obter o limite de capacidade (usando seletor preciso sem ambiguidade)
    const capacityTextLocator = page.locator('div.flex.flex-col.items-center:has-text("Capacidade") >> strong');
    const capacityText = await capacityTextLocator.textContent() || '0 / 4';
    const limit = parseInt(capacityText.split('/')[1].trim());
    expect(limit).toBeGreaterThan(0);

    // Selecionar magias até o limite (filtrando botões de magia dentro do modal)
    const classSpellButtons = page.locator('div.fixed.inset-0 button').filter({ hasText: /Círculo/ });
    const count = await classSpellButtons.count();
    
    for (let i = 0; i < limit; i++) {
      if (i < count) {
        // Clicamos apenas nas magias que ainda não estão selecionadas
        const isSelected = await classSpellButtons.nth(i).getAttribute('class');
        if (isSelected && !isSelected.includes('bg-gold')) {
          await classSpellButtons.nth(i).click();
          await page.waitForTimeout(150);
        }
      }
    }

    // Confirmar capacidade cheia na UI
    await expect(capacityTextLocator).toHaveText(`${limit} / ${limit}`);

    // Tentar selecionar acima do limite e confirmar que UI bloqueia
    if (count > limit) {
      const nextSpellBtn = classSpellButtons.nth(limit);
      
      // A UI deve desabilitar os outros botões
      await expect(nextSpellBtn).toBeDisabled();

      // Forçar clique e verificar que a contagem de capacidade se manteve no limite
      await nextSpellBtn.click({ force: true });
      await expect(capacityTextLocator).toHaveText(`${limit} / ${limit}`);
    }

    // Salvar preparação
    await page.getByRole('button', { name: 'Salvar Preparação' }).click();
    await page.waitForTimeout(500);

    // Confirmar que aba reflete as magias preparadas
    const preparedMarkers = page.locator('div.w-2.h-2.rounded-full.bg-emerald-400');
    await expect(preparedMarkers).toHaveCount(limit);
  });

  test('Cenário 3: Bard com troca de magias', async ({ page }) => {
    // Criar Bard com Entertainer background
    await createQACharacter(page, 'QA-Bard-Swap', 'Elf', 'Bard', 'Entertainer');

    // Navegar para a aba Magias
    await page.getByRole('button', { name: 'Magias', exact: true }).click();

    // Confirmar visualização do botão "Trocar Magia"
    const swapBtn = page.getByRole('button', { name: 'Trocar Magia' });
    await expect(swapBtn).toBeVisible();

    // Abrir modal de troca
    await swapBtn.click();
    await page.waitForSelector('text="Qual magia deseja remover?"');

    // Identificar a primeira magia removível
    const modal = page.locator('div.fixed.inset-0');
    const removableSpellsSection = modal.filter({ hasText: 'Qual magia deseja remover?' });
    const removableSpellButtons = removableSpellsSection.locator('button').filter({ hasText: /Círculo/ });
    const removableCount = await removableSpellButtons.count();
    expect(removableCount).toBeGreaterThan(0);

    // Pegar o nome da magia a ser substituída
    const firstRemovableSpellName = await removableSpellButtons.first().locator('strong').textContent();
    expect(firstRemovableSpellName).toBeTruthy();

    // Confirmar que magias concedidas de Origem/Background não aparecem como removíveis
    // As magias removíveis devem ser apenas as de classe, e a lista não deve conter magias com labels de background/feat
    const spellOriginLabels = removableSpellButtons.locator('p.text-muted');
    const labelTexts = await spellOriginLabels.allTextContents();
    for (const text of labelTexts) {
      expect(text).not.toMatch(/Concedida|Background|Feat/i);
    }

    // Escolher a magia a remover
    await removableSpellButtons.first().click();
    await page.waitForSelector('text="Escolha a nova magia"');

    // Selecionar a nova magia
    const newSpellsSection = modal.filter({ hasText: 'Escolha a nova magia' });
    const newSpellButtons = newSpellsSection.locator('button').filter({ hasText: /Círculo/ });
    const firstNewSpellName = await newSpellButtons.first().locator('strong').textContent();
    expect(firstNewSpellName).toBeTruthy();

    // Clicar na nova magia para efetuar a troca
    await newSpellButtons.first().click();
    await page.waitForTimeout(500);

    // Confirmar troca na aba principal de Magias:
    // A magia antiga não deve mais estar visível, e a nova magia deve estar listada
    await expect(page.locator(`button:has-text("${firstRemovableSpellName}")`)).toHaveCount(0);
    await expect(page.locator(`button:has-text("${firstNewSpellName}")`)).toBeVisible();
  });

});
