import type { CharacterRecord } from '../../domain/contracts/index.js';

interface ItemLike {
  name: string;
  property?: string[];
}

export interface AmmoGroup {
  acceptedBaseItemIds: string[];
  preferredBaseItemId: string;
}

export function resolveAmmoGroup(item: ItemLike): AmmoGroup | null {
  const propertyCodes = new Set((item.property ?? []).map((value) => String(value).split('|')[0]));
  if (!propertyCodes.has('A')) {
    return null;
  }

  const slug = slugify(item.name);
  if (slug.includes('crossbow')) {
    return {
      acceptedBaseItemIds: ['bolt', 'bolts-20'],
      preferredBaseItemId: 'bolts-20'
    };
  }

  if (slug === 'sling') {
    return {
      acceptedBaseItemIds: ['sling-bullet', 'sling-bullets-20'],
      preferredBaseItemId: 'sling-bullets-20'
    };
  }

  if (slug.includes('bow')) {
    return {
      acceptedBaseItemIds: ['arrow', 'arrows-20'],
      preferredBaseItemId: 'arrows-20'
    };
  }

  return null;
}

export function countAmmoInInventory(
  inventory: CharacterRecord['inventory'],
  ammoGroup: AmmoGroup
): number {
  return inventory
    .filter((inventoryItem) => ammoGroup.acceptedBaseItemIds.includes(slugify(inventoryItem.baseItemId)))
    .reduce((sum, inventoryItem) => sum + normalizeInventoryQuantity(inventoryItem.quantity), 0);
}

export function normalizeInventoryQuantity(quantity: number | undefined): number {
  return Math.max(0, Math.floor(quantity ?? 1));
}

export function slugify(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
