/**
 * Inventory Engine - Lógica para derivação de equipamentos e inventário
 */
import type { ApiState } from '../../types/state.js';
export interface InventoryItem {
    id: string;
    name: string;
    source: string;
    quantity: number;
    kind: 'item' | 'currency' | 'special';
    type?: string;
    typeLabel?: string;
    weight: number;
    valueGp: number;
    ac?: number;
    damage?: string;
    damageType?: string;
    property: string[];
    entries: string[];
    /**
     * Origin of this inventory item: 'choice' means derived from equipment choices,
     * 'manual' means user added/modified, 'merged' means combined from multiple sources.
     */
    origin?: 'choice' | 'manual' | 'merged';
}
export declare function parseItemRef(ref: string): {
    name: string;
    source: string;
};
export declare function itemKey(name: string, source?: string): string;
export declare function itemDetail(name: string, source: string | undefined, api: ApiState): import("../../types/character.js").ItemData | undefined;
export declare function itemTypeLabel(detail: any): string;
export interface NormalizeInventoryItemOptions {
    origin?: 'choice' | 'manual' | 'merged';
}
export declare function normalizeInventoryItem(detail: any, parsed: any, quantity: number, id: number | string, options?: NormalizeInventoryItemOptions): InventoryItem;
/**
 * Consolidate inventory items by merging stacks of the same item (by itemKey).
 * - Sums quantities
 * - Merges entries and properties arrays
 * - Removes items with quantity <= 0
 * - Handles origin merging: if any item is 'manual', result is 'manual'; if mixed choice/manual, result is 'merged'
 */
export declare function consolidateInventory(inventory: InventoryItem[]): InventoryItem[];
/**
 * Remove items with quantity <= 0 from inventory.
 */
export declare function removeEmptyStacks(inventory: InventoryItem[]): InventoryItem[];
//# sourceMappingURL=inventory-engine.d.ts.map