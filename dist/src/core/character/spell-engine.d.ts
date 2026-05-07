/**
 * Spell Engine - Lógica para derivação de magias, slots e métricas de conjuração
 */
import type { Character, ApiState } from '../../types/state.js';
export declare function spellcastingMetricsForAbility(ability: string, character: Character, api: ApiState): SpellcastingMetrics;
export interface SpellcastingMetrics {
    ability: string;
    modifier: number;
    attackBonus: number;
    saveDc: number;
}
export interface SpellChoiceStatus {
    cantrips: number;
    spellsMax: number;
    totalMax: number;
    label: string;
    hint: string;
}
export declare function currentLevelRow(character: Character, api: ApiState): any;
export declare function classHasSpellList(className: string, api: ApiState): boolean;
export declare function classSpellAbility(className: string, api: ApiState): string | null;
export declare function backgroundSpellChoiceRules(character: Character, api: ApiState): import("../../lib/magic-initiate-validator.js").BackgroundSpellRule[];
export declare function backgroundSpellAbility(character: Character, api: ApiState): string | null;
export declare function spellAbility(character: Character, api: ApiState): string;
export declare function spellSlotsMaxByLevel(character: Character, api: ApiState): Record<number, number>;
export declare function explicitSpellRefsFromText(text: string): string[];
export declare function autoGrantedSpellEntries(character: Character, api: ApiState, activeFeatures: any[]): any[];
export declare function spellFromKnownData(name: string, api: ApiState): {
    name: string;
    level: number;
};
//# sourceMappingURL=spell-engine.d.ts.map