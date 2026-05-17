# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/verify-item-price.spec.ts >> Verify Greataxe price is correct (30 gp, not 3000)
- Location: tests/verify-item-price.spec.ts:3:1

# Error details

```
Error: Greataxe not found in inventory
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - button "Menu de fichas" [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - strong [ref=e7]: Price Test Hero
    - generic [ref=e9]: salvo
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - img [ref=e15]
          - heading "Suas Fichas" [level=2] [ref=e18]
        - button [ref=e19] [cursor=pointer]:
          - img [ref=e20]
      - button "NOVA FICHA" [ref=e24] [cursor=pointer]:
        - img [ref=e25]
        - text: NOVA FICHA
      - generic [ref=e26]:
        - heading "Personagens Salvos" [level=3] [ref=e28]
        - generic [ref=e29]:
          - img [ref=e31]
          - paragraph [ref=e34]: Nenhuma ficha encontrada no baú.
      - generic [ref=e35]:
        - generic [ref=e38]: Sistema Online
        - generic [ref=e39]: v1.1.0-modern
  - main [ref=e40]:
    - generic [ref=e43]:
      - generic [ref=e44]:
        - button "Resumo" [ref=e45] [cursor=pointer]
        - button "Perícias" [ref=e46] [cursor=pointer]
        - button "Itens" [active] [ref=e47] [cursor=pointer]
        - button "Ações" [ref=e48] [cursor=pointer]
        - button "Magias" [ref=e49] [cursor=pointer]
        - button "Habilidades" [ref=e50] [cursor=pointer]
      - generic [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e54]:
            - generic [ref=e55]: "Carga:"
            - strong [ref=e56]: 5.0 / 150 lb.
          - generic [ref=e57]:
            - generic [ref=e58]: Estado
            - strong [ref=e59]: Normal
          - generic [ref=e60]:
            - generic [ref=e61]: Valor
            - strong [ref=e62]: 10 GP
          - generic [ref=e63]:
            - generic [ref=e64]: Itens / Sint.
            - strong [ref=e65]: 6 itens • 0/3
        - generic [ref=e66]:
          - generic [ref=e67]:
            - textbox "Buscar item" [ref=e68]
            - generic [ref=e69]:
              - button "Tudo" [ref=e70] [cursor=pointer]
              - button "Equipamento" [ref=e71] [cursor=pointer]
              - button "Sintonização" [ref=e72] [cursor=pointer]
              - button "Outros" [ref=e73] [cursor=pointer]
          - generic [ref=e74]:
            - article [ref=e75]:
              - generic [ref=e76]:
                - button "book Backpack" [ref=e77] [cursor=pointer]:
                  - strong [ref=e78]: book
                  - generic [ref=e79]: Backpack
                - generic [ref=e80]: 0.0 lb.
                - generic [ref=e81]: 0 gp
            - article [ref=e82]:
              - generic [ref=e83]:
                - button "Calligrapher's Supplies Backpack" [ref=e84] [cursor=pointer]:
                  - strong [ref=e85]: Calligrapher's Supplies
                  - generic [ref=e86]: Backpack
                - generic [ref=e87]: 5.0 lb.
                - generic [ref=e88]: 10 gp
            - article [ref=e89]:
              - generic [ref=e90]:
                - button "holy symbol Backpack" [ref=e91] [cursor=pointer]:
                  - strong [ref=e92]: holy symbol
                  - generic [ref=e93]: Backpack
                - generic [ref=e94]: 0.0 lb.
                - generic [ref=e95]: 0 gp
            - article [ref=e96]:
              - generic [ref=e97]:
                - button "parchment Backpack (x10)" [ref=e98] [cursor=pointer]:
                  - strong [ref=e99]: parchment
                  - generic [ref=e100]: Backpack (x10)
                - generic [ref=e101]: 0.0 lb.
                - generic [ref=e102]: 0 gp
            - article [ref=e103]:
              - generic [ref=e104]:
                - button "robe Backpack" [ref=e105] [cursor=pointer]:
                  - strong [ref=e106]: robe
                  - generic [ref=e107]: Backpack
                - generic [ref=e108]: 0.0 lb.
                - generic [ref=e109]: 0 gp
            - article [ref=e110]:
              - generic [ref=e111]:
                - button "gp Backpack (x8)" [ref=e112] [cursor=pointer]:
                  - strong [ref=e113]: gp
                  - generic [ref=e114]: Backpack (x8)
                - generic [ref=e115]: 0.0 lb.
                - generic [ref=e116]: 0 gp
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Verify Greataxe price is correct (30 gp, not 3000)', async ({ page }) => {
  4  |   // 1. Create a character with a Greataxe
  5  |   await page.goto('http://localhost:3000/creator');
  6  |   await page.getByLabel('Nome da ficha').fill('Price Test Hero');
  7  |   await page.getByLabel('Espécie (Species)').selectOption({ label: 'Orc' });
  8  |   await page.getByRole('button', { name: 'Próximo' }).click();
  9  |   
  10 |   await page.getByLabel('Classe').selectOption({ label: 'Barbarian' });
  11 |   await page.getByRole('button', { name: 'Próximo' }).click();
  12 |   
  13 |   await page.getByLabel('Escolha seu background').selectOption({ label: 'Acolyte' });
  14 |   // Select ability bonuses
  15 |   await page.getByRole('button', { name: 'SAB' }).last().click();
  16 |   await page.getByRole('button', { name: '+2 / +1' }).click();
  17 |   await page.getByRole('button', { name: 'INT' }).first().click();
  18 |   await page.getByRole('button', { name: 'SAB' }).first().click();
  19 | 
  20 |   // Choose equipment Option A (Greataxe is usually in Barbarian A or similar)
  21 |   await page.getByTestId('equipment-option-A').click();
  22 |   
  23 |   await page.getByRole('button', { name: 'Próximo' }).click();
  24 |   await page.getByLabel('Método de Geração').selectOption('standard');
  25 |   await page.getByRole('button', { name: 'Finalizar' }).click();
  26 | 
  27 |   // Wait for transition to sheet
  28 |   await expect(page).toHaveURL(/.*sheet/, { timeout: 10000 });
  29 |   console.log('Transitioned to sheet page');
  30 | 
  31 |   // 2. Navigate to Inventory tab
  32 |   await page.getByRole('button', { name: 'Itens' }).click();
  33 |   console.log('Clicked Itens tab');
  34 | 
  35 |   // Wait for inventory to load (check weight is not 0)
  36 |   const weightText = page.locator('div').filter({ hasText: /Carga:/ }).first();
  37 |   await expect(weightText).not.toContainText('0.0 /', { timeout: 10000 });
  38 |   console.log('Inventory loaded (weight is not 0)');
  39 | 
  40 |   // 3. Search for Greataxe (skip for now to see all items)
  41 |   // await page.getByPlaceholder('Buscar item').fill('Greataxe');
  42 |   
  43 |   // 4. Verify price
  44 |   // Wait a bit for items to render
  45 |   await page.waitForTimeout(1000);
  46 | 
  47 |   // Find the Greataxe row
  48 |   const items = page.locator('article');
  49 |   const count = await items.count();
  50 |   console.log(`Found ${count} items in inventory`);
  51 |   let found = false;
  52 |   
  53 |   for (let i = 0; i < count; i++) {
  54 |     const text = await items.nth(i).textContent();
  55 |     console.log(`Item ${i}: ${text}`);
  56 |     if (text?.toLowerCase().includes('greataxe')) {
  57 |       found = true;
  58 |       const priceText = await items.nth(i).locator('span').filter({ hasText: /gp/i }).first().textContent();
  59 |       console.log('Detected Greataxe price:', priceText);
  60 |       expect(priceText?.toLowerCase()).toContain('30 gp');
  61 |       expect(priceText?.toLowerCase()).not.toContain('3000 gp');
  62 |       break;
  63 |     }
  64 |   }
  65 |   
  66 |   if (!found) {
> 67 |     throw new Error('Greataxe not found in inventory');
     |           ^ Error: Greataxe not found in inventory
  68 |   }
  69 | });
  70 | 
```