# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/spell-management.spec.ts >> Spell Management E2E Tests >> Cenário 1: Wizard com magia concedida por background/feat
- Location: tests/spell-management.spec.ts:132:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h3:has-text("Sempre Preparadas")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h3:has-text("Sempre Preparadas")')

```

```yaml
- banner:
  - button "Menu de fichas"
  - strong: QA-Wizard-Initiate
  - text: salvo
- main:
  - button "Resumo"
  - button "Perícias"
  - button "Itens"
  - button "Ações"
  - button "Magias"
  - button "Habilidades"
  - button "Preparar Magias"
  - text: Ataque Mágico
  - strong: "+3"
  - text: CD de Magia
  - strong: "11"
  - text: Truques
  - button "Usar"
  - button "Acid Splash Wizard"
  - button "Usar"
  - button "Blade Ward Wizard"
  - text: 1º Nível
  - button "Slot 1 de nível 1"
  - button "Slot 2 de nível 1"
  - text: Slots
  - button "Grimório" [disabled]
  - button "Alarm Wizard"
  - button "Grimório" [disabled]
  - button "Burning Hands Wizard"
  - heading "Preparar Magias" [level=2]
  - paragraph: Wizard • Nível 1
  - button
  - text: Capacidade
  - strong: 0 / 4
  - text: Fixas
  - strong: "0"
  - heading "Do Grimório" [level=3]
  - button "1 Alarm Círculo 1":
    - text: "1"
    - strong: Alarm
    - paragraph: Círculo 1
  - button "1 Burning Hands Círculo 1":
    - text: "1"
    - strong: Burning Hands
    - paragraph: Círculo 1
  - button "Salvar Preparação"
