/**
 * Character Projection - Deriva o estado completo para exibição (combate, perícias, etc)
 *
 * Esta é a única fonte de verdade para o que é exibido na ficha.
 *
 * Nota: Esta versão usa projeção local. Para usar a backend, importe
 * `projectCharacter` de `../../lib/api-character-project-client.js`
 */
import type { AbilityName } from '../../types/background.js';
import type { Character, DerivedCharacterSheet, AbilityScores } from '../../types/state.js';
export declare function enableBackendProjection(enabled: boolean): void;
export declare function isBackendProjectionEnabled(): boolean;
/**
 * Projeta personagem usando backend se disponível, ou fallback local.
 * Esta é a função principal para projeção da ficha.
 */
export declare function projectCharacterSheet(character: Character, options?: ProjectionOptions): Promise<DerivedCharacterSheet>;
export interface ProjectionOptions {
    skills?: [string, AbilityName][];
    activeModifiers?: any[];
    spellAbility?: AbilityName;
    hitDie?: number;
    apiClasses?: Record<string, any>;
    apiLevels?: Record<string, any[]>;
}
export interface ProjectionHelperOptions {
    derivedSheet?: Partial<DerivedCharacterSheet> | null;
    omitAsiRuleId?: string;
    skills?: [string, AbilityName][];
    slugify?: (value: string) => string;
}
/**
 * Deriva os dados da ficha baseados no estado bruto do personagem
 */
export declare function deriveCharacterSheet(character: Character, options?: ProjectionOptions): DerivedCharacterSheet;
export declare function deriveProjectedAbilityScores(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>): AbilityScores;
export declare function deriveProjectedAbilityScore(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>, ability: AbilityName, options?: {
    omitAsiRuleId?: string;
}): number;
export declare function deriveProjectedAbilityModifier(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>, ability: AbilityName): number;
export declare function deriveProjectedProficiencyBonus(character: Pick<Character, 'level'>, derivedSheet?: Partial<DerivedCharacterSheet> | null): number;
export declare function deriveProjectedSaveBonus(character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices' | 'savingThrows' | 'level'>, ability: AbilityName, options?: ProjectionHelperOptions): number;
export declare function deriveProjectedSkillBonus(character: Pick<Character, 'class' | 'classFeatureChoices' | 'skillProficiencies' | 'abilities' | 'asiChoices' | 'bgChoices' | 'level'>, skillName: string, options?: ProjectionHelperOptions): number;
//# sourceMappingURL=character-projection.d.ts.map