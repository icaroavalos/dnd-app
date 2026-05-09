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
    const inventory = [];
    equipmentChoiceRules().forEach((rule) => {
      const selected = state.character.equipmentChoices?.[rule.id];
      const option = rule.options.find((item) => item.value === selected);
      if (!option) return;
      option.items.forEach((entry, index) => {
        inventory.push(...inventoryItemsFromEntry(entry, `${rule.id}:${selected}:${index}`));
      });
    });
    state.character.inventory = inventory;
    state.character.equippedItems = (state.character.equippedItems ?? []).filter((id) => inventory.some((item) => item.id === id));
  }

  function inventoryItemsFromEntry(entry, idBase) {
    if (entry.value) return [{ id: idBase, name: "Gold", kind: "currency", gp: Math.floor(entry.value / 100), quantity: 1 }];
    if (entry.special) return [{ id: idBase, name: entry.special, kind: "special", quantity: 1 }];
    if (typeof entry.item === "object") return inventoryItemsFromEntry(entry.item, idBase);
    if (!entry.item) return [];
    const parsed = parseItemRef(entry.item);
    const detail = itemDetail(parsed.name, parsed.source);
    return [normalizeInventoryItem(detail, parsed, entry.quantity ?? 1, idBase)];
  }

  function normalizeInventoryItem(detail, parsed, quantity, id) {
    return typedNormalizeInventoryItem(detail, parsed, quantity, id);
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
