export interface ActionItem {
    id: string;
    name: string;
    subtitle: string;
    icon: string;
    range: string;
    rangeLabel: string;
    hit: string;
    damage: string[];
    notes: string;
    kind: string;
    disabled?: boolean;
    detail?: string;
    resource?: string;
    slotLevel?: number;
}
export declare function renderAttacksSheet(actions: ActionItem[], filter: string, availableSpellSlotsAtLevel: (level: number) => number, selectedActionId: string, resources: Record<string, any>, resourceRecoveryLabel: (recovery: string) => string): string;
//# sourceMappingURL=attacks-view.d.ts.map