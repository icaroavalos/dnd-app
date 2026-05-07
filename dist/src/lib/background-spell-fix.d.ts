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
import type { BgSpellGrant, BackgroundSpellRule } from '../types/character.js';
/**
 * Extrai granted spells do background (Magic Initiate)
 */
export declare function getBackgroundGrantedSpells(background: string | undefined, backgroundDetails: Record<string, {
    entries: any[];
}> | undefined): BgSpellGrant[];
/**
 * Cria rules para background spell choices
 */
export declare function backgroundSpellChoiceRules(grantedSpells: BgSpellGrant[]): BackgroundSpellRule[];
/**
 * Validação robusta de Magic Initiate
 *
 * SOLUÇÃO: Em vez de usar spellDetails (que pode estar vazio ou inconsistente),
 * usamos a mesma lógica do renderBgSpellChoice: backgroundSpellOptions(spellList)
 * que retorna as magias disponíveis para aquela lista específica.
 */
export declare function validateMagicInitiateChoices(storageKey: string, bgSpellChoices: Record<string, string[]> | undefined, classSpells: Record<string, {
    name: string;
    level: number;
}[]> | undefined, rule: BackgroundSpellRule): string | null;
/**
 * Validação completa para todas as regras de background spell
 */
export declare function validateAllBackgroundSpellChoices(bgSpellChoices: Record<string, string[]> | undefined, classSpells: Record<string, {
    name: string;
    level: number;
}[]> | undefined, rules: BackgroundSpellRule[]): string[];
//# sourceMappingURL=background-spell-fix.d.ts.map