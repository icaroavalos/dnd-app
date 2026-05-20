import type { Character } from '../types/character';

export type SpellManagementMode = 'prepare-full-list' | 'prepare-spellbook' | 'replace-one' | 'none';

export interface SpellManagementPolicy {
  mode: SpellManagementMode;
  canPrepareSpells: boolean;
  canLearnSpells: boolean;
  preparationLimit?: number;
}

const FULL_LIST_CLASSES = ['cleric', 'druid', 'paladin'];
const SPELLBOOK_CLASSES = ['wizard'];
const REPLACE_ONE_CLASSES = ['bard', 'warlock', 'sorcerer', 'ranger'];

/**
 * Decides how a character manages their spells based on their class and subclass.
 */
export function getSpellManagementPolicy(character: Character): SpellManagementPolicy {
  const charClass = (character.class || '').toLowerCase();
  
  // Handle Fighter/Rogue subclasses
  if (charClass === 'fighter' || charClass === 'rogue') {
    const subChoice = character.classFeatureChoices?.[`subclass-${charClass}`]?.[0] || '';
    if (subChoice === 'Eldritch Knight' || subChoice === 'Arcane Trickster') {
      return { mode: 'replace-one', canPrepareSpells: false, canLearnSpells: true };
    }
    return { mode: 'none', canPrepareSpells: false, canLearnSpells: false };
  }

  if (FULL_LIST_CLASSES.includes(charClass)) {
    return { mode: 'prepare-full-list', canPrepareSpells: true, canLearnSpells: false };
  }

  if (SPELLBOOK_CLASSES.includes(charClass)) {
    return { mode: 'prepare-spellbook', canPrepareSpells: true, canLearnSpells: true };
  }

  if (REPLACE_ONE_CLASSES.includes(charClass)) {
    return { mode: 'replace-one', canPrepareSpells: false, canLearnSpells: true };
  }

  return { mode: 'none', canPrepareSpells: false, canLearnSpells: false };
}

/**
 * Spells granted by background, species, feat, or specific class features (domain, subclass, etc.)
 * are "granted" and usually always prepared.
 */
export function isGrantedSpell(spell: any): boolean {
  if (!spell) return false;
  const kind = spell.originKind || spell.source;
  const grantedKinds = ['background', 'bg-feat', 'species', 'feat', 'feature', 'feat-auto', 'subclass'];
  return grantedKinds.includes(kind);
}

/**
 * Checks if a spell can be removed from the "Known Spells" or "Spellbook" list.
 */
export function isSpellRemovable(spell: any, policy: SpellManagementPolicy): boolean {
  if (isGrantedSpell(spell)) return false;
  
  // In replace-one mode, class spells can be replaced (removed) on level up.
  if (policy.mode === 'replace-one') {
    return spell.originKind === 'class';
  }

  // Wizards don't remove spells from their spellbook normally.
  if (policy.mode === 'prepare-spellbook') {
    return false; 
  }

  return false;
}

/**
 * Most granted spells do NOT count against the prepared spell limit.
 * Cantrips also don't count against the prepared spell limit (they have their own limit).
 */
export function doesSpellCountAgainstPreparation(spell: any): boolean {
  if (isGrantedSpell(spell)) return false;
  if (spell.level === 0) return false;
  return true;
}

/**
 * Returns the maximum number of prepared spells for the character.
 */
export function getPreparedSpellLimit(character: Character, classEntry?: any): number | null {
  // If we have the full class entry with progression data, use it.
  if (classEntry?.preparedSpellsProgression) {
    return classEntry.preparedSpellsProgression[Math.min(character.level - 1, 19)] || null;
  }

  // Fallback for Wizard if classEntry is missing (common in some views)
  if (character.class?.toLowerCase() === 'wizard') {
    const wizardTable = [
      4, 5, 6, 7, 9, 10, 11, 12, 14, 15,
      16, 16, 18, 18, 20, 20, 22, 22, 25, 25
    ];
    return wizardTable[Math.min(character.level - 1, 19)];
  }

  return null;
}
