/**
 * Abilities Step Helpers
 *
 * Funcoes auxiliares puras para Point Buy e manipulacao de abilities.
 */

import type { AbilityName } from '../../types/background.js';
import type { Character } from '../../types/state.js';
import { calculateCharacterAbilityBonuses, type AbilityBonusMap } from '../character/ability-bonuses.js';
import { deriveAbilityScores } from '../character/character-engine.js';
import { ABILITY_KEYS, POINT_BUY_COSTS, POINT_BUY_BUDGET, STANDARD_ARRAY } from './abilities-step-constants.js';

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

/** Adjust Point Buy score within budget constraints. */
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

/** Trim abilities to fit within Point Buy budget. */
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

/** Apply ability method (standard, point buy, manual). */
export function applyAbilityMethod(
  abilities: Partial<Record<AbilityName, number>>,
  method: import('./abilities-step-constants.js').AbilityMethodId,
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

/** Get ability bonus from character choices. */
export function abilityBonusFromChoices(
  character: Pick<Character, 'asiChoices' | 'bgChoices'>,
  key: AbilityName,
): number {
  const bonuses = calculateCharacterAbilityBonuses(character);
  return bonuses[key];
}

/** Get all ability bonuses from character choices. */
export function allAbilityBonuses(
  character: Pick<Character, 'asiChoices' | 'bgChoices'>,
): AbilityBonusMap {
  return calculateCharacterAbilityBonuses(character);
}
