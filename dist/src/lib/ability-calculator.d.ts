/**
 * Ability Score Calculator
 *
 * Funções puras para cálculo de modifiers, point buy, e validações
 */
export interface AbilityScores {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}
/**
 * Point Buy costs por score (2024 rules)
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
export declare const STANDARD_ARRAY: readonly [15, 14, 13, 12, 10, 8];
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
 * Calcula custo point buy para um array de scores
 */
export declare function calculatePointBuyCost(scores: number[]): number;
/**
 * Valida se scores são válidos para point buy
 */
export declare function isValidPointBuy(scores: number[], budget?: number): boolean;
/**
 * Valida se um array de scores é válido (todos entre 8-15)
 */
export declare function isValidAbilityScores(scores: number[]): boolean;
//# sourceMappingURL=ability-calculator.d.ts.map