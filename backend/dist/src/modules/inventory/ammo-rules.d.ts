import type { CharacterRecord } from '@shared/contracts';
interface ItemLike {
    name: string;
    property?: string[];
}
export interface AmmoGroup {
    acceptedBaseItemIds: string[];
    preferredBaseItemId: string;
}
export declare function resolveAmmoGroup(item: ItemLike): AmmoGroup | null;
export declare function countAmmoInInventory(inventory: CharacterRecord['inventory'], ammoGroup: AmmoGroup): number;
export declare function normalizeInventoryQuantity(quantity: number | undefined): number;
export declare function slugify(value: string): string;
export {};
//# sourceMappingURL=ammo-rules.d.ts.map