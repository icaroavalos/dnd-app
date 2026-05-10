export function createInventoryHelpers({
  getState,
  titleCase,
  entriesToText,
  damageTypeLabel,
  propertyLabel,
  itemDetail: typedItemDetail,
  itemKey: typedItemKey,
  itemTypeLabel: typedItemTypeLabel,
  normalizeInventoryItem: typedNormalizeInventoryItem,
  parseItemRef: typedParseItemRef,
  consolidateInventory: typedConsolidateInventory,
}) {
  function equipmentChoiceRules() {
    const state = getState();
    const rules = [];
    const classEquipment = state.api.classes[state.character.class]?.startingEquipment;
    if (classEquipment?.defaultData?.length) {
      rules.push(equipmentRuleFromData("class-starting-equipment", `${titleCase(state.character.class)} Equipment`, classEquipment));
    }
    const background = state.api.source?.backgroundDetails?.[String(state.character.background).toLowerCase()];
    if (background?.startingEquipment?.length) {
      rules.push(equipmentRuleFromData("background-starting-equipment", `${state.character.background} Equipment`, { defaultData: background.startingEquipment, entries: background.entries }));
    }
    return rules.filter(Boolean);
  }

  function equipmentRuleFromData(id, name, data) {
    const groups = data.defaultData ?? data.startingEquipment ?? [];
    const choices = groups[0] ?? {};
    const options = Object.entries(choices).map(([key, items]) => ({
      value: key,
      label: `Opcao ${key}`,
      hint: summarizeEquipmentItems(items),
      items,
    }));
    if (!options.length) return null;
    return {
      id,
      name,
      summary: entriesToText(data.entries).split("\n")[0] || "Escolha um pacote inicial.",
      options,
    };
  }

  function summarizeEquipmentItems(items) {
    return items.map((item) => {
      if (item.value) return `${Math.floor(item.value / 100)} GP`;
      if (item.special) return item.special;
      if (typeof item.item === "object") return summarizeEquipmentItems([item.item]);
      const parsed = parseItemRef(item.item);
      return `${item.quantity ? `${item.quantity} ` : ""}${parsed.name}`;
    }).join(", ");
  }

  function rebuildInventoryFromChoices() {
    const state = getState();
    const choiceInventory = [];
    equipmentChoiceRules().forEach((rule) => {
      const selected = selectedEquipmentOption(state, rule.id);
      const option = rule.options.find((item) => item.value === selected);
      if (!option) return;
      option.items.forEach((entry, index) => {
        choiceInventory.push(...inventoryItemsFromEntry(entry, `${rule.id}:${selected}:${index}`));
      });
    });

    const currentInventory = state.character.inventory ?? [];
    const manualItems = currentInventory.filter(item => item.origin !== 'choice');

    const itemsToMerge = [...choiceInventory, ...manualItems];

    // Map old item IDs to their itemKey for remapping equippedItems
    const oldIdToKey = new Map();
    itemsToMerge.forEach(item => {
      const key = itemKey(item.name, item.source);
      oldIdToKey.set(item.id, key);
    });

    // Merge and consolidate
    const merged = typedConsolidateInventory(itemsToMerge);
    state.character.inventory = merged;

    // Build mapping from itemKey to new ID
    const keyToNewId = new Map();
    merged.forEach(item => {
      const key = itemKey(item.name, item.source);
      keyToNewId.set(key, item.id);
    });

    // Remap equippedItems to new IDs, dropping those with no matching item
    state.character.equippedItems = (state.character.equippedItems ?? [])
      .map(oldId => {
        const key = oldIdToKey.get(oldId);
        if (!key) return null;
        return keyToNewId.get(key) || null;
      })
      .filter(Boolean);
  }

  function selectedEquipmentOption(state, ruleId) {
    if (ruleId === "background-starting-equipment") {
      return state.character.bgChoices?.equipmentChoice ?? state.character.equipmentChoices?.[ruleId];
    }
    return state.character.equipmentChoices?.[ruleId];
  }

  function inventoryItemsFromEntry(entry, idBase) {
    if (entry.value) return [{ id: idBase, name: "Gold", kind: "currency", gp: Math.floor(entry.value / 100), quantity: 1 }];
    if (entry.special) return [{ id: idBase, name: entry.special, kind: "special", quantity: 1 }];
    if (typeof entry.item === "object") return inventoryItemsFromEntry(entry.item, idBase);
    if (!entry.item) return [];
    const parsed = parseItemRef(entry.item);
    const detail = itemDetail(parsed.name, parsed.source);
    return [normalizeInventoryItem(detail, parsed, entry.quantity ?? 1, idBase, { origin: 'choice' })];
  }

  function normalizeInventoryItem(detail, parsed, quantity, id, options) {
    return typedNormalizeInventoryItem(detail, parsed, quantity, id, options);
  }

  function parseItemRef(ref) {
    return typedParseItemRef(ref);
  }

  function itemDetail(name, source = "XPHB") {
    return typedItemDetail(name, source, getState().api);
  }

  function itemKey(name, source = "XPHB") {
    return typedItemKey(name, source);
  }

  function itemTypeLabel(item) {
    return typedItemTypeLabel(item);
  }

  function itemTags(item) {
    const tags = [];
    if (item.ac) tags.push(`+${item.ac} AC`);
    if (item.damage) tags.push(`${item.damage} ${damageTypeLabel(item.damageType)}`);
    (item.property ?? []).forEach((prop) => tags.push(propertyLabel(prop)));
    return tags.filter(Boolean);
  }

  return {
    equipmentChoiceRules,
    rebuildInventoryFromChoices,
    normalizeInventoryItem,
    parseItemRef,
    itemDetail,
    itemKey,
    itemTypeLabel,
    itemTags,
  };
}
