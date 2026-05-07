/**
 * Magic Initiate Validator
 *
 * Validação das escolhas de Magic Initiate (background)
 * Suporte para Acolyte e outros backgrounds que concedem magias
 */
/**
 * Valida as escolhas de Magic Initiate para um background
 *
 * @param bgSpellChoices - Escolhas armazenadas (ex: { 'bg-magic-initiate-cleric-0': ['Guidance', 'Bless'] })
 * @param classSpells - Lista de magias por classe (ex: { cleric: [{name: 'Guidance', level: 0}] })
 * @param rules - Regras do background
 * @returns Array de mensagens de erro ou array vazio se válido
 */
export function validateMagicInitiateChoices(bgSpellChoices, classSpells, rules) {
    const errors = [];
    for (const rule of rules) {
        const storageKey = `bg-${rule.id}`;
        const selected = bgSpellChoices?.[storageKey] || [];
        // Busca lista de magias para esta classe
        const spellListKey = rule.spellList.toLowerCase();
        const spells = classSpells?.[spellListKey] ?? [];
        // Filtra cantrips (level 0) e magias de level 1
        const cantripNames = new Set(spells.filter(s => s.level === 0).map(s => s.name.toLowerCase()));
        const level1Names = new Set(spells.filter(s => s.level === 1).map(s => s.name.toLowerCase()));
        // Conta magias selecionadas válidas (case-insensitive)
        const selectedCantrips = selected.filter(s => cantripNames.has(s.toLowerCase()));
        const selectedLevel1 = selected.filter(s => level1Names.has(s.toLowerCase()));
        if (selectedCantrips.length < rule.cantrips) {
            errors.push(`${rule.name}: ${rule.cantrips} cantrip(s)`);
        }
        if (selectedLevel1.length < rule.level1Spells) {
            errors.push(`${rule.name}: ${rule.level1Spells} level 1 spell(s)`);
        }
    }
    return errors;
}
/**
 * Gera regras de Background Spell Choice a partir dos grants
 */
export function createBackgroundSpellRules(grantedSpells) {
    return grantedSpells.map((grant, idx) => ({
        id: `bg-magic-initiate-${grant.spellList.toLowerCase()}-${idx}`,
        name: `Magic Initiate (${toTitleCase(grant.spellList)})`,
        type: 'bg_spell_choice',
        spellList: grant.spellList,
        cantrips: grant.cantrips,
        level1Spells: grant.level1Spells,
    }));
}
/**
 * Extrai Magic Initiate grants do background
 *
 * @param background - Nome do background (ex: 'Acolyte')
 * @param backgroundDetails - Dados dos backgrounds
 * @returns Lista de grants ou array vazio
 */
export function getBackgroundGrantedSpells(background, backgroundDetails) {
    if (!background)
        return [];
    const bgKey = background.toLowerCase();
    const bgDetails = backgroundDetails?.[bgKey];
    if (!bgDetails)
        return [];
    const granted = [];
    const featRefs = (bgDetails.feats ?? []).flatMap((group) => Object.keys(group));
    for (const featRef of featRefs) {
        const parsed = parseMagicInitiateRef(featRef);
        if (!parsed)
            continue;
        granted.push(parsed);
    }
    if (granted.length > 0)
        return granted;
    for (const entry of bgDetails.entries ?? []) {
        const parsed = parseMagicInitiateRef(JSON.stringify(entry));
        if (!parsed)
            continue;
        granted.push(parsed);
    }
    return granted;
}
/**
 * Verifica se todas as escolhas de Magic Initiate foram completadas
 */
export function isMagicInitiateComplete(bgSpellChoices, classSpells, rules) {
    const errors = validateMagicInitiateChoices(bgSpellChoices, classSpells, rules);
    return errors.length === 0;
}
export function getBackgroundSpellOptions(spellList, classSpells) {
    if (!spellList)
        return [];
    const key = spellList.toLowerCase();
    const options = classSpells?.[key] ?? [];
    return [...options].sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}
export function getSelectedBackgroundSpellNames(bgSpellChoices, rules) {
    const selectedNames = [];
    for (const rule of rules) {
        const storageKey = `bg-${rule.id}`;
        const selected = bgSpellChoices?.[storageKey] ?? [];
        selected.forEach((name) => {
            if (name && !selectedNames.includes(name))
                selectedNames.push(name);
        });
    }
    return selectedNames;
}
export function resolveBackgroundSpellcastingAbility(bgChoices, rules) {
    if (!rules.length)
        return null;
    const chosenAbility = bgChoices?.spellcastingAbility?.toLowerCase();
    if (!chosenAbility)
        return null;
    if (!['int', 'wis', 'cha'].includes(chosenAbility))
        return null;
    return chosenAbility;
}
export function getSpellcastingMetrics(ability, abilities, proficiencyBonus) {
    const normalizedAbility = ability.toLowerCase();
    const score = Number(abilities[normalizedAbility] ?? 10);
    const modifier = Math.floor((score - 10) / 2);
    return {
        ability: normalizedAbility,
        modifier,
        attackBonus: proficiencyBonus + modifier,
        saveDc: 8 + proficiencyBonus + modifier,
    };
}
function parseMagicInitiateRef(text) {
    const normalized = text.toLowerCase();
    if (!normalized.includes('magic initiate'))
        return null;
    const classMatch = normalized.match(/magic initiate;?\s*([a-z]+)/i);
    const spellList = classMatch?.[1]?.toLowerCase() ?? inferSpellListFromText(normalized);
    return {
        type: 'magic_initiate',
        spellList,
        cantrips: 2,
        level1Spells: 1,
    };
}
function inferSpellListFromText(text) {
    const spellLists = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
    return spellLists.find((name) => text.includes(name)) ?? 'cleric';
}
function toTitleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
//# sourceMappingURL=magic-initiate-validator.js.map