/**
 * Inventory View - View model and rendering for the inventory tab.
 */
import { escapeHtml } from '../../lib/utils.js';
import { signed } from '../character/character-engine.js';

export interface InventoryItem {
  id: string;
  name: string;
  kind: string;
  quantity: number;
  weight?: number;
  valueGp?: number;
  typeLabel?: string;
  gp?: number;
}

export interface Encumbrance {
  carryingCapacity: number;
  encumbered: boolean;
}

export function renderInventorySheet(
  inventory: InventoryItem[],
  activeModifiers: any[],
  encumbrance: Encumbrance | undefined,
  equippedItems: string[],
  isEquipableItem: (item: InventoryItem) => boolean,
  itemTags: (item: InventoryItem) => string[]
): string {
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

function renderActiveModifierSummary(modifiers: any[]): string {
  if (!modifiers.length) return "";
  return `
    <div class="inventory-modifiers">
      <strong>Modificadores ativos</strong>
      ${modifiers.map((modifier) => `
        <span>${escapeHtml(modifier.sourceName ?? modifier.sourceId ?? "Fonte")}: ${escapeHtml(modifier.target)} ${signed(Number(modifier.value) || 0)}</span>
      `).join("")}
    </div>
  `;
}

function renderInventoryRow(
  item: InventoryItem,
  equippedItems: string[],
  isEquipableItem: (item: InventoryItem) => boolean,
  itemTags: (item: InventoryItem) => string[]
): string {
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
