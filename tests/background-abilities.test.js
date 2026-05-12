import { test, expect } from '@playwright/test';

test.describe('Background Ability Scores Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('deve renderizar o formulario de lineage ao iniciar', async ({ page }) => {
    // Aguarda o form carregar
    await page.waitForSelector('#builderForm', { state: 'visible' });

    // Verifica se o form tem conteudo (nao esta vazio)
    const formHtml = await page.locator('#builderForm').innerHTML();
    expect(formHtml.trim()).not.toBe('');

    // Verifica se tem o campo de nome ou selecao de linhagem
    const hasNameField = page.locator('[data-path="name"]').isVisible();
    const hasLineageSelect = page.locator('[data-path="lineage"]').isVisible();
    expect(hasNameField || hasLineageSelect).toBe(true);
  });

  test('deve navegar para background e selecionar incrementos de ability', async ({ page }) => {
    // 1. Comeca no step lineage
    await page.waitForSelector('#builderForm', { state: 'visible' });

    // 2. Preenche nome para avancar
    await page.fill('[data-path="name"]', 'Test Character');

    // 3. Navega para Abilities (pula lineage)
    const abilitiesBtn = page.locator('[data-step="abilities"]');
    if (await abilitiesBtn.isVisible()) {
      await abilitiesBtn.click();
      await page.waitForTimeout(500);
    }

    // 4. Navega para Background
    const backgroundBtn = page.locator('[data-step="background"]');
    if (await backgroundBtn.isVisible()) {
      await backgroundBtn.click();
      await page.waitForTimeout(500);
    }

    // 5. Verifica se o form de background carregou
    const formHtml = await page.locator('#builderForm').innerHTML();
    expect(formHtml).toContain('background');

    // 6. Seleciona um background
    const backgroundSelect = page.locator('[data-bg-select]');
    if (await backgroundSelect.isVisible()) {
      await backgroundSelect.first().click();
      await page.waitForTimeout(500);
    }

    // 7. Seleciona modo de incremento +2/+1
    const incrementOptions = page.locator('[data-bg-increment]');
    if (await incrementOptions.count() > 0) {
      await incrementOptions.first().click();
      await page.waitForTimeout(500);

      // 8. Tenta selecionar abilities
      const abilityCheckboxes = page.locator('[data-bg-ability]');
      if (await abilityCheckboxes.count() > 0) {
        await abilityCheckboxes.first().click();
        await page.waitForTimeout(300);

        // Verifica se o estado foi atualizado
        const selectedAbilities = page.locator('[data-bg-ability].selected, [data-bg-ability][aria-pressed="true"]');
        expect(selectedAbilities.count()).toBeGreaterThan(0);
      }
    }
  });
});