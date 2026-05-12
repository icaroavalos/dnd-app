import type { Character, ApiState } from '../../types/state.js';
import { deriveProficiencyBonus, deriveAbilityModifier, deriveAbilityScores } from './character-engine.js';
import { calculateCharacterAbilityBonuses } from './ability-bonuses.js';
import type { SpellcastingMetrics } from './spell-engine-types.js';

export function spellcastingMetricsForAbility(
  ability: string,
  character: Character,
  derivedSheet?: any
): SpellcastingMetrics {
  const proficiencyBonus = derivedSheet?.proficiencyBonus ?? deriveProficiencyBonus(character.level);
  const bonuses = calculateCharacterAbilityBonuses(character);
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  const normalizedAbility = ((ability || 'int').toLowerCase() || 'int') as keyof typeof scores;
  const score = scores[normalizedAbility] || 10;
  const modifier = deriveAbilityModifier(score);

  return {
    ability: normalizedAbility,
    modifier,
    attackBonus: proficiencyBonus + modifier,
    saveDc: 8 + proficiencyBonus + modifier,
  };
}

export function currentLevelRow(character: Character, api: ApiState) {
  if (!character.class || !api?.levels) return undefined;
  const levels = api.levels[character.class];
  return Array.isArray(levels) ? levels.find((l: any) => l.level === character.level) : undefined;
}

export function classHasSpellList(className: string, api: ApiState): boolean {
  if (!className || !api?.classSpells) return false;
  return (api.classSpells[className] ?? []).length > 0;
}

export function casterLevel(character: Character, api: ApiState): number {
  const className = character.class;
  if (!className || !api?.classes) return 0;
  const progression = api.classes[className]?.casterProgression;
  if (!classHasSpellList(className, api)) return 0;
  if (progression === "artificer") return Math.max(0, Math.ceil(character.level / 2));
  if (progression === "pact") return character.level;
  const halfCasters = ["paladin", "ranger"];
  if (halfCasters.includes(className.toLowerCase())) return Math.max(0, Math.floor(character.level / 2));
  return character.level;
}

export function classSpellAbility(className: string, api: ApiState): string {
  if (!className || !api?.classes) return "int";
  const apiAbility = api.classes[className]?.spellcastingAbility;
  if (apiAbility) return apiAbility.toLowerCase();
  const ability: Record<string, string> = {
    bard: "cha",
    cleric: "wis",
    druid: "wis",
    paladin: "cha",
    ranger: "wis",
    sorcerer: "cha",
    warlock: "cha",
    wizard: "int",
    monk: "wis",
  };
  return ability[className.toLowerCase()] ?? "int";
}

export function spellSlotsMaxByLevel(character: Character, api: ApiState): Record<number, number> {
  const levelRow = currentLevelRow(character, api);
  const spellcasting = levelRow?.spellcasting ?? {};

  const slots: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) {
    const val = Number(spellcasting[`spell_slots_level_${i}`]) || 0;
    if (val > 0) slots[i] = val;
  }
  return slots;
}
