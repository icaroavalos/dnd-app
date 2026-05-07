export function deriveActiveModifiers(character) {
    return [
        ...deriveInventoryModifiers(character),
        ...deriveConditionModifiers(character),
    ];
}
export function deriveInventoryModifiers(character) {
    const inventory = character?.inventory ?? [];
    const equippedIds = new Set(character?.equippedItems ?? []);
    return inventory.flatMap((item) => {
        const active = isItemActive(item, equippedIds);
        if (!active)
            return [];
        return [
            ...explicitItemModifiers(item),
            ...inferredItemModifiers(item),
        ];
    });
}
export function modifierTotal(modifiers, target) {
    return (modifiers ?? [])
        .filter((modifier) => modifier.target === target)
        .reduce((total, modifier) => total + numericValue(modifier.value), 0);
}
export function deriveCarriedWeight(character) {
    return (character?.inventory ?? []).reduce((total, item) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        return total + numericValue(item.weight) * quantity;
    }, 0);
}
function deriveConditionModifiers(character) {
    const conditions = character?.state?.active_conditions ?? character?.activeConditions ?? [];
    return conditions.flatMap((condition) => explicitConditionModifiers(condition));
}
function explicitItemModifiers(item) {
    const raw = Array.isArray(item.modifiers) ? item.modifiers : item.modifier ? [item.modifier] : [];
    return raw.flatMap((modifier, index) => normalizeModifier(modifier, {
        id: `${item.id ?? item.instance_id ?? item.name}:modifier:${index}`,
        sourceId: item.id ?? item.instance_id,
        sourceName: item.name ?? item.custom_name ?? item.base_item_id,
        sourceType: 'item',
    }));
}
function explicitConditionModifiers(condition) {
    const raw = Array.isArray(condition.modifiers) ? condition.modifiers : condition.modifier ? [condition.modifier] : [];
    return raw.flatMap((modifier, index) => normalizeModifier(modifier, {
        id: `${condition.condition_id ?? condition.id ?? 'condition'}:modifier:${index}`,
        sourceId: condition.condition_id ?? condition.id,
        sourceName: condition.name ?? condition.condition_id ?? condition.id,
        sourceType: 'condition',
    }));
}
function inferredItemModifiers(item) {
    const modifiers = [];
    const name = String(item.name ?? item.custom_name ?? item.base_item_id ?? '');
    const itemId = item.id ?? item.instance_id ?? item.name ?? 'item';
    const itemName = item.name ?? item.custom_name ?? item.base_item_id ?? 'Item';
    if (isShield(item)) {
        modifiers.push({
            id: `${itemId}:shield-ac`,
            sourceId: itemId,
            sourceName: itemName,
            sourceType: 'item',
            target: 'armor_class',
            value: Number(item.ac) || 0,
            type: 'bonus',
        });
    }
    if (/ring of protection/i.test(name)) {
        modifiers.push({
            id: `${itemId}:ring-protection-ac`,
            sourceId: itemId,
            sourceName: itemName,
            sourceType: 'item',
            target: 'armor_class',
            value: 1,
            type: 'bonus',
        }, {
            id: `${itemId}:ring-protection-saves`,
            sourceId: itemId,
            sourceName: itemName,
            sourceType: 'item',
            target: 'saving_throws',
            value: 1,
            type: 'bonus',
        });
    }
    return modifiers.filter((modifier) => Number.isFinite(Number(modifier.value)) && Number(modifier.value) !== 0);
}
function normalizeModifier(modifier, defaults) {
    if (!modifier || typeof modifier !== 'object')
        return [];
    const record = modifier;
    if (record.target && record.value != null) {
        return [{
                ...defaults,
                target: normalizeTarget(record.target),
                value: Number(record.value) || 0,
                type: typeof record.type === 'string' ? record.type : 'bonus',
                condition: record.condition,
            }];
    }
    return Object.entries(record)
        .filter(([, value]) => typeof value === 'number')
        .map(([target, value]) => ({
        ...defaults,
        target: normalizeTarget(target),
        value: Number(value) || 0,
        type: 'bonus',
    }));
}
function normalizeTarget(target) {
    const value = String(target).toLowerCase();
    const aliases = {
        ac: 'armor_class',
        armorclass: 'armor_class',
        armor_class: 'armor_class',
        savingthrows: 'saving_throws',
        saving_throws: 'saving_throws',
        saves: 'saving_throws',
    };
    return aliases[value] ?? value;
}
function isItemActive(item, equippedIds) {
    const itemId = item.id ?? '';
    const instanceId = item.instance_id ?? '';
    const status = String(item.status ?? '').toLowerCase();
    if (equippedIds.has(itemId) || equippedIds.has(instanceId))
        return true;
    if (status === 'attuned')
        return true;
    if (status.startsWith('equipped'))
        return true;
    return false;
}
function isShield(item) {
    return String(item.type ?? '').startsWith('S');
}
function numericValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}
//# sourceMappingURL=modifier-engine.js.map