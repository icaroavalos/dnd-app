/**
 * Character Abilities - Cálculos de ability scores e modifiers
 *
 * Funções puras para cálculo de modifiers, saving throws, e point buy
 */

import type { AbilityScores } from '../../types/state';

/**
 * Calcula modifier para um ability score
 * Fórmula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calcula todos os modifiers
 */
export function calculateAllModifiers(
  abilities: AbilityScores
): Record<keyof AbilityScores, number> {
  return {
    str: calculateModifier(abilities.str),
    dex: calculateModifier(abilities.dex),
    con: calculateModifier(abilities.con),
    int: calculateModifier(abilities.int),
    wis: calculateModifier(abilities.wis),
    cha: calculateModifier(abilities.cha),
  };
}

/**
 * Calcula total de um saving throw com proficiência
 */
export function calculateSavingThrow(
  ability: keyof AbilityScores,
  score: number,
  isProficient: boolean,
  proficiencyBonus: number = 2
): number {
  const modifier = calculateModifier(score);
  const proficiency = isProficient ? proficiencyBonus : 0;
  return modifier + proficiency;
}

/**
 * Point Buy costs por score
 */
export const POINT_BUY_COSTS = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
} as const;

export const POINT_BUY_BUDGET = 27;

/**
 * Calcula custo point buy para um array de scores
 */
export function calculatePointBuyCost(scores: number[]): number {
  return scores.reduce((total, score) => {
    const cost =
      POINT_BUY_COSTS[score as keyof typeof POINT_BUY_COSTS] ?? 0;
    return total + cost;
  }, 0);
}

/**
 * Valida se scores são válidos para point buy
 */
export function isValidPointBuy(
  scores: number[],
  budget: number = POINT_BUY_BUDGET
): boolean {
  const cost = calculatePointBuyCost(scores);
  return cost === budget;
}

/**
 * Standard array default
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/**
 * Valida se um array de scores é válido (todas entre 8-15)
 */
export function isValidAbilityScores(scores: number[]): boolean {
  return scores.every((s) => s >= 8 && s <= 15);
}

/**
 * Soma dos modifiers de um array de scores
 */
export function calculateAbilityScoreSum(scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0);
}
