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
export declare function createEmptyBgChoices(): BackgroundChoiceState;
/**
 * Reset choices when background changes
 */
export declare function resetChoicesForBackground(background: string): Partial<BackgroundChoiceState>;
/**
 * Get the ability modifier for an increment pattern
 * Returns [bonus1, bonus2, bonus3] where bonuses are 2, 1, or 1,1,1 pattern
 */
export declare function getAbilityIncrements(pattern: AbilityIncrementPattern | null, scores: AbilityName[]): Record<AbilityName, number>;
/**
 * Apply background choices to character abilities
 * Returns the bonuses to apply
 */
export declare function calculateBackgroundAbilityBonuses(choices: BackgroundChoiceState): Record<AbilityName, number>;
/**
 * Check if background choices are complete for a given background requirements
 */
export declare function areBackgroundChoicesComplete(choices: BackgroundChoiceState, requirements: {
    abilityScores: number;
    skills: number;
    equipment: boolean;
    magicInitiate: boolean;
}): boolean;
/**
 * Get missing choices for a background
 */
export declare function getMissingBackgroundChoices(choices: BackgroundChoiceState, requirements: {
    abilityScores: number;
    skills: number;
    equipment: boolean;
    magicInitiate: boolean;
}): string[];
/**
 * Serialize choices for storage (removes null values for cleaner save)
 */
export declare function serializeBgChoices(choices: BackgroundChoiceState): Record<string, unknown>;
/**
 * Validate ability score selection based on increment pattern
 */
export declare function validateAbilitySelection(selectedScores: AbilityName[], pattern: AbilityIncrementPattern | null): {
    valid: boolean;
    message?: string;
};
//# sourceMappingURL=background-choices.d.ts.map