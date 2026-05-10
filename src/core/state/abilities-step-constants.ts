/**
 * Abilities Step Constants
 *
 * Constantes para o step de abilities do builder.
 */

import type { AbilityName } from '../../types/background.js';

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
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_BUDGET = 27;
