export interface DerivedModifier {
    id: string;
    sourceId?: string;
    sourceName?: string;
    sourceType: 'item' | 'condition';
    target: string;
    value: number;
    type: string;
    condition?: unknown;
}
export interface InventoryLikeItem {
    id?: string;
    instance_id?: string;
    name?: string;
    custom_name?: string;
    base_item_id?: string;
    status?: string;
    type?: string;
    ac?: number | string;
    weight?: number | string;
    quantity?: number | string;
    modifier?: unknown;
    modifiers?: unknown[];
}
export interface ConditionLike {
    id?: string;
    condition_id?: string;
    name?: string;
    modifier?: unknown;
    modifiers?: unknown[];
}
export interface ModifierCharacterLike {
    inventory?: InventoryLikeItem[];
    equippedItems?: string[];
    activeConditions?: ConditionLike[];
    state?: {
        active_conditions?: ConditionLike[];
    };
}
export declare function deriveActiveModifiers(character: ModifierCharacterLike | null | undefined): DerivedModifier[];
export declare function deriveInventoryModifiers(character: ModifierCharacterLike | null | undefined): DerivedModifier[];
export declare function modifierTotal(modifiers: DerivedModifier[] | null | undefined, target: string): number;
export declare function deriveCarriedWeight(character: ModifierCharacterLike | null | undefined): number;
//# sourceMappingURL=modifier-engine.d.ts.map