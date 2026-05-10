export function createResourceHelpers({
  getState,
  currentResourceDefinitions,
  clamp,
  currentActionItems,
  castSpell,
  maxHitPoints,
  resetSpellSlots,
  persist,
  render,
  renderSheet,
  renderRestModal,
  deriveProjectedAbilityModifier,
}) {
  function syncResources() {
    const state = getState();
    state.character.resources ??= {};
    const next = {};
    currentResourceDefinitions().forEach((definition) => {
      const previous = state.character.resources[definition.id] ?? {};
      const max = Number(definition.max) || 0;
      if (max <= 0) return;
      next[definition.id] = {
        name: definition.name,
        max,
        used: clamp(Number(previous.used) || 0, 0, max),
        recovery: definition.recovery,
      };
    });
    state.character.resources = next;
  }

  function useResource(resourceId) {
    const state = getState();
    syncResources();
    const resource = state.character.resources?.[resourceId];
    if (!resource || resource.used >= resource.max) return;
    resource.used += 1;
  }

  async function useAction(actionId) {
    const actions = await currentActionItems();
    const action = actions.find((item) => item.id === actionId);
    if (!action || action.disabled) return;
    if (action.slotLevel) {
      castSpell(action.slotLevel);
      return;
    }
    if (action.resource) useResource(action.resource);
  }

  function recoverShortRestResources() {
    const state = getState();
    Object.entries(state.character.resources ?? {}).forEach(([resourceId, resource]) => {
      const recovery = resource.recovery?.short;
      if (!recovery) return;
      if (resourceId === "secondWind") {
        resource.used = Math.max(0, resource.used - 1);
        return;
      }
      if (recovery === "all") {
        resource.used = 0;
        return;
      }
      resource.used = Math.max(0, resource.used - Number(recovery || 0));
    });
  }

  function recoverLongRestResources() {
    const state = getState();
    Object.values(state.character.resources ?? {}).forEach((resource) => {
      resource.used = 0;
    });
  }

  function applyRest(type) {
    const state = getState();
    state.restModalType = type;
    state.restModalHitDice = {};
    const isLong = type === "long";
    const description = isLong
      ? "Restaura HP ao maximo, recursos, slots e todos os Hit Dice."
      : "Pode gastar Hit Dice e recupera recursos de Short Rest.";
    state.restModalContent = { label: isLong ? "Long Rest" : "Short Rest", description };
    state.restModalOpen = true;
    renderSheet();
  }

  function confirmRest() {
    const state = getState();
    const type = state.restModalType;
    const isLong = type === "long";
    if (isLong) {
      state.character.hp = maxHitPoints();
      state.character.tempHp = 0;
      state.character.hitDiceUsed = 0;
      resetSpellSlots();
      recoverLongRestResources();
    } else {
      applySelectedHitDice();
      resetSpellSlots({ pactOnly: true });
      recoverShortRestResources();
    }
    state.validationMessage = `${isLong ? "Long Rest" : "Short Rest"} aplicado.`;
    state.restModalOpen = false;
    state.restModalContent = null;
    state.restModalHitDice = {};
    persist();
    render();
  }

  function applySelectedHitDice() {
    const state = getState();
    const selected = Object.values(state.restModalHitDice ?? {}).filter((entry) => entry?.value).length;
    if (!selected) return;
    const usable = Math.min(selected, availableHitDice());
    const healing = usable * hitDieHealingAmount();
    state.character.hp = Math.min(maxHitPoints(), (Number(state.character.hp) || 0) + healing);
    state.character.hitDiceUsed = Math.min(Number(state.character.level) || 1, (Number(state.character.hitDiceUsed) || 0) + usable);
  }

  function availableHitDice() {
    const state = getState();
    return Math.max(0, (Number(state.character.level) || 1) - (Number(state.character.hitDiceUsed) || 0));
  }

  function hitDieHealingAmount() {
    const state = getState();
    return Math.max(1, Math.floor((state.api.classes[state.character.class]?.hit_die ?? 8) / 2) + 1 + deriveProjectedAbilityModifier(state.character, "con"));
  }

  function cancelRest() {
    const state = getState();
    state.restModalOpen = false;
    state.restModalContent = null;
    state.restModalType = null;
    state.restModalHitDice = {};
    renderRestModal();
    renderSheet();
  }

  return {
    syncResources,
    useResource,
    useAction,
    recoverShortRestResources,
    applyRest,
    confirmRest,
    availableHitDice,
    cancelRest,
  };
}
