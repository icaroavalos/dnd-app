/**
 * Magic Initiate Debug and Fix
 *
 * Problem: "Ainda falta: Magic Initiate (cleric): 2 cantrips..." appears even after selecting spells.
 *
 * Root cause analysis:
 * 1. state.api.spellDetails might be empty when validation runs
 * 2. Spell names might not match (case sensitivity)
 * 3. bgSpellChoices storage key might be wrong
 *
 * Solution: Add robust debugging and fallbacks.
 */
export interface SpellData {
    name: string;
    level: number;
    school?: string;
}
export interface BackgroundSpellRule {
    id: string;
    name: string;
    cantrips: number;
    level1Spells: number;
}
/**
 * Debug function to check what's in the state
 */
export declare function debugMagicInitiateState(bgSpellChoices: Record<string, string[]> | undefined, spellDetails: Record<string, SpellData> | undefined, rules: BackgroundSpellRule[]): {
    ok: boolean;
    errors: string[];
    debug: {
        bgSpellChoicesKeys: string[];
        spellDetailsCount: number;
        rulesCount: number;
        selectedSpells: Record<string, string[]>;
        spellLevels: Record<string, number | 'missing'>;
    };
};
/**
 * Robust validation that handles edge cases
 */
export declare function validateMagicInitiateRobust(storageKey: string, bgSpellChoices: Record<string, string[]> | undefined, spellDetails: Record<string, SpellData> | undefined, rule: BackgroundSpellRule): string | null;
//# sourceMappingURL=magic-initiate-debug.d.ts.map