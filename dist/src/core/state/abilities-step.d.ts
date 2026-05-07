/**
 * Abilities Step - View model and logic for the Atributos step of the builder.
 *
 * Provides a pure-function view model so app.js only needs to call
 * `buildAbilitiesViewModel(...)` and render the result.
 */
import type { AbilityName } from '../../types/background.js';
import type { Character } from '../../types/state.js';
import { type AbilityBonusMap } from '../character/ability-bonuses.js';
export type AbilityMethodId = 'standard' | 'pointBuy' | 'manual';
export declare const ABILITY_KEYS: AbilityName[];
export declare const ABILITY_LABELS: [AbilityName, string][];
export declare const ABILITY_METHODS: [AbilityMethodId, string][];
export declare const STANDARD_ARRAY: readonly [15, 14, 13, 12, 10, 8];
export declare const POINT_BUY_COSTS: Record<number, number>;
export declare const POINT_BUY_BUDGET = 27;
/** Cost of a single ability score in Point Buy. */
export declare function pointBuyCost(score: number): number;
/** Total Point Buy points spent for an abilities map. */
export declare function pointBuySpent(abilities: Partial<Record<AbilityName, number>>): number;
/** Get the bonus for a single ability from background + ASI choices. */
export declare function abilityBonusFromChoices(character: Pick<Character, 'asiChoices' | 'bgChoices'>, key: AbilityName): number;
/** Get all ability bonuses from background + ASI choices. */
export declare function allAbilityBonuses(character: Pick<Character, 'asiChoices' | 'bgChoices'>): AbilityBonusMap;
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
export declare function getClassSavingThrows(characterClass: string, apiClasses: Record<string, any>): AbilityName[];
/**
 * Calculates the total score for an ability including all current bonuses.
 */
export declare function getAbilityScore(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>, key: AbilityName): number;
/**
 * Calculates the modifier for a character's ability score.
 */
export declare function getAbilityModifier(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>, key: AbilityName): number;
/**
 * Calculates an ability score while omitting a specific ASI rule.
 */
export declare function getAbilityScoreBeforeAsiRule(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>, key: AbilityName, ruleId: string): number;
export declare function buildScoreCards(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>): ScoreCardViewModel[];
export interface StandardArrayCardViewModel {
    key: AbilityName;
    label: string;
    score: number;
    modifier: number;
    modifierFormatted: string;
}
export declare function buildStandardArrayCards(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>): StandardArrayCardViewModel[];
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
export declare function buildPointBuyViewModel(abilities: Partial<Record<AbilityName, number>>, bonuses: AbilityBonusMap): PointBuyViewModel;
export declare function adjustPointBuyScore(abilities: Record<AbilityName, number>, key: AbilityName, delta: number): Record<AbilityName, number>;
export declare function trimPointBuyToBudget(abilities: Record<AbilityName, number>): Record<AbilityName, number>;
export declare function applyAbilityMethod(abilities: Partial<Record<AbilityName, number>>, method: AbilityMethodId): Record<AbilityName, number>;
/** Swap two ability scores (used by standard array drag). */
export declare function swapAbilities(abilities: Record<AbilityName, number>, from: AbilityName, to: AbilityName): Record<AbilityName, number>;
//# sourceMappingURL=abilities-step.d.ts.map