/**
 * Magic Initiate Validator
 *
 * Validação das escolhas de Magic Initiate (background)
 * Suporte para Acolyte e outros backgrounds que concedem magias
 */
export interface BgSpellGrant {
    type: 'magic_initiate';
    spellList: string;
    cantrips: number;
    level1Spells: number;
}
export interface BackgroundSpellRule {
    id: string;
    name: string;
    spellList: string;
    cantrips: number;
    level1Spells: number;
}
export interface ClassSpell {
    name: string;
    level: number;
}
/**
 * Valida as escolhas de Magic Initiate para um background
 *
 * @param bgSpellChoices - Escolhas armazenadas (ex: { 'bg-magic-initiate-cleric-0': ['Guidance', 'Bless'] })
 * @param classSpells - Lista de magias por classe (ex: { cleric: [{name: 'Guidance', level: 0}] })
 * @param rules - Regras do background
 * @returns Array de mensagens de erro ou array vazio se válido
 */
export declare function validateMagicInitiateChoices(bgSpellChoices: Record<string, string[]> | undefined, classSpells: Record<string, ClassSpell[]> | undefined, rules: BackgroundSpellRule[]): string[];
/**
 * Gera regras de Background Spell Choice a partir dos grants
 */
export declare function createBackgroundSpellRules(grantedSpells: BgSpellGrant[]): BackgroundSpellRule[];
/**
 * Extrai Magic Initiate grants do background
 *
 * @param background - Nome do background (ex: 'Acolyte')
 * @param backgroundDetails - Dados dos backgrounds
 * @returns Lista de grants ou array vazio
 */
export declare function getBackgroundGrantedSpells(background: string | undefined, backgroundDetails: Record<string, {
    entries: any[];
}> | undefined): BgSpellGrant[];
/**
 * Verifica se todas as escolhas de Magic Initiate foram completadas
 */
export declare function isMagicInitiateComplete(bgSpellChoices: Record<string, string[]> | undefined, classSpells: Record<string, ClassSpell[]> | undefined, rules: BackgroundSpellRule[]): boolean;
//# sourceMappingURL=magic-initiate-validator.d.ts.map