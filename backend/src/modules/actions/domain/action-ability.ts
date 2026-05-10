import type { DerivedCharacterSheet } from '@shared/contracts';

interface ItemCatalogEntry {
  type?: string;
  property?: string[];
}

export function resolveAttackAbilityForExplicitAttack(
  attack: any,
  character: any
): 'str' | 'dex' {
  if (String(attack.range ?? '').includes('/')) {
    return 'dex';
  }

  const classId = slugify(character.classes[0]?.classId ?? '');
  return classId === 'monk' || classId === 'rogue' ? 'dex' : 'str';
}

export function resolveAttackAbilityForItem(
  item: ItemCatalogEntry,
  projection: DerivedCharacterSheet
): 'str' | 'dex' {
  const typeCode = String(item.type ?? '').split('|')[0];
  const propertyCodes = new Set((item.property ?? []).map((value: string) => String(value).split('|')[0]));

  if (typeCode === 'R') {
    return 'dex';
  }

  if (propertyCodes.has('F')) {
    return projection.abilityModifiers.dex > projection.abilityModifiers.str ? 'dex' : 'str';
  }

  return 'str';
}

function slugify(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
