export function createSheetRenderers({
  getState,
  renderSummarySheet,
  renderSkillsSheet,
  renderAttacksSheet,
  renderInventorySheet,
  renderFeaturesSheet,
  renderSpellsSheet,
  deriveActiveModifiers,
  currentActionItems,
  availableSpellSlotsAtLevel,
  resourceRecoveryLabel,
  isEquipableItem,
  itemTags,
  currentFeatureItems,
  spellcastingMetricsForAbility,
  spellAbility,
  currentSheetSpellEntries,
  resolveSpellDetail,
  spellFromKnownData,
  casterLevel,
  spellSlotsMaxByLevel,
}) {
  function summary() {
    const state = getState();
    if (!state.derived) return '<div class="card"><p>Carregando ficha...</p></div>';
    return renderSummarySheet(state.character, state.derived);
  }

  function skills() {
    const state = getState();
    return renderSkillsSheet(state.character, state.derived);
  }

  async function attacks() {
    const state = getState();
    const actions = await currentActionItems();
    return renderAttacksSheet(
      actions,
      state.actionFilter ?? "all",
      availableSpellSlotsAtLevel,
      state.selectedAction ?? "",
      state.character.resources ?? {},
      resourceRecoveryLabel,
    );
  }

  function inventory() {
    const state = getState();
    return renderInventorySheet(
      state.character.inventory ?? [],
      state.derived?.activeModifiers ?? deriveActiveModifiers(state.character),
      state.derived?.encumbrance,
      state.character.equippedItems ?? [],
      isEquipableItem,
      itemTags,
    );
  }

  function features() {
    const state = getState();
    const featureItems = currentFeatureItems().map((feature) => {
      const resourceState = feature.resource ? state.character.resources?.[feature.resource.id] : null;
      const max = Number(resourceState?.max ?? feature.resource?.max ?? 0);
      const used = Number(resourceState?.used ?? 0);
      const remaining = Math.max(0, max - used);

      return {
        id: feature.id,
        kind: feature.kind,
        name: feature.name,
        meta: feature.meta,
        description: feature.body,
        resource: feature.resource ? {
          id: feature.resource.id,
          remaining,
          max,
          recoveryLabel: resourceRecoveryLabel(feature.resource.recovery),
        } : undefined,
      };
    });

    return renderFeaturesSheet(
      featureItems,
      state.featureFilter ?? "all",
      state.selectedFeature ?? "",
    );
  }

  function spells() {
    const state = getState();
    const globalSpellcasting = spellcastingMetricsForAbility(spellAbility(state.character, state.api), state.character, state.derived);
    const spellEntries = currentSheetSpellEntries();
    const sheetSpells = spellEntries
      .map((spell) => {
        const detail = resolveSpellDetail(spell.name, state.api) ?? spellFromKnownData(spell.name);
        const resourceState = spell.resourceId ? state.character.resources?.[spell.resourceId] : null;
        const maxUses = Number(resourceState?.max ?? (spell.castMode === "resource" ? 1 : 0));
        const used = Number(resourceState?.used ?? 0);
        return {
          ...detail,
          ...spell,
          remainingUses: spell.castMode === "resource" ? Math.max(0, maxUses - used) : undefined,
          maxUses: spell.castMode === "resource" ? maxUses : undefined,
          recoveryLabel: spell.castMode === "resource" ? "Long Rest Resource" : undefined,
        };
      })
      .filter((spell) => spell?.name && Number.isFinite(spell.level));

    return renderSpellsSheet(
      sheetSpells,
      casterLevel(state.character, state.api),
      globalSpellcasting.attackBonus,
      globalSpellcasting.saveDc,
      state.selectedSpell ?? "",
      spellSlotsMaxByLevel(),
      state.character.spellSlots ?? {},
      availableSpellSlotsAtLevel,
      (name) => resolveSpellDetail(name, state.api) ?? spellFromKnownData(name),
    );
  }

  return {
    summary,
    skills,
    attacks,
    spells,
    inventory,
    features,
  };
}
