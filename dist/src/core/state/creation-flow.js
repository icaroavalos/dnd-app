export const CREATION_STEPS = [
    ['lineage', 'Origem'],
    ['background', 'Background'],
    ['abilities', 'Atributos'],
    ['choices', 'Escolhas'],
    ['leveling', 'Niveis'],
];
const ABILITY_LABELS = [
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma'],
];
export function validateCreationStep(step, state) {
    const missing = getMissingChoicesForStep(step, state);
    return {
        valid: missing.length === 0,
        missing,
        message: missing.length ? `Ainda falta: ${missing.join(', ')}.` : '',
    };
}
export function getMissingChoicesForStep(step, state) {
    if (step === 'lineage') {
        const missing = [];
        if (!state.character.name?.trim())
            missing.push('nome da ficha');
        if (!state.character.class)
            missing.push('classe');
        if (!state.character.race)
            missing.push('raca/especie');
        if (state.subraceRequired && !state.character.subrace)
            missing.push('subraca/linhagem');
        return missing;
    }
    if (step === 'background') {
        if (!state.character.background)
            return ['background'];
        // For non-guided backgrounds we don't have bgChoices UI fully built yet, 
        // so we shouldn't block the UI to continue
        const isGuidedBackground = ["Acolyte", "Soldier"].includes(state.character.background);
        if (!isGuidedBackground) {
            // Temporarily allow 5etools backgrounds to continue even if incomplete
            // because we haven't built the UI for all of their complex rules yet
            return [];
        }
        if (state.backgroundStepMissing && state.backgroundStepMissing.length > 0)
            return state.backgroundStepMissing;
        return [];
    }
    if (step === 'abilities') {
        const missing = ABILITY_LABELS
            .filter(([key]) => !Number.isFinite(Number(state.character.abilities?.[key])))
            .map(([, label]) => label);
        if ((state.character.abilityMethod ?? 'standard') === 'pointBuy' && state.pointBuySpent !== state.pointBuyBudget) {
            missing.push(`${state.pointBuyBudget - state.pointBuySpent} pontos de Point Buy`);
        }
        return missing;
    }
    if (step === 'choices')
        return getMissingCreationChoices(state);
    if (step === 'leveling')
        return [...state.missingLevelUpChoices, ...getMissingCreationChoices(state), ...getMissingSpellChoices(state)];
    return [];
}
export function getMissingCreationChoices(state) {
    if (!state.levelUpMode && state.creationChoicesLocked)
        return [];
    const missing = [];
    if (!state.levelUpMode && !state.character.creationComplete && state.classSkillSelectedCount !== state.classSkillRequiredCount) {
        missing.push(`${state.classSkillRequiredCount} skill(s) da classe`);
    }
    state.activeChoiceRules.forEach((rule) => {
        if (!rule.complete)
            missing.push(rule.name);
    });
    if (!state.levelUpMode && !state.character.creationComplete) {
        state.equipmentChoiceNames.forEach((name) => missing.push(name));
    }
    return missing;
}
export function getMissingSpellChoices(state) {
    if (!state.spellChoiceStatus)
        return [];
    const missing = [];
    if (state.spellChoiceStatus.selectedCantrips !== state.spellChoiceStatus.requiredCantrips) {
        missing.push(`${state.spellChoiceStatus.requiredCantrips} cantrip(s)`);
    }
    if (state.spellChoiceStatus.selectedLeveled !== state.spellChoiceStatus.requiredLeveled) {
        missing.push(`${state.spellChoiceStatus.requiredLeveled} magia(s) de nivel 1+`);
    }
    return missing;
}
//# sourceMappingURL=creation-flow.js.map