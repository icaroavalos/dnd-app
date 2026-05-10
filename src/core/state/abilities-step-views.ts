/**
 * Abilities Step View Models
 *
 * View models para Score Cards, Standard Array e Point Buy.
 */

import type { AbilityName } from '../../types/background.js';
import type { Character } from '../../types/state.js';
import { calculateCharacterAbilityBonuses, type AbilityBonusMap } from '../character/ability-bonuses.js';
import { deriveAbilityModifier, deriveAbilityScores, signed } from '../character/character-engine.js';
import { ABILITY_LABELS, POINT_BUY_BUDGET } from './abilities-step-constants.js';
import { pointBuyCost, pointBuySpent } from './abilities-step-helpers.js';

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

export interface StandardArrayCardViewModel {
  key: AbilityName;
  label: string;
  score: number;
  modifier: number;
  modifierFormatted: string;
}

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

/** Build score cards for all abilities. */
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

/** Build standard array cards. */
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

/** Build Point Buy view model. */
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
