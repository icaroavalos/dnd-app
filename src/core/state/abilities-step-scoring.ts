/**
 * Abilities Step Scoring
 *
 * Funções de scoring e cálculo de modificadores.
 */

import type { AbilityName } from '../../types/background.js';
import type { Character } from '../../types/state.js';
import { calculateCharacterAbilityBonuses, type AbilityBonusMap } from '../character/ability-bonuses.js';
import { deriveAbilityModifier, deriveAbilityScores } from '../character/character-engine.js';
import { ABILITY_KEYS } from './abilities-step-constants.js';

/** Get the saving throw proficiencies for a specific class from API data. */
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

/** Calculates the total score for an ability including all current bonuses. */
export function getAbilityScore(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  key: AbilityName
): number {
  const bonuses = calculateCharacterAbilityBonuses(character);
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  return scores[key];
}

/** Calculates the modifier for a character's ability score. */
export function getAbilityModifier(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  key: AbilityName
): number {
  return deriveAbilityModifier(getAbilityScore(character, key));
}

/** Calculates an ability score while omitting a specific ASI rule. */
export function getAbilityScoreBeforeAsiRule(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  key: AbilityName,
  ruleId: string
): number {
  const bonuses = calculateCharacterAbilityBonuses(character, { omitAsiRuleId: ruleId });
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  return scores[key];
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
