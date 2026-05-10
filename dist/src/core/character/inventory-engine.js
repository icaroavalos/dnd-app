/**
 * Inventory Engine - Lógica para derivação de equipamentos e inventário
 */
export function parseItemRef(ref) {
    const [rawName, rawSource = "xphb"] = String(ref).split("|");
    return { name: titleCase(rawName), source: rawSource.toUpperCase() };
}
export function itemKey(name, source = "XPHB") {
    return `${String(name).toLowerCase()}|${String(source).toLowerCase()}`;
}
export function itemDetail(name, source = "XPHB", api) {
    const details = api.source?.itemDetails;
    if (!details)
        return undefined;
    return details[itemKey(displayItemName(name), source)] ?? details[itemKey(name, source)];
}
function titleCase(value) {
    return String(value)
        .split(/[-\s]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function displayItemName(name) {
    return name; // Placeholder se houver lógica de normalização de nomes
}
export function itemTypeLabel(detail) {
    const type = detail?.type;
    if (!type)
        return "Item";
    const types = {
        "A": "Ammo",
        "AF": "Ammo",
        "G": "Adventuring Gear",
        "GS": "Gaming Set",
        "HA": "Heavy Armor",
        "INS": "Instrument",
        "LA": "Light Armor",
        "M": "Melee Weapon",
        "MA": "Medium Armor",
        "P": "Potion",
        "R": "Ranged Weapon",
        "RD": "Rod",
        "RG": "Ring",
        "S": "Shield",
        "SC": "Scroll",
        "T": "Tool",
        "WD": "Wand"
    };
    return types[type] ?? "Item";
}
export function normalizeInventoryItem(detail, parsed, quantity, id, options) {
    return {
        id: String(id),
        name: detail?.name ?? parsed.name,
        source: detail?.source ?? parsed.source,
        quantity,
        kind: "item",
        type: detail?.type,
        typeLabel: itemTypeLabel(detail),
        weight: detail?.weight ?? 0,
        valueGp: detail?.value ? detail.value / 100 : 0,
        ac: detail?.ac,
        damage: detail?.dmg1,
        damageType: detail?.dmgType,
        property: detail?.property ?? [],
        entries: detail?.entries ?? [],
        origin: options?.origin,
    };
}
/**
 * Consolidate inventory items by merging stacks of the same item (by itemKey).
 * - Sums quantities
 * - Merges entries and properties arrays
 * - Removes items with quantity <= 0
 * - Handles origin merging: if any item is 'manual', result is 'manual'; if mixed choice/manual, result is 'merged'
 */
export function consolidateInventory(inventory) {
    const groups = new Map();
    for (const item of inventory) {
        const key = itemKey(item.name, item.source);
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(item);
    }
    const consolidated = [];
    for (const [key, items] of groups) {
        if (items.length === 0)
            continue;
        const totalQty = items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0);
        if (totalQty <= 0)
            continue;
        const base = { ...items[0] };
        base.quantity = totalQty;
        base.entries = [...new Set(items.flatMap(i => i.entries ?? []))];
        base.property = [...new Set(items.flatMap(i => i.property ?? []))];
        const origins = items.map(i => i.origin).filter(Boolean);
        if (origins.length) {
            const hasManual = origins.includes('manual');
            const hasChoice = origins.includes('choice');
            if (hasManual && hasChoice)
                base.origin = 'merged';
            else if (hasManual && !hasChoice)
                base.origin = 'manual';
            else
                base.origin = origins[0];
        }
        consolidated.push(base);
    }
    return consolidated;
}
/**
 * Remove items with quantity <= 0 from inventory.
 */
export function removeEmptyStacks(inventory) {
    return inventory.filter(item => Number(item.quantity ?? 0) > 0);
}
//# sourceMappingURL=inventory-engine.js.map