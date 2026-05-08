type ActionKind = 'action' | 'bonus' | 'reaction' | 'other' | 'limited' | 'attack';
type EconomyKind = 'action' | 'bonus' | 'reaction' | 'other' | 'free' | 'attack';
export interface ActionCost {
    economy?: EconomyKind | ActionKind;
    resource?: string;
    slotLevel?: number | null;
}
export interface DerivedAction {
    id: string;
    kind: ActionKind;
    icon: string;
    name: string;
    subtitle: string;
    range: string;
    rangeLabel: string;
    hit: string;
    damage: string[];
    notes: string;
    detail: string;
    cost?: ActionCost;
    resource?: string;
    slotLevel?: number | null;
    source?: Record<string, unknown>;
    disabled?: boolean;
}
export interface ResourceDefinition {
    id: string;
    name: string;
    kind?: string;
    className?: string;
    sourceLabel?: string;
    body: string;
    recovery?: Record<string, unknown>;
    actionKind?: ActionKind | null;
}
export interface AttackLike {
    name: string;
    range?: string;
    type?: string;
    damage: string;
    itemId?: string;
}
export interface InventoryItemLike {
    id?: string;
    name?: string;
    entries?: string[];
    type?: string;
}
export interface SpellLike {
    name: string;
    level: number;
    castingTime?: string;
    range?: string;
    components?: string;
    levelLine?: string;
    description?: string;
    castMode?: 'at-will' | 'slots' | 'resource';
    resourceId?: string;
}
export interface ActionEngineCharacter {
    class?: string;
    attacks?: AttackLike[];
    inventory?: InventoryItemLike[];
    spells?: string[];
    spellEntries?: SpellLike[];
    resources?: Record<string, {
        used?: number;
        max?: number;
    }>;
    spellSlots?: Record<string | number, {
        used?: number;
        max?: number;
    }>;
}
export interface ActionProjection {
    abilityModifiers?: Record<string, number>;
    proficiencyBonus?: number;
    spellSaveDc?: number | string;
    spellAttack?: number;
}
export interface ActionEngineContext {
    character?: ActionEngineCharacter;
    projection?: ActionProjection;
    resourceDefinitions?: ResourceDefinition[];
    spellDetails?: Record<string, SpellLike>;
    loadedSpellDetails?: Record<string, SpellLike>;
    compactRange: (range?: string) => string;
    rangeLabel: (range?: string) => string;
    signed: (value: number) => string;
    slugify: (value: string) => string;
    itemTypeLabel: (item: InventoryItemLike) => string;
    itemTags: (item: InventoryItemLike) => string[];
    entriesToText: (entries?: string[]) => string;
    resourceRecoveryLabel: (recovery?: Record<string, unknown>) => string;
}
export declare function deriveAvailableActions(context: ActionEngineContext): DerivedAction[];
export declare function isActionDisabled(action: Pick<DerivedAction, 'resource' | 'slotLevel'>, context: ActionEngineContext): boolean;
export declare function actionIconForKind(kind: ActionKind | string): string;
export {};
//# sourceMappingURL=action-engine.d.ts.map