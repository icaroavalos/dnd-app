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
    type: 'bg_spell_choice';
    spellList: string;
    cantrips: number;
    level1Spells: number;
}
export interface ClassSpell {
    name: string;
    level: number;
    source?: string;
}
export interface SpellcastingAbilityChoice {
    spellcastingAbility?: string | null;
}
export interface SpellcastingMetrics {
    ability: string;
    modifier: number;
    attackBonus: number;
    saveDc: number;
}
import { BackgroundData } from '../types/character';
type BackgroundDetails = Record<string, BackgroundData>;
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
export declare function getBackgroundGrantedSpells(background: string | undefined, backgroundDetails: BackgroundDetails | undefined): BgSpellGrant[];
/**
 * Verifica se todas as escolhas de Magic Initiate foram completadas
 */
export declare function isMagicInitiateComplete(bgSpellChoices: Record<string, string[]> | undefined, classSpells: Record<string, ClassSpell[]> | undefined, rules: BackgroundSpellRule[]): boolean;
export declare function getBackgroundSpellOptions(spellList: string | undefined, classSpells: Record<string, ClassSpell[]> | undefined): ClassSpell[];
export declare function getSelectedBackgroundSpellNames(bgSpellChoices: Record<string, string[]> | undefined, rules: BackgroundSpellRule[]): string[];
export declare function resolveBackgroundSpellcastingAbility(bgChoices: SpellcastingAbilityChoice | null | undefined, rules: BackgroundSpellRule[]): string | null;
export declare function getSpellcastingMetrics(ability: string, abilities: Record<string, number>, proficiencyBonus: number): SpellcastingMetrics;
export {};
//# sourceMappingURL=magic-initiate-validator.d.ts.map