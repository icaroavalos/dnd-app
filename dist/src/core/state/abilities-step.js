/**
 * Abilities Step - View model and logic for the Atributos step of the builder.
 *
 * Provides a pure-function view model so app.js only needs to call
 * `buildAbilitiesViewModel(...)` and render the result.
 */
import { calculateCharacterAbilityBonuses } from '../character/ability-bonuses.js';
import { deriveAbilityModifier, deriveAbilityScores, signed } from '../character/character-engine.js';
export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const ABILITY_LABELS = [
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma'],
];
export const ABILITY_METHODS = [
    ['standard', 'Standard Array'],
    ['manual', 'Manual/Rolled'],
    ['pointBuy', 'Point Buy'],
];
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_COSTS = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};
export const POINT_BUY_BUDGET = 27;
// ============================================================================
// Pure Helpers
// ============================================================================
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/** Cost of a single ability score in Point Buy. */
export function pointBuyCost(score) {
    return POINT_BUY_COSTS[clamp(Number(score) || 8, 8, 15)] ?? 0;
}
/** Total Point Buy points spent for an abilities map. */
export function pointBuySpent(abilities) {
    return ABILITY_KEYS.reduce((total, key) => total + pointBuyCost(abilities[key] ?? 8), 0);
}
/** Get the bonus for a single ability from background + ASI choices. */
export function abilityBonusFromChoices(character, key) {
    const bonuses = calculateCharacterAbilityBonuses(character);
    return bonuses[key];
}
/** Get all ability bonuses from background + ASI choices. */
export function allAbilityBonuses(character) {
    return calculateCharacterAbilityBonuses(character);
}
/**
 * Gets the saving throw proficiencies for a specific class from API data.
 */
export function getClassSavingThrows(characterClass, apiClasses) {
    const apiSaves = apiClasses[characterClass]?.saving_throws;
    if (Array.isArray(apiSaves) && apiSaves.length) {
        return apiSaves.map((save) => (save.index || save)).filter(Boolean);
    }
    return [];
}
/**
 * Calculates the total score for an ability including all current bonuses.
 */
export function getAbilityScore(character, key) {
    const bonuses = calculateCharacterAbilityBonuses(character);
    const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
    return scores[key];
}
/**
 * Calculates the modifier for a character's ability score.
 */
export function getAbilityModifier(character, key) {
    return deriveAbilityModifier(getAbilityScore(character, key));
}
/**
 * Calculates an ability score while omitting a specific ASI rule.
 */
export function getAbilityScoreBeforeAsiRule(character, key, ruleId) {
    const bonuses = calculateCharacterAbilityBonuses(character, { omitAsiRuleId: ruleId });
    const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
    return scores[key];
}
export function buildScoreCards(character) {
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
export function buildStandardArrayCards(character) {
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
export function buildPointBuyViewModel(abilities, bonuses) {
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
// ============================================================================
// Point Buy Mutations (pure — return new abilities map)
// ============================================================================
export function adjustPointBuyScore(abilities, key, delta) {
    const current = Number(abilities[key]) || 8;
    const next = clamp(current + delta, 8, 15);
    if (next === current)
        return abilities;
    const spent = pointBuySpent(abilities);
    if (delta > 0 && spent + pointBuyCost(next) - pointBuyCost(current) > POINT_BUY_BUDGET) {
        return abilities;
    }
    return { ...abilities, [key]: next };
}
export function trimPointBuyToBudget(abilities) {
    const result = { ...abilities };
    let spent = pointBuySpent(result);
    while (spent > POINT_BUY_BUDGET) {
        const highest = ABILITY_KEYS
            .filter((key) => result[key] > 8)
            .sort((a, b) => result[b] - result[a])[0];
        if (!highest)
            break;
        result[highest] -= 1;
        spent = pointBuySpent(result);
    }
    return result;
}
export function applyAbilityMethod(abilities, method) {
    if (method === 'standard') {
        return Object.fromEntries(ABILITY_KEYS.map((key, index) => [key, STANDARD_ARRAY[index]]));
    }
    if (method === 'pointBuy') {
        const clamped = Object.fromEntries(ABILITY_KEYS.map((key) => [key, clamp(Number(abilities[key]) || 8, 8, 15)]));
        return trimPointBuyToBudget(clamped);
    }
    // manual — keep current values as-is
    return Object.fromEntries(ABILITY_KEYS.map((key) => [key, Number(abilities[key]) || 10]));
}
/** Swap two ability scores (used by standard array drag). */
export function swapAbilities(abilities, from, to) {
    if (from === to)
        return abilities;
    return {
        ...abilities,
        [from]: abilities[to],
        [to]: abilities[from],
    };
}
//# sourceMappingURL=abilities-step.js.map