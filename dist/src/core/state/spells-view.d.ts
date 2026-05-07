export interface SpellItem {
    name: string;
    level: number;
    origin?: string;
}
export declare function renderSpellsSheet(autoLeveledSpells: SpellItem[], knownSpells: any[], casterLevel: number, spellAttack: number, spellSaveDc: number, selectedSpellName: string, backgroundSpells: string[], backgroundAbilityMetrics: {
    attackBonus: number;
    saveDc: number;
} | null, spellSlotsMaxByLevel: Record<number, number>, spellSlotsUsed: Record<number, {
    max: number;
    used: number;
}>, availableSpellSlotsAtLevel: (level: number) => number, spellFromKnownData: (name: string) => any, spellLevelLabel: (level: number) => string, ordinalLabel: (level: number) => string, deckLabels: Record<string, string>, classDecks: Record<string, string>, characterClass: string): string;
//# sourceMappingURL=spells-view.d.ts.map