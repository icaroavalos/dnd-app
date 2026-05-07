export const SUPPORTED_GUIDED_BACKGROUNDS = ['Acolyte', 'Soldier'];
const ABILITY_LABELS = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
};
const GUIDED_BACKGROUND_DEFINITIONS = {
    Acolyte: {
        name: 'Acolyte',
        abilityOptions: ['int', 'wis', 'cha'],
        skills: ['Insight', 'Religion'],
        tools: ["Calligrapher's Supplies"],
        equipmentOptionAHint: 'Items based on background',
        equipmentOptionBHint: '50 GP gold',
        showsMagicInitiate: true,
    },
    Soldier: {
        name: 'Soldier',
        abilityOptions: ['str', 'dex', 'con'],
        skills: ['Athletics', 'Intimidation'],
        tools: ['Gaming Set', 'Land Vehicles'],
        equipmentOptionAHint: 'Items based on background',
        equipmentOptionBHint: '50 GP gold',
        showsMagicInitiate: false,
    },
};
export function createGuidedBackgroundChoiceState(background) {
    return {
        background,
        source: 'XPHB',
        abilityIncrement: null,
        abilityScores: [],
        skillChoices: [],
        toolChoices: [],
        equipmentChoice: null,
        spellcastingAbility: null,
    };
}
export function ensureGuidedBackgroundChoiceState(bgChoices, backgroundFallback) {
    const normalizedBackground = normalizeGuidedBackground(bgChoices?.background ?? backgroundFallback);
    return {
        background: normalizedBackground,
        source: bgChoices?.source ?? 'XPHB',
        abilityIncrement: bgChoices?.abilityIncrement ?? null,
        abilityScores: Array.isArray(bgChoices?.abilityScores) ? [...bgChoices.abilityScores] : [],
        skillChoices: Array.isArray(bgChoices?.skillChoices) ? [...bgChoices.skillChoices] : [],
        toolChoices: Array.isArray(bgChoices?.toolChoices) ? [...bgChoices.toolChoices] : [],
        equipmentChoice: bgChoices?.equipmentChoice ?? null,
        spellcastingAbility: bgChoices?.spellcastingAbility ?? null,
    };
}
export function buildGuidedBackgroundViewModel(bgChoices) {
    const backgroundName = normalizeGuidedBackground(bgChoices?.background);
    const background = backgroundName ? GUIDED_BACKGROUND_DEFINITIONS[backgroundName] : null;
    const selectedAbilityCount = Array.isArray(bgChoices?.abilityScores) ? bgChoices.abilityScores.length : 0;
    const maxAbilityChoices = bgChoices?.abilityIncrement === '2_1' ? 2 : bgChoices?.abilityIncrement === '1_1_1' ? 3 : 0;
    const bonuses = calculateGuidedBackgroundAbilityBonuses(bgChoices ?? null);
    return {
        currentBackground: backgroundName,
        options: SUPPORTED_GUIDED_BACKGROUNDS.map((name) => ({
            value: name,
            label: name,
            selected: name === backgroundName,
        })),
        abilityOptions: (background?.abilityOptions ?? []).map((ability) => {
            const selected = Boolean(bgChoices?.abilityScores?.includes(ability));
            const disabled = !bgChoices?.abilityIncrement || (!selected && maxAbilityChoices > 0 && selectedAbilityCount >= maxAbilityChoices);
            return {
                value: ability,
                label: ABILITY_LABELS[ability],
                selected,
                disabled,
                bonus: bonuses[ability] ?? 0,
            };
        }),
        skills: background?.skills ?? [],
        tools: background?.tools ?? [],
        equipmentOptions: [
            {
                value: 'A',
                label: 'Option A',
                hint: background?.equipmentOptionAHint ?? 'Items based on background',
                selected: bgChoices?.equipmentChoice === 'A',
            },
            {
                value: 'B',
                label: 'Option B',
                hint: background?.equipmentOptionBHint ?? '50 GP gold',
                selected: bgChoices?.equipmentChoice === 'B',
            },
        ],
        selectedAbilityCount,
        maxAbilityChoices,
        showsMagicInitiate: Boolean(background?.showsMagicInitiate),
        spellcastingAbility: bgChoices?.spellcastingAbility ?? null,
    };
}
export function applyGuidedBackgroundIncrement(bgChoices, increment) {
    const next = ensureGuidedBackgroundChoiceState(bgChoices);
    const maxChoices = increment === '2_1' ? 2 : 3;
    return {
        ...next,
        abilityIncrement: increment,
        abilityScores: (next.abilityScores ?? []).slice(0, maxChoices),
    };
}
export function toggleGuidedBackgroundAbility(bgChoices, ability, checked) {
    const next = ensureGuidedBackgroundChoiceState(bgChoices);
    const current = [...(next.abilityScores ?? [])];
    const maxChoices = next.abilityIncrement === '2_1' ? 2 : next.abilityIncrement === '1_1_1' ? 3 : 0;
    if (!checked) {
        return {
            ...next,
            abilityScores: current.filter((item) => item !== ability),
        };
    }
    if (current.includes(ability))
        return next;
    if (maxChoices > 0 && current.length >= maxChoices)
        return next;
    return {
        ...next,
        abilityScores: [...current, ability],
    };
}
export function applyGuidedBackgroundEquipmentChoice(bgChoices, equipmentChoice) {
    const next = ensureGuidedBackgroundChoiceState(bgChoices);
    return {
        ...next,
        equipmentChoice,
    };
}
export function applyGuidedBackgroundSpellcastingAbility(bgChoices, spellcastingAbility) {
    const next = ensureGuidedBackgroundChoiceState(bgChoices);
    return {
        ...next,
        spellcastingAbility,
    };
}
export function normalizeGuidedBackground(background) {
    return SUPPORTED_GUIDED_BACKGROUNDS.includes(background)
        ? background
        : null;
}
function calculateGuidedBackgroundAbilityBonuses(bgChoices) {
    const bonuses = {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0,
    };
    if (!bgChoices?.abilityIncrement || !Array.isArray(bgChoices.abilityScores))
        return bonuses;
    const scores = bgChoices.abilityScores.filter((value) => ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(value));
    if (bgChoices.abilityIncrement === '2_1' && scores.length >= 1) {
        bonuses[scores[0]] += 2;
        if (scores.length >= 2)
            bonuses[scores[1]] += 1;
    }
    if (bgChoices.abilityIncrement === '1_1_1' && scores.length >= 1) {
        scores.slice(0, 3).forEach((score) => {
            bonuses[score] += 1;
        });
    }
    return bonuses;
}
//# sourceMappingURL=guided-background-builder.js.map