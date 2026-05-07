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
export declare function deriveProficiencyBonus(level: number): number;
export declare function deriveAbilityScores(baseScores: Partial<Record<AbilityName, number>>, bonuses?: Partial<Record<AbilityName, number>>): AbilityScores;
export declare function deriveAbilityModifier(score: number): number;
export declare function deriveSpellcastingMetrics(ability: AbilityName | string, abilityScores: Partial<Record<AbilityName, number>>, proficiencyBonus: number): SpellcastingMetrics;
export declare function deriveLevelOneMaxHp(hitDie: number, constitutionScore: number): number;
export declare function deriveMaxHp(level: number, hitDie: number, constitutionModifier: number): number;
export declare function calculateFixedHpGain(hitDie: number, constitutionModifier: number): number;
export declare function calculateMaxHpGain(hitDie: number, constitutionModifier: number): number;
export declare function deriveSavingThrowBonus(abilityScore: number, proficient: boolean, proficiencyBonus: number): number;
export declare function signed(value: number): string;
//# sourceMappingURL=character-engine.d.ts.map