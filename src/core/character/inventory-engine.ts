/**
 * Inventory Engine - Lógica para derivação de equipamentos e inventário
 */

import type { ApiState } from '../../types/state.js';

export interface InventoryItem {
  id: string;
  name: string;
  source: string;
  quantity: number;
  kind: 'item' | 'currency' | 'special';
  type?: string;
  typeLabel?: string;
  weight: number;
  valueGp: number;
  ac?: number;
  damage?: string;
  damageType?: string;
  property: string[];
  entries: string[];
  /**
   * Origin of this inventory item: 'choice' means derived from equipment choices,
   * 'manual' means user added/modified, 'merged' means combined from multiple sources.
   */
  origin?: 'choice' | 'manual' | 'merged';
}

export function parseItemRef(ref: string) {
  const [rawName, rawSource = "xphb"] = String(ref).split("|");
  return { name: titleCase(rawName), source: rawSource.toUpperCase() };
}

export function itemKey(name: string, source: string = "XPHB"): string {
  return `${String(name).toLowerCase()}|${String(source).toLowerCase()}`;
}

export function itemDetail(name: string, source: string = "XPHB", api: ApiState) {
  const details = api.source?.itemDetails;
  if (!details) return undefined;
  return details[itemKey(displayItemName(name), source)] ?? details[itemKey(name, source)];
}

function titleCase(value: string): string {
  return String(value)
    .split(/[-\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayItemName(name: string): string {
  return name; // Placeholder se houver lógica de normalização de nomes
}

export function itemTypeLabel(detail: any): string {
  const type = detail?.type;
  if (!type) return "Item";
  const types: Record<string, string> = {
    "A": "Ammo",
    "AF": "Ammo",
    "G": "Adventuring Gear",
    "GS": "Gaming Set",
    "HA": "Heavy Armor",
    "INS": "Instrument",
    "LA": "Light Armor",
    "M": "Melee Weapon",
    "MA": "Medium Armor",
    "P": "Potion",
    "R": "Ranged Weapon",
    "RD": "Rod",
    "RG": "Ring",
    "S": "Shield",
    "SC": "Scroll",
    "T": "Tool",
    "WD": "Wand"
  };
  return types[type] ?? "Item";
}

export interface NormalizeInventoryItemOptions {
  origin?: 'choice' | 'manual' | 'merged';
}

export function normalizeInventoryItem(detail: any, parsed: any, quantity: number, id: number | string, options?: NormalizeInventoryItemOptions): InventoryItem {
  return {
    id: String(id),
    name: detail?.name ?? parsed.name,
    source: detail?.source ?? parsed.source,
    quantity,
    kind: "item",
    type: detail?.type,
    typeLabel: itemTypeLabel(detail),
    weight: detail?.weight ?? 0,
    valueGp: detail?.value ? detail.value / 100 : 0,
    ac: detail?.ac,
    damage: detail?.dmg1,
    damageType: detail?.dmgType,
    property: detail?.property ?? [],
    entries: detail?.entries ?? [],
    origin: options?.origin,
  };
}

/**
 * Consolidate inventory items by merging stacks of the same item (by itemKey).
 * - Sums quantities
 * - Merges entries and properties arrays
 * - Removes items with quantity <= 0
 * - Handles origin merging: if any item is 'manual', result is 'manual'; if mixed choice/manual, result is 'merged'
 */
export function consolidateInventory(inventory: InventoryItem[]): InventoryItem[] {
  const groups = new Map<string, InventoryItem[]>();
  for (const item of inventory) {
    const key = itemKey(item.name, item.source);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const consolidated: InventoryItem[] = [];
  for (const [key, items] of groups) {
    if (items.length === 0) continue;

    const totalQty = items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0);
    if (totalQty <= 0) continue;

    const base = { ...items[0] };
    base.quantity = totalQty;
    base.entries = [...new Set(items.flatMap(i => i.entries ?? []))];
    base.property = [...new Set(items.flatMap(i => i.property ?? []))];

    const origins = items.map(i => i.origin).filter(Boolean);
    if (origins.length) {
      const hasManual = origins.includes('manual');
      const hasChoice = origins.includes('choice');
      if (hasManual && hasChoice) base.origin = 'merged';
      else if (hasManual && !hasChoice) base.origin = 'manual';
      else base.origin = origins[0] as 'choice' | 'manual' | 'merged';
    }

    consolidated.push(base);
  }
  return consolidated;
}

/**
 * Remove items with quantity <= 0 from inventory.
 */
export function removeEmptyStacks(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(item => Number(item.quantity ?? 0) > 0);
}