```

# Test source

```ts
  51  |       const classAttr = await lvl1Cards.nth(i).getAttribute('class');
  52  |       if (classAttr && !classAttr.includes('bg-teal/10')) {
  53  |         await lvl1Cards.nth(i).click();
  54  |         await page.waitForTimeout(100);
  55  |         selectedLvl1++;
  56  |       }
  57  |     }
  58  | 
  59  |     await page.getByRole('button', { name: 'Próximo' }).click();
  60  |     await page.waitForTimeout(500);
  61  |   }
  62  | 
  63  |   // 6. Step 4: Background (Origem)
  64  |   await page.getByLabel('Escolha seu background').selectOption({ label: background });
  65  |   await page.waitForTimeout(500);
  66  | 
  67  |   // Auto-fill any unselected dropdowns (e.g. Magic Initiate cantrips/spells choices)
  68  |   const bgSelects = page.locator('select');
  69  |   const selectCount = await bgSelects.count();
  70  |   for (let i = 1; i < selectCount; i++) {
  71  |     const val = await bgSelects.nth(i).inputValue();
  72  |     if (!val) {
  73  |       const selectElement = bgSelects.nth(i);
  74  |       await selectElement.selectOption({ index: 1 });
  75  |       await page.waitForTimeout(100);
  76  |     }
  77  |   }
  78  | 
  79  |   // Select Magic Initiate spells if checkboxes are present
  80  |   const checkboxes = page.locator('input[type="checkbox"]:not([disabled])');
  81  |   const checkboxCount = await checkboxes.count();
  82  |   for (let i = 0; i < Math.min(3, checkboxCount); i++) {
  83  |     const isChecked = await checkboxes.nth(i).isChecked();
  84  |     if (!isChecked) {
  85  |       await checkboxes.nth(i).click();
  86  |       await page.waitForTimeout(200);
  87  |     }
  88  |   }
  89  | 
  90  |   // Background attribute bonuses selection (+2 / +1)
  91  |   await page.getByRole('button', { name: '+2 / +1' }).click();
  92  |   const enabledButtons = page.locator('div.flex.flex-wrap.gap-2 >> button:not([disabled])');
  93  |   await enabledButtons.first().click();
  94  |   await page.waitForTimeout(100);
  95  |   await enabledButtons.nth(1).click();
  96  |   await page.waitForTimeout(100);
  97  | 
  98  |   // Select Equipment Option A
  99  |   const optA = page.getByTestId('equipment-option-A');
  100 |   if (await optA.isVisible()) {
  101 |     await optA.click();
  102 |   }
  103 | 
  104 |   await page.getByRole('button', { name: 'Próximo' }).click();
  105 |   await page.waitForTimeout(500);
  106 | 
  107 |   // 7. Step 5: Attributes Generation (Standard Array)
  108 |   await page.getByLabel('Método de Geração').selectOption('standard');
  109 |   const abilitySelects = page.locator('div.grid-cols-1.sm\\:grid-cols-2 >> select');
  110 |   const valuesToAssign = ['15', '14', '13', '12', '10', '8'];
  111 |   for (let i = 0; i < 6; i++) {
  112 |     await abilitySelects.nth(i).selectOption(valuesToAssign[i]);
  113 |     await page.waitForTimeout(100);
  114 |   }
  115 |   
  116 |   await page.getByRole('button', { name: 'Finalizar' }).click();
  117 |   
  118 |   // Verify sheet redirect
  119 |   await expect(page).toHaveURL(/.*sheet/);
  120 |   await page.waitForLoadState('networkidle');
  121 | 
  122 |   // Clear automatic initial spell preparation modal if it appears
  123 |   const savePrepBtn = page.getByRole('button', { name: 'Salvar Preparação' });
  124 |   if (await savePrepBtn.isVisible()) {
  125 |     await savePrepBtn.click();
  126 |     await page.waitForTimeout(500);
  127 |   }
  128 | }
  129 | 
  130 | test.describe('Spell Management E2E Tests', () => {
  131 | 
  132 |   test('Cenário 1: Wizard com magia concedida por background/feat', async ({ page }) => {
  133 |     // Criar Wizard com Sage background (que concede talento Magic Initiate)
  134 |     await createQACharacter(page, 'QA-Wizard-Initiate', 'Dwarf', 'Wizard', 'Sage');
  135 | 
  136 |     // Navegar para a aba de Magias (usando exact para evitar conflito com botão do builder)
  137 |     const spellsTabBtn = page.getByRole('button', { name: 'Magias', exact: true });
  138 |     await expect(spellsTabBtn).toBeVisible();
  139 |     await spellsTabBtn.click();
  140 | 
  141 |     // Confirmar visualização do botão "Preparar Magias"
  142 |     const prepBtn = page.getByRole('button', { name: 'Preparar Magias' });
  143 |     await expect(prepBtn).toBeVisible();
  144 | 
  145 |     // Abrir o modal
  146 |     await prepBtn.click();
  147 |     await page.waitForSelector('text="Preparar Magias"');
  148 | 
  149 |     // Confirmar que magia concedida aparece na seção "Sempre Preparadas"
  150 |     const alwaysPrepHeader = page.locator('h3:has-text("Sempre Preparadas")');
> 151 |     await expect(alwaysPrepHeader).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
  152 | 
  153 |     // O modal deve conter a seção de Sempre Preparadas
  154 |     const alwaysPrepSection = page.locator('section:has-text("Sempre Preparadas")');
  155 |     const grantedSpells = alwaysPrepSection.locator('div.flex.items-center');
  156 |     await expect(grantedSpells.first()).toBeVisible();
  157 | 
  158 |     // Confirmar que a magia concedida tem indicador "Sage" ou "Concedida"
  159 |     const originLabel = grantedSpells.first().locator('p.text-teal\\/60');
  160 |     const originText = await originLabel.textContent();
  161 |     expect(originText).toMatch(/Sage|Concedida|Magic Initiate/i);
  162 | 
  163 |     // Confirmar que ela não conta no limite de Capacidade de Preparação (Capacidade deve ser 0/4)
  164 |     const capacityText = page.locator('div.flex.flex-col.items-center:has-text("Capacidade") >> strong');
  165 |     await expect(capacityText).toHaveText('0 / 4');
  166 | 
  167 |     // Confirmar que ela não pode ser removida (ela é uma div estática, não há botões de ação na seção)
  168 |     const alwaysPrepButtons = alwaysPrepSection.locator('button');
  169 |     await expect(alwaysPrepButtons).toHaveCount(0);
  170 | 
  171 |     // Fechar modal
  172 |     await page.locator('header button').filter({ has: page.locator('svg') }).first().click();
  173 |   });
  174 | 
  175 |   test('Cenário 2: Cleric com limite de preparação', async ({ page }) => {
  176 |     // Criar Cleric com Acolyte background
  177 |     await createQACharacter(page, 'QA-Cleric-Limit', 'Human', 'Cleric', 'Acolyte');
  178 | 
  179 |     // Navegar para a aba Magias
  180 |     await page.getByRole('button', { name: 'Magias', exact: true }).click();
  181 | 
  182 |     // Abrir modal "Preparar Magias"
  183 |     await page.getByRole('button', { name: 'Preparar Magias' }).click();
  184 |     await page.waitForSelector('text="Lista da Classe"');
  185 | 
  186 |     // Obter o limite de capacidade (usando seletor preciso sem ambiguidade)
  187 |     const capacityTextLocator = page.locator('div.flex.flex-col.items-center:has-text("Capacidade") >> strong');
  188 |     const capacityText = await capacityTextLocator.textContent() || '0 / 4';
  189 |     const limit = parseInt(capacityText.split('/')[1].trim());
  190 |     expect(limit).toBeGreaterThan(0);
  191 | 
  192 |     // Selecionar magias até o limite
  193 |     const classSpellButtons = page.locator('section:has-text("Lista da Classe") >> button');
  194 |     const count = await classSpellButtons.count();
  195 |     
  196 |     for (let i = 0; i < limit; i++) {
  197 |       if (i < count) {
  198 |         // Clicamos apenas nas magias que ainda não estão selecionadas
  199 |         const isSelected = await classSpellButtons.nth(i).getAttribute('class');
  200 |         if (isSelected && !isSelected.includes('bg-gold')) {
  201 |           await classSpellButtons.nth(i).click();
  202 |           await page.waitForTimeout(100);
  203 |         }
  204 |       }
  205 |     }
  206 | 
  207 |     // Confirmar capacidade cheia na UI
  208 |     await expect(capacityTextLocator).toHaveText(`${limit} / ${limit}`);
  209 | 
  210 |     // Tentar selecionar acima do limite e confirmar que UI bloqueia
  211 |     if (count > limit) {
  212 |       const nextSpellBtn = classSpellButtons.nth(limit);
  213 |       
  214 |       // A UI deve desabilitar os outros botões
  215 |       await expect(nextSpellBtn).toBeDisabled();
  216 | 
  217 |       // Forçar clique e verificar que a contagem de capacidade se manteve no limite
  218 |       await nextSpellBtn.click({ force: true });
  219 |       await expect(capacityTextLocator).toHaveText(`${limit} / ${limit}`);
  220 |     }
  221 | 
  222 |     // Salvar preparação
  223 |     await page.getByRole('button', { name: 'Salvar Preparação' }).click();
  224 |     await page.waitForTimeout(500);
  225 | 
  226 |     // Confirmar que aba reflete as magias preparadas
  227 |     const preparedMarkers = page.locator('div.w-2.h-2.rounded-full.bg-emerald-400');
  228 |     await expect(preparedMarkers).toHaveCount(limit);
  229 |   });
  230 | 
  231 |   test('Cenário 3: Bard com troca de magias', async ({ page }) => {
  232 |     // Criar Bard com Entertainer background
  233 |     await createQACharacter(page, 'QA-Bard-Swap', 'Elf', 'Bard', 'Entertainer');
  234 | 
  235 |     // Navegar para a aba Magias
  236 |     await page.getByRole('button', { name: 'Magias', exact: true }).click();
  237 | 
  238 |     // Confirmar visualização do botão "Trocar Magia"
  239 |     const swapBtn = page.getByRole('button', { name: 'Trocar Magia' });
  240 |     await expect(swapBtn).toBeVisible();
  241 | 
  242 |     // Abrir modal de troca
  243 |     await swapBtn.click();
  244 |     await page.waitForSelector('text="Qual magia deseja remover?"');
  245 | 
  246 |     // Identificar a primeira magia removível
  247 |     const removableSpellsSection = page.locator('section:has-text("Qual magia deseja remover?")');
  248 |     const removableSpellButtons = removableSpellsSection.locator('button');
  249 |     const removableCount = await removableSpellButtons.count();
  250 |     expect(removableCount).toBeGreaterThan(0);
  251 | 
```