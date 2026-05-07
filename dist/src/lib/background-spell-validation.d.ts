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
import type { BgSpellGrant, BackgroundSpellRule } from '../types/character.js';
/**
 * Extrai granted spells do background (Magic Initiate)
 */
export declare function getBackgroundGrantedSpells(background?: string, backgroundDetails?: Record<string, {
    entries: any[];
}>): BgSpellGrant[];
/**
 * Cria rules para background spell choices
 */
export declare function backgroundSpellChoiceRules(grantedSpells: BgSpellGrant[]): BackgroundSpellRule[];
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
export declare function validateBackgroundSpellChoices(bgSpellChoices: Record<string, string[]> | undefined, classSpells: Record<string, {
    name: string;
    level: number;
}[]> | undefined, rules: BackgroundSpellRule[]): string[];
/**
 * Verifica se uma única regra está completa
 */
export declare function isBackgroundSpellChoiceComplete(storageKey: string, bgSpellChoices: Record<string, string[]>, classSpells: Record<string, {
    name: string;
    level: number;
}[]> | undefined, rule: BackgroundSpellRule): boolean;
//# sourceMappingURL=background-spell-validation.d.ts.map