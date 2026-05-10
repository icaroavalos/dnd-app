import type { CharacterRecord } from '@shared/contracts';
import { resolveAmmoGroup, countAmmoInInventory } from '../../inventory/ammo-rules.js';
import { slugify } from './utils.js';

interface ItemCatalogEntry {
  name: string;
  type?: string;
  property?: string[];
  dmg1?: string;
  dmgType?: string;
  range?: string;
}

export function normalizeWeaponRange(item: ItemCatalogEntry): string {
  if (canMakeThrownAttack(item)) {
    return '5 feet';
  }
  return item.range ? String(item.range) : '5 feet';
}

export function normalizeThrownRange(item: ItemCatalogEntry): string {
  return item.range ? String(item.range) : '20/60';
}

export function resolveInventoryWeaponDamage(
  instanceId: string,
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): string {
  const properties = weaponPropertySet(item);

  if (!properties.has('V')) {
    return String(item.dmg1);
  }

  if (!canUseVersatileDamage(instanceId, inventory)) {
    return String(item.dmg1);
  }

  return versatileDamageForBase(String(item.dmg1));
}

export function canUseVersatileDamage(
  instanceId: string,
  inventory: CharacterRecord['inventory']
): boolean {
  const currentItem = inventory.find((item) => item.instanceId === instanceId);
  if (!currentItem || currentItem.status !== 'equipped_main_hand') {
    return false;
  }

  return !inventory.some((item) => {
    if (item.instanceId === instanceId) return false;
    return item.status === 'equipped_off_hand' || item.status === 'equipped_shield';
  });
}

export function isTwoHandedWeaponBlocked(
  instanceId: string,
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): boolean {
  if (!weaponPropertySet(item).has('2H')) {
    return false;
  }

  return inventory.some((candidate) => {
    if (candidate.instanceId === instanceId) return false;
    return candidate.status === 'equipped_off_hand' || candidate.status === 'equipped_shield';
  });
}

export function requiresFreeHandToLoad(item: ItemCatalogEntry): boolean {
  const properties = weaponPropertySet(item);
  return properties.has('A') && !properties.has('2H');
}

export function hasFreeHandToLoad(
  instanceId: string,
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): boolean {
  if (!requiresFreeHandToLoad(item)) {
    return true;
  }

  return !inventory.some((candidate) => {
    if (candidate.instanceId === instanceId) return false;
    return candidate.status === 'equipped_off_hand' || candidate.status === 'equipped_shield';
  });
}

export function versatileDamageForBase(baseDamage: string): string {
  switch (baseDamage) {
    case '1d6':
      return '1d8';
    case '1d8':
      return '1d10';
    default:
      return baseDamage;
  }
}

export function weaponRangeLabel(item: ItemCatalogEntry): string {
  const typeCode = String(item.type ?? '').split('|')[0];
  if (canMakeThrownAttack(item)) {
    return 'Melee';
  }
  return typeCode === 'R' || Boolean(item.range) ? 'Ranged' : 'Melee';
}

export function weaponNotes(
  item: ItemCatalogEntry,
  ammoState?: { required: boolean; count: number }
): string {
  const parts = [
    normalizeDamageType(item.dmgType),
    normalizeWeaponProperties(item.property ?? []),
    ammoState?.required ? `Ammo: ${ammoState.count}` : ''
  ].filter(Boolean);
  return parts.join(' • ') || 'Weapon attack';
}

export function resolveAmmoState(
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): { required: boolean; count: number } {
  const ammoGroup = resolveAmmoGroup(item);
  if (!ammoGroup) {
    return { required: false, count: 0 };
  }
  return { required: true, count: countAmmoInInventory(inventory, ammoGroup) };
}

export function resolveOpportunityReach(
  character: CharacterRecord,
  itemLookup: Map<string, ItemCatalogEntry>
): number {
  const equippedMeleeWeapons = character.inventory
    .filter((item) => item.status === 'equipped_main_hand' || item.status === 'equipped_off_hand')
    .map((item) => itemLookup.get(slugify(item.baseItemId)))
    .filter((item): item is ItemCatalogEntry => Boolean(item))
    .filter((item) => isWeapon(item) && String(item.type ?? '').split('|')[0] === 'M');

  return equippedMeleeWeapons.some((item) => weaponPropertySet(item).has('R')) ? 10 : 5;
}

export function hasTwoWeaponFightingLoadout(
  character: CharacterRecord,
  itemLookup: Map<string, ItemCatalogEntry>
): boolean {
  const mainHand = character.inventory.find((item) => item.status === 'equipped_main_hand');
  const offHand = character.inventory.find((item) => item.status === 'equipped_off_hand');

  if (!mainHand || !offHand) {
    return false;
  }

  const mainHandDetail = itemLookup.get(slugify(mainHand.baseItemId));
  const offHandDetail = itemLookup.get(slugify(offHand.baseItemId));

  if (!mainHandDetail || !offHandDetail || !isWeapon(mainHandDetail) || !isWeapon(offHandDetail)) {
    return false;
  }

  return weaponPropertySet(mainHandDetail).has('L') && weaponPropertySet(offHandDetail).has('L');
}

export function canMakeThrownAttack(item: ItemCatalogEntry): boolean {
  const typeCode = String(item.type ?? '').split('|')[0];
  return typeCode === 'M' && weaponPropertySet(item).has('T') && Boolean(item.range);
}

export function normalizeDamageType(code: string | undefined): string {
  switch (String(code ?? '').toUpperCase()) {
    case 'B':
      return 'Bludgeoning';
    case 'P':
      return 'Piercing';
    case 'S':
      return 'Slashing';
    default:
      return '';
  }
}

export function normalizeWeaponProperties(properties: string[]): string {
  const labels = properties
    .map((value) => String(value).split('|')[0])
    .map((code) => {
      switch (code) {
        case 'A':
          return 'Ammunition';
        case 'AF':
          return 'Automatic Fire';
        case 'BF':
          return 'Burst Fire';
        case 'F':
          return 'Finesse';
        case 'H':
          return 'Heavy';
        case 'L':
          return 'Light';
        case '2H':
          return 'Two-Handed';
        case 'T':
          return 'Thrown';
        case 'R':
          return 'Reach';
        case 'V':
          return 'Versatile';
        case 'LD':
          return 'Loading';
        case 'RLD':
          return 'Reload';
        default:
          return '';
      }
    })
    .filter(Boolean);

  return labels.join(', ');
}

export function buildWeaponDetail(
  item: ItemCatalogEntry,
  ammoState: { required: boolean; count: number },
  blockers: { twoHandedBlocked: boolean; loadingBlocked: boolean }
): string {
  const parts = [weaponNotes(item, ammoState)];

  if (blockers.twoHandedBlocked) {
    parts.push('Blocked: this weapon requires two hands.');
  }

  if (blockers.loadingBlocked) {
    parts.push('Blocked: this weapon requires a free hand to load.');
  }

  return parts.filter(Boolean).join(' ');
}

export function weaponPropertySet(item: ItemCatalogEntry): Set<string> {
  return new Set((item.property ?? []).map((value: string) => String(value).split('|')[0]));
}

export function isWeapon(item: ItemCatalogEntry): boolean {
  const typeCode = String(item.type ?? '').split('|')[0];
  return Boolean(item.dmg1) && (typeCode === 'M' || typeCode === 'R');
}
