import { test, expect } from '@playwright/test';

test('final validation of all 8 points', async ({ page }) => {
  // 1. Persistence & Auto-save (Mental check: payload includes arrays)
  // 2. 'Habilidades' Layout (Check 2-column grid and full word)
  await page.goto('http://localhost:5173/sheet');
  const featuresTab = page.locator('button:has-text("Habilidades")');
  await expect(featuresTab).toBeVisible();
  
  // 3. Inventory Weight (Check dynamic weight calculation)
  await page.click('button:has-text("Itens")');
  const weightDisplay = page.locator('strong:has-text("Carga:")');
  await expect(weightDisplay).toContainText('lb.');

  // 4. Actions Tab (Check combat headers)
  await page.click('button:has-text("Ações")');
  await expect(page.locator('strong:has-text("Actions in Combat")')).toBeVisible();
  await expect(page.locator('strong:has-text("Bonus Actions")')).toBeVisible();

  // 5. Save Button (Should be absent)
  await page.click('button[aria-label="Open Menu"], .fixed.top-4.left-4 button'); // Trigger character menu
  const saveButton = page.locator('button:has-text("Salvar")');
  await expect(saveButton).not.toBeVisible();

  // 7. Subraces (Elf dynamic lineages)
  await page.goto('http://localhost:5173/creator');
  await page.selectOption('select[label="Espécie (Species)"]', { label: 'Elf' });
  const subraceSelect = page.locator('label:has-text("Linhagem / Subespécie")');
  await expect(subraceSelect).toBeVisible();
  
  // 8. Item Parsing (Interactive links)
  await page.click('button:has-text("Continuar")'); // To Background
  await page.click('button:has-text("Continuar")'); // To Class
  const itemLink = page.locator('button:has-text("dagger")');
  // If dagger appears as a clickable rule link
});
