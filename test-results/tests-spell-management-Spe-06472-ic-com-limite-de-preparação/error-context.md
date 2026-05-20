# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/spell-management.spec.ts >> Spell Management E2E Tests >> Cenário 2: Cleric com limite de preparação
- Location: tests/spell-management.spec.ts:175:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('section:has-text("Lista da Classe")').locator('button').first()
    - locator resolved to <button class="flex-1 min-w-fit whitespace-nowrap min-h-[38px] grid place-items-center py-2 px-3 text-[#111] border-2 border-gold rounded-lg bg-cream font-black text-center transition-all text-[0.65rem] sm:text-[0.7rem]">Resumo</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg/90 backdrop-blur-md animate-in fade-in duration-300">…</div> from <div class="mt-2">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg/90 backdrop-blur-md animate-in fade-in duration-300">…</div> from <div class="mt-2">…</div> subtree intercepts pointer events
  46 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg/90 backdrop-blur-md animate-in fade-in duration-300">…</div> from <div class="mt-2">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - button "Menu de fichas" [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - strong [ref=e7]: QA-Cleric-Limit
    - generic [ref=e9]: salvo
  - main [ref=e11]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - button "Resumo" [ref=e16] [cursor=pointer]
        - button "Perícias" [ref=e17] [cursor=pointer]
        - button "Itens" [ref=e18] [cursor=pointer]
        - button "Ações" [ref=e19] [cursor=pointer]
        - button "Magias" [ref=e20] [cursor=pointer]
        - button "Habilidades" [ref=e21] [cursor=pointer]
      - generic [ref=e23]:
        - button "Preparar Magias" [active] [ref=e24] [cursor=pointer]:
          - img [ref=e25]
          - text: Preparar Magias
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]: Ataque Mágico
            - strong [ref=e31]: "+2"
          - generic [ref=e32]:
            - generic [ref=e33]: CD de Magia
            - strong [ref=e34]: "10"
        - generic [ref=e35]:
          - generic [ref=e37]: Truques
          - generic [ref=e39]:
            - button "Usar" [ref=e40] [cursor=pointer]
            - button "Guidance Cleric" [ref=e41] [cursor=pointer]:
              - generic [ref=e43]: Guidance
              - generic [ref=e44]: Cleric
          - generic [ref=e46]:
            - button "Usar" [ref=e47] [cursor=pointer]
            - button "Light Cleric" [ref=e48] [cursor=pointer]:
              - generic [ref=e50]: Light
              - generic [ref=e51]: Cleric
        - generic [ref=e52]:
          - generic [ref=e53]:
            - generic [ref=e54]: 1º Nível
            - generic [ref=e55]:
              - generic [ref=e56]:
                - button "Slot 1 de nível 1" [ref=e57] [cursor=pointer]
                - button "Slot 2 de nível 1" [ref=e58] [cursor=pointer]
              - generic [ref=e59]: Slots
          - generic [ref=e61]:
            - button "Gastar" [ref=e62] [cursor=pointer]
            - button "Bane Cleric" [ref=e63] [cursor=pointer]:
              - generic [ref=e65]: Bane
              - generic [ref=e66]: Cleric
          - generic [ref=e68]:
            - button "Gastar" [ref=e69] [cursor=pointer]
            - button "Bless Cleric" [ref=e70] [cursor=pointer]:
              - generic [ref=e72]: Bless
              - generic [ref=e73]: Cleric
        - generic [ref=e75]:
          - generic [ref=e76]:
            - generic [ref=e77]:
              - img [ref=e79]
              - generic [ref=e81]:
                - heading "Preparar Magias" [level=2] [ref=e82]
                - paragraph [ref=e83]: Cleric • Nível 1
            - button [ref=e84] [cursor=pointer]:
              - img [ref=e85]
          - generic [ref=e88]:
            - generic [ref=e89]:
              - img [ref=e90]
              - textbox "Buscar magia..." [ref=e93]
            - generic [ref=e94]:
              - generic [ref=e95]:
                - generic [ref=e96]:
                  - generic [ref=e97]: Capacidade
                  - strong [ref=e98]: 0 / 4
                - generic [ref=e99]:
                  - generic [ref=e100]: Fixas
                  - strong [ref=e101]: "0"
              - heading "Lista da Classe" [level=3] [ref=e103]: Lista da Classe
          - button "Salvar Preparação" [ref=e106] [cursor=pointer]:
            - img [ref=e107]
            - text: Salvar Preparação
```

# Test source

```ts
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
  151 |     await expect(alwaysPrepHeader).toBeVisible();
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
> 201 |           await classSpellButtons.nth(i).click();
      |                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  252 |     // Pegar o nome da magia a ser substituída
  253 |     const firstRemovableSpellName = await removableSpellButtons.first().locator('strong').textContent();
  254 |     expect(firstRemovableSpellName).toBeTruthy();
  255 | 
  256 |     // Confirmar que magias concedidas de Origem/Background não aparecem como removíveis
  257 |     // As magias removíveis devem ser apenas as de classe, e a lista não deve conter magias com labels de background/feat
  258 |     const spellOriginLabels = removableSpellButtons.locator('p.text-muted');
  259 |     const labelTexts = await spellOriginLabels.allTextContents();
  260 |     for (const text of labelTexts) {
  261 |       expect(text).not.toMatch(/Concedida|Background|Feat/i);
  262 |     }
  263 | 
  264 |     // Escolher a magia a remover
  265 |     await removableSpellButtons.first().click();
  266 |     await page.waitForSelector('text="Escolha a nova magia"');
  267 | 
  268 |     // Selecionar a nova magia
  269 |     const newSpellsSection = page.locator('section:has-text("Escolha a nova magia")');
  270 |     const newSpellButtons = newSpellsSection.locator('button');
  271 |     const firstNewSpellName = await newSpellButtons.first().locator('strong').textContent();
  272 |     expect(firstNewSpellName).toBeTruthy();
  273 | 
  274 |     // Clicar na nova magia para efetuar a troca
  275 |     await newSpellButtons.first().click();
  276 |     await page.waitForTimeout(500);
  277 | 
  278 |     // Confirmar troca na aba principal de Magias:
  279 |     // A magia antiga não deve mais estar visível, e a nova magia deve estar listada
  280 |     const tabSpellsNames = await page.locator('button span.text-\\[0\\.92rem\\]').allTextContents();
  281 |     
  282 |     // A antiga não deve estar na lista de magias
  283 |     expect(tabSpellsNames).not.toContain(firstRemovableSpellName);
  284 |     // A nova deve estar na lista
  285 |     expect(tabSpellsNames).toContain(firstNewSpellName);
  286 |   });
  287 | 
  288 | });
  289 | 
```