export function resolveAmmoGroup(item) {
    const propertyCodes = new Set((item.property ?? []).map((value) => String(value).split('|')[0]));
    if (!propertyCodes.has('A')) {
        return null;
    }
    const slug = slugify(item.name);
    if (slug.includes('crossbow')) {
        return {
            acceptedBaseItemIds: ['bolt', 'bolts-20'],
            preferredBaseItemId: 'bolts-20'
        };
    }
    if (slug === 'sling') {
        return {
            acceptedBaseItemIds: ['sling-bullet', 'sling-bullets-20'],
            preferredBaseItemId: 'sling-bullets-20'
        };
    }
    if (slug.includes('bow')) {
        return {
            acceptedBaseItemIds: ['arrow', 'arrows-20'],
            preferredBaseItemId: 'arrows-20'
        };
    }
    return null;
}
export function countAmmoInInventory(inventory, ammoGroup) {
    return inventory
        .filter((inventoryItem) => ammoGroup.acceptedBaseItemIds.includes(slugify(inventoryItem.baseItemId)))
        .reduce((sum, inventoryItem) => sum + normalizeInventoryQuantity(inventoryItem.quantity), 0);
}
export function normalizeInventoryQuantity(quantity) {
    return Math.max(0, Math.floor(quantity ?? 1));
}
export function slugify(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
//# sourceMappingURL=ammo-rules.js.map