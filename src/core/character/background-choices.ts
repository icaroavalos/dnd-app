/**
 * Background Choices - Manage background selection state
 *
 * Provides utilities for persisting and validating background choices
 * in the character state object.
 */

import type { AbilityName, AbilityIncrementPattern, BackgroundChoiceState } from '../../types/background';

/**
 * Create a new empty background choices state
 */
export function createEmptyBgChoices(): BackgroundChoiceState {
  return {
    background: null,
    source: 'XPHB',
    abilityIncrement: null,
    abilityScores: [],
    skillChoices: [],
    toolChoices: [],
    equipmentChoice: null,
    spellcastingAbility: null,
  };
}

/**
 * Reset choices when background changes
 */
export function resetChoicesForBackground(background: string): Partial<BackgroundChoiceState> {
  return {
    abilityIncrement: null,
    abilityScores: [],
    skillChoices: [],
    toolChoices: [],
    equipmentChoice: null,
    spellcastingAbility: null,
  };
}

/**
 * Get the ability modifier for an increment pattern
 * Returns [bonus1, bonus2, bonus3] where bonuses are 2, 1, or 1,1,1 pattern
 */
export function getAbilityIncrements(
  pattern: AbilityIncrementPattern | null,
  scores: AbilityName[]
): Record<AbilityName, number> {
  const result: Record<AbilityName, number> = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  };

  if (!pattern || scores.length === 0) return result;

  if (pattern === '2_1' && scores.length >= 2) {
    result[scores[0]] = 2;
    result[scores[1]] = 1;
  } else if (pattern === '1_1_1' && scores.length >= 3) {
    scores.slice(0, 3).forEach((score) => {
      result[score] = 1;
    });
  }

  return result;
}

/**
 * Apply background choices to character abilities
 * Returns the bonuses to apply
 */
export function calculateBackgroundAbilityBonuses(
  choices: BackgroundChoiceState
): Record<AbilityName, number> {
  if (!choices.abilityIncrement || choices.abilityScores.length === 0) {
    return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  }

  return getAbilityIncrements(choices.abilityIncrement, choices.abilityScores);
}

/**
 * Check if background choices are complete for a given background requirements
 */
export function areBackgroundChoicesComplete(
  choices: BackgroundChoiceState,
  requirements: {
    abilityScores: number;
    skills: number;
    equipment: boolean;
    magicInitiate: boolean;
  }
): boolean {
  if (!choices.background) return false;

  // Check ability scores (always required)
  if (choices.abilityScores.length < requirements.abilityScores) return false;

  // Check equipment (always required)
  if (requirements.equipment && !choices.equipmentChoice) return false;

  // If Magic Initiate, need spellcasting ability
  if (requirements.magicInitiate && !choices.spellcastingAbility) return false;

  return true;
}

/**
 * Get missing choices for a background
 */
export function getMissingBackgroundChoices(
  choices: BackgroundChoiceState,
  requirements: {
    abilityScores: number;
    skills: number;
    equipment: boolean;
    magicInitiate: boolean;
  }
): string[] {
  const missing: string[] = [];

  if (!choices.background) {
    missing.push('background');
    return missing;
  }

  if (choices.abilityScores.length < requirements.abilityScores) {
    missing.push(`ability scores (need ${requirements.abilityScores - choices.abilityScores.length} more)`);
  }

  if (requirements.equipment && !choices.equipmentChoice) {
    missing.push('equipment choice');
  }

  if (requirements.magicInitiate && !choices.spellcastingAbility) {
    missing.push('spellcasting ability (Magic Initiate)');
  }

  return missing;
}

/**
 * Serialize choices for storage (removes null values for cleaner save)
 */
export function serializeBgChoices(choices: BackgroundChoiceState): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (choices.background) result.background = choices.background;
  if (choices.source !== 'XPHB') result.source = choices.source;
  if (choices.abilityIncrement) result.abilityIncrement = choices.abilityIncrement;
  if (choices.abilityScores.length) result.abilityScores = choices.abilityScores;
  if (choices.skillChoices.length) result.skillChoices = choices.skillChoices;
  if (choices.toolChoices.length) result.toolChoices = choices.toolChoices;
  if (choices.equipmentChoice) result.equipmentChoice = choices.equipmentChoice;
  if (choices.spellcastingAbility) result.spellcastingAbility = choices.spellcastingAbility;

  return result;
}

/**
 * Validate ability score selection based on increment pattern
 */
export function validateAbilitySelection(
  selectedScores: AbilityName[],
  pattern: AbilityIncrementPattern | null
): { valid: boolean; message?: string } {
  if (pattern === '2_1') {
    if (selectedScores.length < 2) {
      return { valid: false, message: 'Select 2 ability scores for +2/+1 pattern' };
    }
    // Check for duplicates
    const unique = new Set(selectedScores);
    if (unique.size !== selectedScores.length) {
      return { valid: false, message: 'Each ability score can only be selected once' };
    }
  } else if (pattern === '1_1_1') {
    if (selectedScores.length < 3) {
      return { valid: false, message: 'Select 3 ability scores for +1/+1/+1 pattern' };
    }
    const unique = new Set(selectedScores);
    if (unique.size !== selectedScores.length) {
      return { valid: false, message: 'Each ability score can only be selected once' };
    }
  }

  return { valid: true };
}