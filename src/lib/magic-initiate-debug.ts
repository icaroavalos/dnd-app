/**
 * Magic Initiate Debug and Fix
 *
 * Problem: "Ainda falta: Magic Initiate (cleric): 2 cantrips..." appears even after selecting spells.
 *
 * Root cause analysis:
 * 1. state.api.spellDetails might be empty when validation runs
 * 2. Spell names might not match (case sensitivity)
 * 3. bgSpellChoices storage key might be wrong
 *
 * Solution: Add robust debugging and fallbacks.
 */

export interface SpellData {
  name: string;
  level: number;
  school?: string;
}

export interface BackgroundSpellRule {
  id: string;
  name: string;
  cantrips: number;
  level1Spells: number;
}

/**
 * Debug function to check what's in the state
 */
export function debugMagicInitiateState(
  bgSpellChoices: Record<string, string[]> | undefined,
  spellDetails: Record<string, SpellData> | undefined,
  rules: BackgroundSpellRule[]
): {
  ok: boolean;
  errors: string[];
  debug: {
    bgSpellChoicesKeys: string[];
    spellDetailsCount: number;
    rulesCount: number;
    selectedSpells: Record<string, string[]>;
    spellLevels: Record<string, number | 'missing'>;
  };
} {
  const errors: string[] = [];
  const selectedSpells: Record<string, string[]> = {};
  const spellLevels: Record<string, number | 'missing'> = {};

  // Check what keys we have
  const bgSpellChoicesKeys = bgSpellChoices ? Object.keys(bgSpellChoices) : [];

  for (const rule of rules) {
    const storageKey = `bg-${rule.id}`;
    const selected = bgSpellChoices?.[storageKey] || [];
    selectedSpells[storageKey] = selected;

    // Check spell levels
    for (const spellName of selected) {
      const lowerName = spellName.toLowerCase();
      const detail = spellDetails?.[lowerName];

      if (detail) {
        spellLevels[spellName] = detail.level;
      } else {
        // Try to find in values
        const found = Object.values(spellDetails || {}).find(
          d => d?.name?.toLowerCase() === lowerName
        );
        if (found) {
          spellLevels[spellName] = found.level;
        } else {
          spellLevels[spellName] = 'missing';
          errors.push(`Spell "${spellName}" not found in spellDetails`);
        }
      }
    }
  }

  const ok = errors.length === 0;

  return {
    ok,
    errors,
    debug: {
      bgSpellChoicesKeys,
      spellDetailsCount: spellDetails ? Object.keys(spellDetails).length : 0,
      rulesCount: rules.length,
      selectedSpells,
      spellLevels,
    },
  };
}

/**
 * Robust validation that handles edge cases
 */
export function validateMagicInitiateRobust(
  storageKey: string,
  bgSpellChoices: Record<string, string[]> | undefined,
  spellDetails: Record<string, SpellData> | undefined,
  rule: BackgroundSpellRule
): string | null {
  const selected = bgSpellChoices?.[storageKey] || [];

  // Build a case-insensitive lookup
  const spellLevelMap = new Map<string, number>();
  Object.entries(spellDetails || {}).forEach(([key, value]) => {
    spellLevelMap.set(key.toLowerCase(), value?.level ?? -1);
  });

  const getLevel = (name: string): number => {
    const lower = name.toLowerCase();
    // Direct lookup
    if (spellLevelMap.has(lower)) {
      return spellLevelMap.get(lower)!;
    }
    // Try to find by value name
    for (const [key, level] of spellLevelMap.entries()) {
      if (key === lower) return level;
    }
    return -1; // Not found
  };

  const cantrips = selected.filter(s => getLevel(s) === 0);
  const level1 = selected.filter(s => getLevel(s) === 1);

  if (cantrips.length < rule.cantrips) {
    return `${rule.name}: ${rule.cantrips} cantrip(s) needed (have ${cantrips.length})`;
  }
  if (level1.length < rule.level1Spells) {
    return `${rule.name}: ${rule.level1Spells} level 1 spell(s) needed (have ${level1.length})`;
  }

  return null;
}
