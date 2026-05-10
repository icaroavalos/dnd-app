/**
 * @deprecated Use backend projection via `projectCharacter()` from `../../lib/api-character-project-client.js`
 * quando o slice backend estiver estável.
 *
 * Backend: POST /characters/project
 * Frontend client: src/lib/api-character-project-client.ts
 * Migration guide: docs/migration-review.md
 */
import type { AbilityName } from '../../types/background';
export interface AbilityScores {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}
export interface SpellcastingMetrics {
    ability: AbilityName;
    score: number;
    modifier: number;
    attackBonus: number;
    saveDc: number;
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function deriveProficiencyBonus(level: number): number;
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function deriveAbilityScores(baseScores: Partial<Record<AbilityName, number>>, bonuses?: Partial<Record<AbilityName, number>>): AbilityScores;
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function deriveAbilityModifier(score: number): number;
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function deriveSpellcastingMetrics(ability: AbilityName | string, abilityScores: Partial<Record<AbilityName, number>>, proficiencyBonus: number): SpellcastingMetrics;
export declare function deriveLevelOneMaxHp(hitDie: number, constitutionScore: number): number;
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function deriveMaxHp(level: number, hitDie: number, constitutionModifier: number): number;
export declare function calculateFixedHpGain(hitDie: number, constitutionModifier: number): number;
export declare function calculateMaxHpGain(hitDie: number, constitutionModifier: number): number;
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function deriveSavingThrowBonus(abilityScore: number, proficient: boolean, proficiencyBonus: number): number;
export declare function signed(value: number): string;
/**
 * Verifica se as regras foram carregadas
 */
export declare function hasLoadedRulesCore(api: any): boolean;
/**
 * Obtém a linha do nível atual
 */
export declare function getCurrentLevelRow(levels: Record<string, any[]>, className: string, level: number): any | undefined;
/**
 * Obtém o rule de class skill
 */
export declare function getClassSkillRule(className: string, api_classes: Record<string, any>, skills: Array<[string, string]>): {
    choose: number;
    options: string[];
};
/**
 * Obtém as skill proficiencies de um background
 */
export declare function getBackgroundSkillProficiencies(backgroundName: string, backgroundDetails: Record<string, any>, skills: Array<[string, string]>): string[];
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function optionNames(choice: any): string[];
/**
 * Default saving throws por classe
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function getDefaultSaves(className: string): string[];
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function isStandardArrayPermutation(abilities: Record<string, number>, standardArray: number[]): boolean;
/**
 * Normaliza nome de skill a partir de slug
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function skillNameFromSlug(value: string, skills: Array<[string, string]>): string;
/**
 * Verifica se subrace existe para uma race
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export interface SubraceData {
    name: string;
    subraces?: any[];
}
export declare function getSubracesFor(raceName: string, races: Record<string, SubraceData>): string[];
export declare function getDefaultSubrace(raceName: string, races: Record<string, SubraceData>): string;
/**
 * Calcula bônus de cantrip de class features
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export declare function getClassFeatureCantripBonus(className: string, classFeatureChoices: Record<string, string>): number;
//# sourceMappingURL=character-engine.d.ts.map