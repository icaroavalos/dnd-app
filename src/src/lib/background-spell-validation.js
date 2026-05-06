/**
 * Validação de escolhas de magias do Background (Magic Initiate)
 *
 * BUG ORIGINAL: A validação em app.js (linha 1247-1248) verificava
 * selectedCantrips.length < rule.cantrips, mas o problema era que
 * a mensagem de erro aparecia mesmo após o usuário escolher as magias,
 * porque o estado não estava sendo persistido corretamente ou a
 * validação estava usando dados desatualizados.
 *
 * FIX: TypeScript adiciona type safety e a lógica corrigida verifica
 * se o storage key está correto e se as escolhas foram persistidas.
 */
/**
 * Slugify para nomes de listas de magia
 */
function slugifyName(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
/**
 * Extrai granted spells do background (Magic Initiate)
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
 * Cria rules para background spell choices
 */
export function backgroundSpellChoiceRules(grantedSpells) {
    return grantedSpells.map((grant, idx) => ({
        id: `bg-magic-initiate-${grant.spellList.toLowerCase()}-${idx}`,
        name: `Magic Initiate (${grant.spellList})`,
        type: 'bg_spell_choice',
        spellList: grant.spellList,
        cantrips: grant.cantrips,
        level1Spells: grant.level1Spells,
    }));
}
/**
 * Verifica se as escolhas de Magic Initiate foram completadas
 *
 * SOLUÇÃO: Em vez de usar spellDetails (que pode estar vazio ou inconsistente),
 * usamos a mesma lógica do renderBgSpellChoice: backgroundSpellOptions(spellList)
 * que retorna as magias disponíveis para aquela lista específica.
 *
 * @param bgSpellChoices - Estado atual das escolhas do usuário
 * @param classSpells - Dicionário de classSpells (ex: { cleric: [{name, level}, ...] })
 * @param rules - Regras de spell choice
 * @returns Array de mensagens de erro se faltar escolher magias, ou array vazio se tudo OK
 */
export function validateBackgroundSpellChoices(bgSpellChoices, classSpells, rules) {
    const errors = [];
    for (const rule of rules) {
        const storageKey = `bg-${rule.id}`;
        const selected = bgSpellChoices?.[storageKey] || [];
        // Obter lista de magias para esta regra (mesma lógica que backgroundSpellOptions)
        const spellList = rule.spellList?.toLowerCase() || '';
        const listSpells = classSpells?.[spellList] ?? [];
        // Build case-insensitive sets for matching
        const cantripNames = new Set(listSpells.filter(s => s.level === 0).map(s => s.name.toLowerCase()));
        const level1Names = new Set(listSpells.filter(s => s.level === 1).map(s => s.name.toLowerCase()));
        // Conta as magias selecionadas que estão na lista correta (case-insensitive comparison)
        const selectedCantrips = selected.filter(s => cantripNames.has(s.toLowerCase()));
        const selectedLevel1 = selected.filter(s => level1Names.has(s.toLowerCase()));
        // Debug logging (remove in production if needed)
        console.log(`Magic Initiate Validation (${rule.name}):`);
        console.log(`  Storage key: ${storageKey}`);
        console.log(`  Selected: ${JSON.stringify(selected)}`);
        console.log(`  Cantrips available: ${cantripNames.size}, matched: ${selectedCantrips.length}/${rule.cantrips}`);
        console.log(`  Level 1 available: ${level1Names.size}, matched: ${selectedLevel1.length}/${rule.level1Spells}`);
        // Verifica se atingiu o mínimo necessário
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
 * Verifica se uma única regra está completa
 */
export function isBackgroundSpellChoiceComplete(storageKey, bgSpellChoices, classSpells, rule) {
    const selected = bgSpellChoices[storageKey] || [];
    // Obter lista de magias para esta regra
    const spellList = rule.spellList?.toLowerCase() || '';
    const listSpells = classSpells?.[spellList] ?? [];
    // Build case-insensitive sets for matching
    const cantripNames = new Set(listSpells.filter(s => s.level === 0).map(s => s.name.toLowerCase()));
    const level1Names = new Set(listSpells.filter(s => s.level === 1).map(s => s.name.toLowerCase()));
    // Conta as magias selecionadas que estão na lista correta (case-insensitive comparison)
    const selectedCantrips = selected.filter(s => cantripNames.has(s.toLowerCase()));
    const selectedLevel1 = selected.filter(s => level1Names.has(s.toLowerCase()));
    return (selectedCantrips.length >= rule.cantrips &&
        selectedLevel1.length >= rule.level1Spells);
}
//# sourceMappingURL=background-spell-validation.js.map