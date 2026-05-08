export interface SpellSheetItem {
    name: string;
    level: number;
    castMode: 'at-will' | 'slots' | 'resource';
    slotLevel?: number | null;
    resourceId?: string;
    remainingUses?: number;
    maxUses?: number;
    recoveryLabel?: string;
    sourceLabel?: string;
}
export declare function renderSpellsSheet(spells: SpellSheetItem[], casterLevel: number, spellAttack: number, spellSaveDc: number, selectedSpellName: string, spellSlotsMaxByLevel: Record<number, number>, spellSlotsUsed: Record<number, {
    max: number;
    used: number;
}>, availableSpellSlotsAtLevel: (level: number) => number, spellFromKnownData: (name: string) => any): string;
//# sourceMappingURL=spells-view.d.ts.map