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
export function normalizeInventoryItem(detail, parsed, quantity, id) {
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
    };
}
//# sourceMappingURL=inventory-engine.js.map