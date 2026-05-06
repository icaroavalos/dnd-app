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
        name: `Magic Initiate (${grant.spellList})`,
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
    if (!bgDetails?.entries)
        return [];
    const granted = [];
    for (const entry of bgDetails.entries) {
        const entryStr = JSON.stringify(entry);
        if (entryStr.toLowerCase().includes('magic initiate')) {
            // Determina a lista de magias baseada no texto
            let spellList = 'cleric';
            if (entryStr.toLowerCase().includes('wizard'))
                spellList = 'wizard';
            else if (entryStr.toLowerCase().includes('druid'))
                spellList = 'druid';
            else if (entryStr.toLowerCase().includes('bard'))
                spellList = 'bard';
            else if (entryStr.toLowerCase().includes('sorcerer'))
                spellList = 'sorcerer';
            else if (entryStr.toLowerCase().includes('warlock'))
                spellList = 'warlock';
            else if (entryStr.toLowerCase().includes('paladin'))
                spellList = 'paladin';
            else if (entryStr.toLowerCase().includes('ranger'))
                spellList = 'ranger';
            granted.push({
                type: 'magic_initiate',
                spellList,
                cantrips: 2,
                level1Spells: 1,
            });
        }
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
//# sourceMappingURL=magic-initiate-validator.js.map