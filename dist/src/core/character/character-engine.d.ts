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
//# sourceMappingURL=character-engine.d.ts.map