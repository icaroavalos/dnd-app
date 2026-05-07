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
}
export declare function parseItemRef(ref: string): {
    name: string;
    source: string;
};
export declare function itemKey(name: string, source?: string): string;
export declare function itemDetail(name: string, source: string | undefined, api: ApiState): import("../../types/character.js").ItemData | undefined;
export declare function itemTypeLabel(detail: any): string;
export declare function normalizeInventoryItem(detail: any, parsed: any, quantity: number, id: number | string): InventoryItem;
//# sourceMappingURL=inventory-engine.d.ts.map