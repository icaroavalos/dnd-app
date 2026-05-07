/**
 * Inventory View - View model and rendering for the inventory tab.
 */
import { escapeHtml } from '../../lib/utils.js';
import { signed } from '../character/character-engine.js';
export function renderInventorySheet(inventory, activeModifiers, encumbrance, equippedItems, isEquipableItem, itemTags) {
    const weight = inventory.reduce((total, item) => total + (Number(item.weight) || 0) * (Number(item.quantity) || 1), 0);
    const gold = inventory.filter((item) => item.kind === "currency").reduce((total, item) => total + (Number(item.gp) || 0), 0);
    return `
    <div class="inventory-head">
      <div>
        <strong>Weight Carried: ${weight.toFixed(1)} lb.${encumbrance ? ` / ${encumbrance.carryingCapacity} lb.` : ""}</strong>
        <span>${encumbrance?.encumbered ? "Encumbered" : "Inventory pessoal"}</span>
      </div>
      <strong>${gold} GP</strong>
    </div>
    ${renderActiveModifierSummary(activeModifiers)}
    <div class="inventory-list">
      ${inventory.length ? inventory.map(item => renderInventoryRow(item, equippedItems, isEquipableItem, itemTags)).join("") : `<div class="empty-state">Escolha o equipamento inicial na etapa Escolhas.</div>`}
    </div>
  `;
}
function renderActiveModifierSummary(modifiers) {
    if (!modifiers.length)
        return "";
    return `
    <div class="inventory-modifiers">
      <strong>Modificadores ativos</strong>
      ${modifiers.map((modifier) => `
        <span>${escapeHtml(modifier.sourceName ?? modifier.sourceId ?? "Fonte")}: ${escapeHtml(modifier.target)} ${signed(Number(modifier.value) || 0)}</span>
      `).join("")}
    </div>
  `;
}
function renderInventoryRow(item, equippedItems, isEquipableItem, itemTags) {
    const equipped = equippedItems?.includes(item.id);
    const equipable = isEquipableItem(item);
    return `
    <div class="inventory-row">
      <button type="button" class="equip-box ${equipped ? "equipped" : ""}" data-toggle-equip="${item.id}" ${equipable ? "" : "disabled"} aria-label="Equipar ${escapeHtml(item.name)}"></button>
      <div>
        <strong>${escapeHtml(item.name)}${item.quantity > 1 ? ` x${item.quantity}` : ""}</strong>
        <span>${escapeHtml(item.typeLabel ?? item.kind ?? "Item")}</span>
      </div>
      <span>${item.weight ? `${item.weight} lb.` : "--"}</span>
      <span>${item.valueGp ? `${item.valueGp} GP` : "--"}</span>
      <em>${escapeHtml(itemTags(item).join(", "))}</em>
    </div>
  `;
}
//# sourceMappingURL=inventory-view.js.map