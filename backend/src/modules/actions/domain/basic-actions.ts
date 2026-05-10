import type { DerivedAction } from '@shared/contracts';
import { slugify } from './utils.js';

interface ItemCatalogEntry {
  type?: string;
  property?: string[];
  dmg1?: string;
}

function resolveOpportunityReach(
  character: any,
  itemLookup: Map<string, ItemCatalogEntry>
): number {
  const equippedMeleeWeapons = character.inventory
    .filter((item: any) => item.status === 'equipped_main_hand' || item.status === 'equipped_off_hand')
    .map((item: any) => itemLookup.get(slugify(item.baseItemId)))
    .filter((item: ItemCatalogEntry | undefined): item is ItemCatalogEntry => Boolean(item))
    .filter((item: ItemCatalogEntry) => isWeapon(item) && String(item.type ?? '').split('|')[0] === 'M');

  return equippedMeleeWeapons.some((item: ItemCatalogEntry) => weaponPropertySet(item).has('R')) ? 10 : 5;
}

function hasTwoWeaponFightingLoadout(
  character: any,
  itemLookup: Map<string, ItemCatalogEntry>
): boolean {
  const mainHand = character.inventory.find((item: any) => item.status === 'equipped_main_hand');
  const offHand = character.inventory.find((item: any) => item.status === 'equipped_off_hand');

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

function isWeapon(item: ItemCatalogEntry): boolean {
  const typeCode = String(item.type ?? '').split('|')[0];
  return Boolean(item.dmg1) && (typeCode === 'M' || typeCode === 'R');
}

function weaponPropertySet(item: ItemCatalogEntry): Set<string> {
  return new Set((item.property ?? []).map((value: string) => String(value).split('|')[0]));
}

export function deriveBasicActions(
  character: any,
  itemLookup: Map<string, ItemCatalogEntry>
): DerivedAction[] {
  const opportunityReach = resolveOpportunityReach(character, itemLookup);
  const canUseTwoWeaponFighting = hasTwoWeaponFightingLoadout(character, itemLookup);

  return [
    {
      id: 'rule:attack',
      kind: 'action',
      icon: 'A',
      name: 'Attack',
      subtitle: 'Combat Action',
      range: '--',
      rangeLabel: 'Varies',
      hit: '--',
      damage: [],
      notes: 'Make one attack with a weapon or an Unarmed Strike.',
      detail: 'When you take the Attack action, you can make one attack roll with a weapon or an Unarmed Strike.',
      cost: { economy: 'action' }
    },
    {
      id: 'rule:dash',
      kind: 'action',
      icon: 'A',
      name: 'Dash',
      subtitle: 'Combat Action',
      range: 'Self',
      rangeLabel: 'Move',
      hit: '--',
      damage: [],
      notes: 'Gain extra movement for the current turn.',
      detail: 'When you take the Dash action, you gain extra movement for the current turn.',
      cost: { economy: 'action' }
    },
    {
      id: 'rule:dodge',
      kind: 'action',
      icon: 'A',
      name: 'Dodge',
      subtitle: 'Combat Action',
      range: 'Self',
      rangeLabel: 'Defense',
      hit: '--',
      damage: [],
      notes: 'Attacks against you have Disadvantage.',
      detail: 'Until the start of your next turn, attack rolls against you have Disadvantage if you can see the attacker.',
      cost: { economy: 'action' }
    },
    {
      id: 'rule:two-weapon',
      kind: 'bonus',
      icon: 'BA',
      name: 'Two-Weapon Fighting',
      subtitle: 'Bonus Action',
      range: 'Melee',
      rangeLabel: 'Weapon',
      hit: '--',
      damage: [],
      notes: canUseTwoWeaponFighting
        ? 'Extra attack with eligible Light weapons.'
        : 'Requires two equipped Light weapons.',
      detail: canUseTwoWeaponFighting
        ? "When you make the extra attack of the Light property, you don't add your ability modifier to the extra attack's damage unless that modifier is negative."
        : 'Equip two equipped Light weapons in your main hand and off hand to make the Light-property extra attack as a Bonus Action.',
      cost: { economy: 'bonus' },
      source: { type: 'rule', requiresLightWeapons: true, lightWeaponsReady: canUseTwoWeaponFighting }
    },
    {
      id: 'rule:opportunity',
      kind: 'reaction',
      icon: 'R',
      name: 'Opportunity Attack',
      subtitle: 'Reaction',
      range: `${opportunityReach} feet`,
      rangeLabel: 'Melee',
      hit: '--',
      damage: [],
      notes: `A creature leaves your reach (${opportunityReach} feet).`,
      detail: `You can make an Opportunity Attack when a creature you can see leaves your reach of ${opportunityReach} feet.`,
      cost: { economy: 'reaction' }
    },
    {
      id: 'rule:interact',
      kind: 'other',
      icon: 'O',
      name: 'Interact with an Object',
      subtitle: 'Other',
      range: 'Touch',
      rangeLabel: 'Object',
      hit: '--',
      damage: [],
      notes: 'Interact with one object or feature.',
      detail: 'You normally interact with one object or feature of the environment for free during your move or action.',
      cost: { economy: 'free' }
    }
  ];
}
