import type { AbilityName } from '../../types/background';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SpellcastingMetrics {
  ability: AbilityName;
  score: number;
  modifier: number;
  attackBonus: number;
  saveDc: number;
}

export function deriveProficiencyBonus(level: number): number {
  return Math.ceil((Number(level) || 1) / 4) + 1;
}

const ABILITY_KEYS: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function deriveAbilityScores(
  baseScores: Partial<Record<AbilityName, number>>,
  bonuses: Partial<Record<AbilityName, number>> = {}
): AbilityScores {
  return {
    str: clamp((Number(baseScores.str) || 10) + (Number(bonuses.str) || 0), 1, 30),
    dex: clamp((Number(baseScores.dex) || 10) + (Number(bonuses.dex) || 0), 1, 30),
    con: clamp((Number(baseScores.con) || 10) + (Number(bonuses.con) || 0), 1, 30),
    int: clamp((Number(baseScores.int) || 10) + (Number(bonuses.int) || 0), 1, 30),
    wis: clamp((Number(baseScores.wis) || 10) + (Number(bonuses.wis) || 0), 1, 30),
    cha: clamp((Number(baseScores.cha) || 10) + (Number(bonuses.cha) || 0), 1, 30),
  };
}

export function deriveAbilityModifier(score: number): number {
  return Math.floor(((Number(score) || 10) - 10) / 2);
}

export function deriveSpellcastingMetrics(
  ability: AbilityName | string,
  abilityScores: Partial<Record<AbilityName, number>>,
  proficiencyBonus: number
): SpellcastingMetrics {
  const normalizedAbility = normalizeAbility(ability);
  const score = clamp(Number(abilityScores[normalizedAbility]) || 10, 1, 30);
  const modifier = deriveAbilityModifier(score);

  return {
    ability: normalizedAbility,
    score,
    modifier,
    attackBonus: proficiencyBonus + modifier,
    saveDc: 8 + proficiencyBonus + modifier,
  };
}

export function deriveLevelOneMaxHp(hitDie: number, constitutionScore: number): number {
  return Math.max(1, (Number(hitDie) || 8) + deriveAbilityModifier(constitutionScore));
}

export function deriveMaxHp(
  level: number,
  hitDie: number,
  constitutionModifier: number
): number {
  const first = Math.max(1, hitDie + constitutionModifier);
  const later = Math.max(1, Math.floor(hitDie / 2) + 1 + constitutionModifier);
  return first + Math.max(0, level - 1) * later;
}

export function deriveSavingThrowBonus(
  abilityScore: number,
  proficient: boolean,
  proficiencyBonus: number
): number {
  return deriveAbilityModifier(abilityScore) + (proficient ? proficiencyBonus : 0);
}

export function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function normalizeAbility(value: AbilityName | string): AbilityName {
  return ABILITY_KEYS.includes(value as AbilityName) ? (value as AbilityName) : 'int';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
