/**
 * Ability Score Calculator
 *
 * Funções puras para cálculo de modifiers, point buy, e validações
 */
/**
 * Point Buy costs por score (2024 rules)
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
};
export const POINT_BUY_BUDGET = 27;
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
/**
 * Calcula modifier para um ability score
 * Fórmula: floor((score - 10) / 2)
 */
export function calculateModifier(score) {
    return Math.floor((score - 10) / 2);
}
/**
 * Calcula todos os modifiers
 */
export function calculateAllModifiers(abilities) {
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
 * Calcula custo point buy para um array de scores
 */
export function calculatePointBuyCost(scores) {
    return scores.reduce((total, score) => {
        const cost = POINT_BUY_COSTS[score] ?? 0;
        return total + cost;
    }, 0);
}
/**
 * Valida se scores são válidos para point buy
 */
export function isValidPointBuy(scores, budget = POINT_BUY_BUDGET) {
    const cost = calculatePointBuyCost(scores);
    return cost === budget;
}
/**
 * Valida se um array de scores é válido (todos entre 8-15)
 */
export function isValidAbilityScores(scores) {
    return scores.every(s => s >= 8 && s <= 15);
}
//# sourceMappingURL=ability-calculator.js.map