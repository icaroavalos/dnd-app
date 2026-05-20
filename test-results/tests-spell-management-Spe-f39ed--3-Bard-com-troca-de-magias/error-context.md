# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/spell-management.spec.ts >> Spell Management E2E Tests >> Cenário 3: Bard com troca de magias
- Location: tests/spell-management.spec.ts:231:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.textContent: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('section:has-text("Qual magia deseja remover?")').locator('button').first().locator('strong')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - button "Menu de fichas" [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - strong [ref=e7]: QA-Bard-Swap
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
        - button "Trocar Magia" [active] [ref=e24] [cursor=pointer]:
          - img [ref=e25]
          - text: Trocar Magia
        - generic [ref=e31]:
          - generic [ref=e32]:
            - generic [ref=e33]: Ataque Mágico
            - strong [ref=e34]: "+1"
          - generic [ref=e35]:
            - generic [ref=e36]: CD de Magia
            - strong [ref=e37]: "9"
        - generic [ref=e38]:
          - generic [ref=e40]: Truques
          - generic [ref=e42]:
            - button "Usar" [ref=e43] [cursor=pointer]
            - button "Dancing Lights Elven Lineage" [ref=e44] [cursor=pointer]:
              - generic [ref=e46]: Dancing Lights
              - generic [ref=e47]: Elven Lineage
          - generic [ref=e49]:
            - button "Usar" [ref=e50] [cursor=pointer]
            - button "Prestidigitation Elven Lineage" [ref=e51] [cursor=pointer]:
              - generic [ref=e53]: Prestidigitation
              - generic [ref=e54]: Elven Lineage
          - generic [ref=e56]:
            - button "Usar" [ref=e57] [cursor=pointer]
            - button "Druidcraft Elven Lineage" [ref=e58] [cursor=pointer]:
              - generic [ref=e60]: Druidcraft
              - generic [ref=e61]: Elven Lineage
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]: 1º Nível
            - generic [ref=e65]:
              - generic [ref=e66]:
                - button "Slot 1 de nível 1" [ref=e67] [cursor=pointer]
                - button "Slot 2 de nível 1" [ref=e68] [cursor=pointer]
              - generic [ref=e69]: Slots
          - generic [ref=e71]:
            - button "Gastar" [ref=e72] [cursor=pointer]
            - button "Faerie Fire Elven Lineage" [ref=e73] [cursor=pointer]:
              - generic [ref=e75]: Faerie Fire
              - generic [ref=e76]: Elven Lineage
          - generic [ref=e78]:
            - button "Gastar" [ref=e79] [cursor=pointer]
            - button "Detect Magic Elven Lineage" [ref=e80] [cursor=pointer]:
              - generic [ref=e82]: Detect Magic
              - generic [ref=e83]: Elven Lineage
          - generic [ref=e85]:
            - button "Gastar" [ref=e86] [cursor=pointer]
            - button "Longstrider Elven Lineage" [ref=e87] [cursor=pointer]:
              - generic [ref=e89]: Longstrider
              - generic [ref=e90]: Elven Lineage
          - generic [ref=e92]:
            - button "Gastar" [ref=e93] [cursor=pointer]
            - button "Animal Friendship Bard" [ref=e94] [cursor=pointer]:
              - generic [ref=e96]: Animal Friendship
              - generic [ref=e97]: Bard
        - generic [ref=e98]:
          - generic [ref=e100]: 2º Nível
          - generic [ref=e102]:
            - button "Gastar" [disabled] [ref=e103]
            - button "Darkness Elven Lineage" [ref=e104] [cursor=pointer]:
              - generic [ref=e106]: Darkness
              - generic [ref=e107]: Elven Lineage
          - generic [ref=e109]:
            - button "Gastar" [disabled] [ref=e110]
            - button "Misty Step Elven Lineage" [ref=e111] [cursor=pointer]:
              - generic [ref=e113]: Misty Step
              - generic [ref=e114]: Elven Lineage
          - generic [ref=e116]:
            - button "Gastar" [disabled] [ref=e117]
            - button "Pass without Trace Elven Lineage" [ref=e118] [cursor=pointer]:
              - generic [ref=e120]: Pass without Trace
              - generic [ref=e121]: Elven Lineage
        - generic [ref=e123]:
          - generic [ref=e124]:
            - generic [ref=e125]:
              - img [ref=e127]
              - generic [ref=e132]:
                - heading "Trocar Magia" [level=2] [ref=e133]
                - paragraph [ref=e134]: Bard • Nível 1
            - button [ref=e135] [cursor=pointer]:
              - img [ref=e136]
          - generic [ref=e141]:
            - generic [ref=e142]:
              - img [ref=e143]
              - paragraph [ref=e145]: Você pode trocar uma magia de classe conhecida por outra da lista de Bard de um nível que você possua espaços de magia.
            - heading "Qual magia deseja remover?" [level=3] [ref=e146]
            - button "1 Animal Friendship Círculo 1" [ref=e148] [cursor=pointer]:
              - generic [ref=e149]: "1"
              - generic [ref=e150]:
                - strong [ref=e151]: Animal Friendship
                - paragraph [ref=e152]: Círculo 1
              - img [ref=e153]
          - button "Cancelar" [ref=e156] [cursor=pointer]
```

# Test source

```ts
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
  252 |     // Pegar o nome da magia a ser substituída
> 253 |     const firstRemovableSpellName = await removableSpellButtons.first().locator('strong').textContent();
      |                                                                                           ^ Error: locator.textContent: Test timeout of 30000ms exceeded.
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