export { ALIGNMENT_OPTIONS, DEFAULT_CREATION_BACKGROUNDS } from '../rules/constants.js';
function createDefaultBackgroundChoiceState() {
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
function resetBackgroundSelection(character, backgroundName, backgroundSkillProficiencies) {
    const backgroundSkills = backgroundSkillProficiencies(backgroundName);
    return {
        ...character,
        background: backgroundName,
        classSkillChoices: (character.classSkillChoices ?? []).filter((skill) => !backgroundSkills.includes(skill)),
        equipmentChoices: {},
        inventory: [],
        equippedItems: [],
    };
}
export function updateCreationField(character, path, value, helpers) {
    if (path === 'class') {
        return {
            ...character,
            class: value,
            savingThrows: helpers.defaultSaves(value),
            classSkillChoices: [],
            classFeatureChoices: {},
            asiChoices: {},
            bgSpellChoices: {},
            equipmentChoices: {},
            inventory: [],
            equippedItems: [],
            hp: character.level === 1 ? helpers.maxLevelOneHp(value, character.abilities) : character.hp,
        };
    }
    if (path === 'race') {
        return {
            ...character,
            race: value,
            subrace: helpers.defaultSubrace(value),
        };
    }
    if (path === 'background') {
        return resetBackgroundSelection(character, value, helpers.backgroundSkillProficiencies);
    }
    if (path === 'subrace') {
        return {
            ...character,
            subrace: value,
        };
    }
    return {
        ...character,
        alignment: value,
    };
}
function nextBackgroundChoices(backgroundName, currentChoices) {
    if (currentChoices?.background === backgroundName)
        return currentChoices;
    const base = currentChoices ? { ...currentChoices } : createDefaultBackgroundChoiceState();
    return {
        ...base,
        background: backgroundName || null,
        source: base.source || 'XPHB',
        abilityIncrement: null,
        abilityScores: [],
        skillChoices: [],
        toolChoices: [],
        equipmentChoice: null,
        spellcastingAbility: null,
    };
}
export function applyBackgroundStepSelection(character, backgroundName, backgroundSkillProficiencies = () => []) {
    const withBackground = resetBackgroundSelection(character, backgroundName, backgroundSkillProficiencies);
    return {
        ...withBackground,
        bgChoices: nextBackgroundChoices(backgroundName, character.bgChoices),
    };
}
//# sourceMappingURL=creation-form-controller.js.map