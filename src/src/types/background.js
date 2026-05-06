/**
 * Types for Background system - loading from 5etools and character creation
 */
export function getDefaultBackgroundChoice() {
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
export function validateBackgroundChoices(state) {
    const missing = [];
    if (!state.background) {
        missing.push('background');
        return missing;
    }
    if (!state.abilityScores.length) {
        missing.push('ability scores');
    }
    if (!state.equipmentChoice) {
        missing.push('equipment');
    }
    return missing;
}
export function applyBackgroundChoices(choices) {
    if (!choices.background) {
        throw new Error('No background selected');
    }
    return {
        background: choices.background,
        bgChoices: choices,
    };
}
//# sourceMappingURL=background.js.map