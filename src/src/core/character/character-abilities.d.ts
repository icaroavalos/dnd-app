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
export declare function calculateModifier(score: number): number;
/**
 * Calcula todos os modifiers
 */
export declare function calculateAllModifiers(abilities: AbilityScores): Record<keyof AbilityScores, number>;
/**
 * Calcula total de um saving throw com proficiência
 */
export declare function calculateSavingThrow(ability: keyof AbilityScores, score: number, isProficient: boolean, proficiencyBonus?: number): number;
/**
 * Point Buy costs por score
 */
export declare const POINT_BUY_COSTS: {
    readonly 8: 0;
    readonly 9: 1;
    readonly 10: 2;
    readonly 11: 3;
    readonly 12: 4;
    readonly 13: 5;
    readonly 14: 7;
    readonly 15: 9;
};
export declare const POINT_BUY_BUDGET = 27;
/**
 * Calcula custo point buy para um array de scores
 */
export declare function calculatePointBuyCost(scores: number[]): number;
/**
 * Valida se scores são válidos para point buy
 */
export declare function isValidPointBuy(scores: number[], budget?: number): boolean;
/**
 * Standard array default
 */
export declare const STANDARD_ARRAY: readonly [15, 14, 13, 12, 10, 8];
/**
 * Valida se um array de scores é válido (todas entre 8-15)
 */
export declare function isValidAbilityScores(scores: number[]): boolean;
/**
 * Soma dos modifiers de um array de scores
 */
export declare function calculateAbilityScoreSum(scores: number[]): number;
//# sourceMappingURL=character-abilities.d.ts.map