/**
 * CORREÇÃO COMPLETA - Magic Initiate Validation Bug
 *
 * PROBLEMA: A mensagem "Ainda falta: Magic Initiate (cleric): 2 cantrips,
 * Magic Initiate (cleric): 1 level 1 spell(s)" aparecia mesmo após o usuário
 * escolher as magias corretamente.
 *
 * CAUSA RAÍZ:
 * 1. spellDetails[s.toLowerCase()] pode retornar undefined se o nome da magia
 *    estiver em formato diferente (ex: "Guidance" vs "guidance")
 * 2. state.api.spellDetails pode estar vazio quando a validação roda
 * 3. Acesso à propriedade .level de undefined resulta em undefined, não 0
 * 4. A comparação undefined === 0 é false, então a magia não é contada
 *
 * SOLUÇÃO: Usar a mesma fonte de dados que o renderBgSpellChoice():
 * - backgroundSpellOptions(spellList) retorna magias da classSpells
 * - Não depende de spellDetails (que pode estar inconsistente)
 * - Usa a lista específica da classe (cleric, wizard, etc.)
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
 * Validação robusta de Magic Initiate
 *
 * SOLUÇÃO: Em vez de usar spellDetails (que pode estar vazio ou inconsistente),
 * usamos a mesma lógica do renderBgSpellChoice: backgroundSpellOptions(spellList)
 * que retorna as magias disponíveis para aquela lista específica.
 */
export function validateMagicInitiateChoices(storageKey, bgSpellChoices, classSpells, rule) {
    const selected = bgSpellChoices?.[storageKey] || [];
    // Obter lista de magias para esta regra (mesma lógica que backgroundSpellOptions)
    const spellList = rule.spellList?.toLowerCase() || '';
    const listSpells = classSpells?.[spellList] ?? [];
    const cantripNames = listSpells.filter((s) => s.level === 0).map((s) => s.name);
    const level1Names = listSpells
        .filter((s) => s.level === 1)
        .map((s) => s.name);
    // Conta as magias selecionadas que estão na lista correta
    const selectedCantrips = selected.filter((s) => cantripNames.includes(s));
    const selectedLevel1 = selected.filter((s) => level1Names.includes(s));
    // Debug (remover em produção)
    console.log(`Magic Initiate (${rule.name}):`);
    console.log(`  Selected: ${selected.join(', ')}`);
    console.log(`  Cantrips: ${selectedCantrips.length}/${rule.cantrips}`);
    console.log(`  Level 1: ${selectedLevel1.length}/${rule.level1Spells}`);
    // Verifica se completou
    if (selectedCantrips.length < rule.cantrips) {
        return `${rule.name}: ${rule.cantrips} cantrip(s)`;
    }
    if (selectedLevel1.length < rule.level1Spells) {
        return `${rule.name}: ${rule.level1Spells} level 1 spell(s)`;
    }
    return null; // Tudo OK!
}
/**
 * Validação completa para todas as regras de background spell
 */
export function validateAllBackgroundSpellChoices(bgSpellChoices, classSpells, rules) {
    const errors = [];
    for (const rule of rules) {
        const error = validateMagicInitiateChoices(`bg-${rule.id}`, bgSpellChoices, classSpells, rule);
        if (error) {
            errors.push(error);
        }
    }
    return errors;
}
//# sourceMappingURL=background-spell-fix.js.map