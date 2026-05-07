const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
function emptyAbilityBonuses() {
    return {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0,
    };
}
function isAbilityName(value) {
    return typeof value === 'string' && ABILITY_KEYS.includes(value);
}
export function calculateBackgroundAbilityBonuses(bgChoices) {
    const result = emptyAbilityBonuses();
    if (!bgChoices?.abilityIncrement || !Array.isArray(bgChoices.abilityScores)) {
        return result;
    }
    const scores = bgChoices.abilityScores.filter(isAbilityName);
    if (bgChoices.abilityIncrement === '2_1' && scores.length >= 1) {
        result[scores[0]] += 2;
        if (scores.length >= 2)
            result[scores[1]] += 1;
    }
    if (bgChoices.abilityIncrement === '1_1_1' && scores.length >= 1) {
        scores.slice(0, 3).forEach((score) => {
            result[score] += 1;
        });
    }
    return result;
}
export function calculateAsiAbilityBonuses(asiChoices, omitRuleId) {
    const result = emptyAbilityBonuses();
    Object.entries(asiChoices ?? {}).forEach(([ruleId, rawChoice]) => {
        if (ruleId === omitRuleId)
            return;
        if (!rawChoice || typeof rawChoice !== 'object')
            return;
        const choice = rawChoice;
        if (choice.mode !== 'asi')
            return;
        if (choice.pattern === 'plus2' && isAbilityName(choice.ability1)) {
            result[choice.ability1] += 2;
            return;
        }
        if (choice.pattern === 'plus1plus1') {
            if (isAbilityName(choice.ability1))
                result[choice.ability1] += 1;
            if (isAbilityName(choice.ability2))
                result[choice.ability2] += 1;
        }
    });
    return result;
}
export function calculateCharacterAbilityBonuses(character, options = {}) {
    const background = calculateBackgroundAbilityBonuses(character.bgChoices);
    const asi = calculateAsiAbilityBonuses(character.asiChoices, options.omitAsiRuleId);
    return {
        str: background.str + asi.str,
        dex: background.dex + asi.dex,
        con: background.con + asi.con,
        int: background.int + asi.int,
        wis: background.wis + asi.wis,
        cha: background.cha + asi.cha,
    };
}
//# sourceMappingURL=ability-bonuses.js.map