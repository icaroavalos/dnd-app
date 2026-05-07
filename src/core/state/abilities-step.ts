/**
 * Abilities Step - View model and logic for the Atributos step of the builder.
 *
 * Provides a pure-function view model so app.js only needs to call
 * `buildAbilitiesViewModel(...)` and render the result.
 */

import type { AbilityName } from '../../types/background';
import type { AbilityScores, Character } from '../../types/state';
import { calculateCharacterAbilityBonuses, type AbilityBonusMap } from '../character/ability-bonuses.js';
import { deriveAbilityModifier, deriveAbilityScores, signed } from '../character/character-engine.js';

// ============================================================================
// Constants
// ============================================================================

export type AbilityMethodId = 'standard' | 'pointBuy' | 'manual';

export const ABILITY_KEYS: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: [AbilityName, string][] = [
  ['str', 'Strength'],
  ['dex', 'Dexterity'],
  ['con', 'Constitution'],
  ['int', 'Intelligence'],
  ['wis', 'Wisdom'],
  ['cha', 'Charisma'],
];

export const ABILITY_METHODS: [AbilityMethodId, string][] = [
  ['standard', 'Standard Array'],
  ['manual', 'Manual/Rolled'],
  ['pointBuy', 'Point Buy'],
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const POINT_BUY_BUDGET = 27;

// ============================================================================
// Pure Helpers
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Cost of a single ability score in Point Buy. */
export function pointBuyCost(score: number): number {
  return POINT_BUY_COSTS[clamp(Number(score) || 8, 8, 15)] ?? 0;
}

/** Total Point Buy points spent for an abilities map. */
export function pointBuySpent(abilities: Partial<Record<AbilityName, number>>): number {
  return ABILITY_KEYS.reduce((total, key) => total + pointBuyCost(abilities[key] ?? 8), 0);
}

/** Get the bonus for a single ability from background + ASI choices. */
export function abilityBonusFromChoices(
  character: Pick<Character, 'asiChoices' | 'bgChoices'>,
  key: AbilityName,
): number {
  const bonuses = calculateCharacterAbilityBonuses(character);
  return bonuses[key];
}

/** Get all ability bonuses from background + ASI choices. */
export function allAbilityBonuses(
  character: Pick<Character, 'asiChoices' | 'bgChoices'>,
): AbilityBonusMap {
  return calculateCharacterAbilityBonuses(character);
}

// ============================================================================
// Score Calculation Card ViewModel
// ============================================================================

export interface ScoreCardViewModel {
  key: AbilityName;
  label: string;
  baseScore: number;
  bonus: number;
  totalScore: number;
  modifier: number;
  modifierFormatted: string;
  bonusFormatted: string;
}

/**
 * Gets the saving throw proficiencies for a specific class from API data.
 */
export function getClassSavingThrows(
  characterClass: string,
  apiClasses: Record<string, any>
): AbilityName[] {
  const apiSaves = apiClasses[characterClass]?.saving_throws;
  if (Array.isArray(apiSaves) && apiSaves.length) {
    return apiSaves.map((save: any) => (save.index || save) as AbilityName).filter(Boolean);
  }
  return [];
}

/**
 * Calculates the total score for an ability including all current bonuses.
 */
export function getAbilityScore(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  key: AbilityName
): number {
  const bonuses = calculateCharacterAbilityBonuses(character);
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  return scores[key];
}

/**
 * Calculates the modifier for a character's ability score.
 */
export function getAbilityModifier(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  key: AbilityName
): number {
  return deriveAbilityModifier(getAbilityScore(character, key));
}

/**
 * Calculates an ability score while omitting a specific ASI rule.
 */
export function getAbilityScoreBeforeAsiRule(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  key: AbilityName,
  ruleId: string
): number {
  const bonuses = calculateCharacterAbilityBonuses(character, { omitAsiRuleId: ruleId });
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  return scores[key];
}

export function buildScoreCards(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
): ScoreCardViewModel[] {
  const bonuses = calculateCharacterAbilityBonuses(character);
  const totalScores = deriveAbilityScores(character.abilities ?? {}, bonuses);

  return ABILITY_LABELS.map(([key, label]) => {
    const baseScore = Number(character.abilities?.[key]) || 10;
    const bonus = bonuses[key];
    const totalScore = totalScores[key];
    const modifier = deriveAbilityModifier(totalScore);
    return {
      key,
      label,
      baseScore,
      bonus,
      totalScore,
      modifier,
      modifierFormatted: signed(modifier),
      bonusFormatted: signed(bonus),
    };
  });
}

// ============================================================================
// Standard Array ViewModel
// ============================================================================

export interface StandardArrayCardViewModel {
  key: AbilityName;
  label: string;
  score: number;
  modifier: number;
  modifierFormatted: string;
}

export function buildStandardArrayCards(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
): StandardArrayCardViewModel[] {
  const bonuses = calculateCharacterAbilityBonuses(character);
  const totalScores = deriveAbilityScores(character.abilities ?? {}, bonuses);

  return ABILITY_LABELS.map(([key, label]) => {
    const totalScore = totalScores[key];
    return {
      key,
      label,
      score: Number(character.abilities?.[key]) || 10,
      modifier: deriveAbilityModifier(totalScore),
      modifierFormatted: signed(deriveAbilityModifier(totalScore)),
    };
  });
}

// ============================================================================
// Point Buy ViewModel
// ============================================================================

export interface PointBuyRowViewModel {
  key: AbilityName;
  label: string;
  score: number;
  cost: number;
  modifier: number;
  modifierFormatted: string;
  canIncrease: boolean;
  canDecrease: boolean;
}

export interface PointBuyViewModel {
  spent: number;
  budget: number;
  remaining: number;
  rows: PointBuyRowViewModel[];
}

export function buildPointBuyViewModel(
  abilities: Partial<Record<AbilityName, number>>,
  bonuses: AbilityBonusMap,
): PointBuyViewModel {
  const spent = pointBuySpent(abilities);
  const remaining = POINT_BUY_BUDGET - spent;
  const totalScores = deriveAbilityScores(abilities, bonuses);

  const rows = ABILITY_LABELS.map(([key, label]) => {
    const score = Number(abilities[key]) || 8;
    const nextCost = pointBuyCost(score + 1) - pointBuyCost(score);
    const canIncrease = score < 15 && remaining >= nextCost;
    const modifier = deriveAbilityModifier(totalScores[key]);
    return {
      key,
      label,
      score,
      cost: pointBuyCost(score),
      modifier,
      modifierFormatted: signed(modifier),
      canIncrease,
      canDecrease: score > 8,
    };
  });

  return { spent, budget: POINT_BUY_BUDGET, remaining, rows };
}

// ============================================================================
// Point Buy Mutations (pure — return new abilities map)
// ============================================================================

export function adjustPointBuyScore(
  abilities: Record<AbilityName, number>,
  key: AbilityName,
  delta: number,
): Record<AbilityName, number> {
  const current = Number(abilities[key]) || 8;
  const next = clamp(current + delta, 8, 15);
  if (next === current) return abilities;

  const spent = pointBuySpent(abilities);
  if (delta > 0 && spent + pointBuyCost(next) - pointBuyCost(current) > POINT_BUY_BUDGET) {
    return abilities;
  }
  return { ...abilities, [key]: next };
}

export function trimPointBuyToBudget(
  abilities: Record<AbilityName, number>,
): Record<AbilityName, number> {
  const result = { ...abilities };
  let spent = pointBuySpent(result);
  while (spent > POINT_BUY_BUDGET) {
    const highest = ABILITY_KEYS
      .filter((key) => result[key] > 8)
      .sort((a, b) => result[b] - result[a])[0];
    if (!highest) break;
    result[highest] -= 1;
    spent = pointBuySpent(result);
  }
  return result;
}

export function applyAbilityMethod(
  abilities: Partial<Record<AbilityName, number>>,
  method: AbilityMethodId,
): Record<AbilityName, number> {
  if (method === 'standard') {
    return Object.fromEntries(
      ABILITY_KEYS.map((key, index) => [key, STANDARD_ARRAY[index]])
    ) as Record<AbilityName, number>;
  }
  if (method === 'pointBuy') {
    const clamped = Object.fromEntries(
      ABILITY_KEYS.map((key) => [key, clamp(Number(abilities[key]) || 8, 8, 15)])
    ) as Record<AbilityName, number>;
    return trimPointBuyToBudget(clamped);
  }
  // manual — keep current values as-is
  return Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, Number(abilities[key]) || 10])
  ) as Record<AbilityName, number>;
}

/** Swap two ability scores (used by standard array drag). */
export function swapAbilities(
  abilities: Record<AbilityName, number>,
  from: AbilityName,
  to: AbilityName,
): Record<AbilityName, number> {
  if (from === to) return abilities;
  return {
    ...abilities,
    [from]: abilities[to],
    [to]: abilities[from],
  };
}
