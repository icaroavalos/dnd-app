export interface InventoryItem {
    id: string;
    name: string;
    kind: string;
    quantity: number;
    weight?: number;
    valueGp?: number;
    typeLabel?: string;
    gp?: number;
}
export interface Encumbrance {
    carryingCapacity: number;
    encumbered: boolean;
}
export declare function renderInventorySheet(inventory: InventoryItem[], activeModifiers: any[], encumbrance: Encumbrance | undefined, equippedItems: string[], isEquipableItem: (item: InventoryItem) => boolean, itemTags: (item: InventoryItem) => string[]): string;
//# sourceMappingURL=inventory-view.d.ts.map