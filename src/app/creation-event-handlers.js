/**
 * Creation Event Handlers
 *
 * Manipula eventos de criacao de personagem:
 * - race/species selection
 * - background selection
 * - equipment choices
 * - class selection
 * - ability scores
 *
 * Nao acessa DOM global diretamente - recebe todas as dependencias via injecao.
 */

export function createCreationEventHandlers({
  getState,
  setState,
  persist,
  render,
  renderChrome,
  renderSheet,
  loadClassData,
  loadRaceData,
  normalizeCharacterState,
  setByPath,
  updateCreationField,
  applyAbilityMethod,
  applyBackgroundStepSelection,
  applyGuidedBackgroundIncrement,
  toggleGuidedBackgroundAbility,
  applyGuidedBackgroundEquipmentChoice,
  applyGuidedBackgroundSpellcastingAbility,
  rebuildInventoryFromChoices,
  ensureGuidedBackgroundChoiceState,
  backgroundSkillProficiencies,
  classSkillRule,
  equipmentChoiceRules,
  creationChoicesLocked,
  escapeHtml,
}) {
  /**
   * Bind all creation form events via event delegation.
   *
   * Usa delegacao no form em vez de bind direto em filhos,
   * porque `els.form.innerHTML = html` na renderizacao destroi
   * os elementos antigos e seus listeners.
   */
  function bindCreationEvents(form, els) {
    form.addEventListener('change', handleFormChange);
    form.addEventListener('input', handleFormInput);
    // click delegation: [data-move] + botoes estaticos
    form.addEventListener('click', handleFormClick);
  }

  function handleFormChange(event) {
    const el = event.target;

    if (el.matches('[data-path]')) {
      handlePathInputChange(el);
      return;
    }
    if (el.matches('[data-class-feature-choice]')) {
      handleClassFeatureChoiceChange(el);
      return;
    }
    if (el.matches('[data-asi-mode]')) {
      handleAsiModeChange(el);
      return;
    }
    if (el.matches('[data-equipment-choice]')) {
      handleEquipmentChoiceChange(el);
      return;
    }
    if (el.matches('[data-bg-spell]')) {
      handleBgSpellChange(el);
      return;
    }
    if (el.matches('[data-bg-select]')) {
      handleBgSelectChange(el);
      return;
    }
    if (el.matches('[data-bg-increment]')) {
      handleBgIncrementChange(el);
      return;
    }
    if (el.matches('[data-bg-ability]')) {
      handleBgAbilityChange(el);
      return;
    }
    if (el.matches('[data-bg-equipment]')) {
      handleBgEquipmentChange(el);
      return;
    }
    if (el.matches('[name="spellcasting-ability"]')) {
      handleSpellcastingAbilityChange(el);
      return;
    }
    if (el.matches('[data-list]')) {
      handleListChange(el);
    }
  }

  function handleFormInput(event) {
    const el = event.target;

    if (el.matches('[data-path]')) {
      handlePathInputChange(el);
      return;
    }
    if (el.matches('[data-level-hp-gain]')) {
      handleLevelUpHpGainInput(el);
    }
  }

  function handleFormClick(event) {
    const el = event.target;

    // data-move navigation (closest because button may have nested elements)
    const moveButton = el.closest('[data-move]');
    if (moveButton) {
      event.preventDefault();
      event.stopPropagation();
      handleMoveClick(moveButton);
      return;
    }

    if (el.matches('[data-ability-adjust]')) {
      handleAbilityAdjustClick(el);
      return;
    }
    if (el.matches('[data-hp-preset]')) {
      handleHpPresetClick(el);
      return;
    }
    if (el.matches('[data-cancel-level-up]')) {
      handleCancelLevelUp(el);
      return;
    }
    if (el.matches('[data-apply-level-up]')) {
      handleApplyLevelUp(el);
      return;
    }
    if (el.matches('[data-remove-attack]')) {
      handleRemoveAttackClick(el);
      return;
    }
    if (el.matches('#addAttackButton')) {
      handleAddAttackClick(el);
      return;
    }
    if (el.matches('#suggestAttacksButton')) {
      handleSuggestAttacksClick(el);
    }
  }

  // Handler for data-path inputs
  async function handlePathInputChange(input) {
    const state = getState();
    const path = input.dataset.path;
    const value = input.type === 'number' ? Number(input.value) : input.value;
    const isTypedCreationField = path === 'class' || path === 'race' || path === 'subrace' || path === 'alignment' || path === 'background';

    if (isTypedCreationField) {
      state.character = updateCreationField(state.character, path, String(value), {
        backgroundSkillProficiencies,
        defaultSaves: () => [],
        defaultSubrace: () => '',
        maxLevelOneHp: () => 0,
      });
    } else {
      setByPath(state.character, path, value);
    }

    const needsFullRender = path === 'class' || path === 'race' || path === 'subrace' || path === 'alignment' || path === 'abilityMethod' || path.startsWith('abilities.') || path.startsWith('asiChoices.');

    if (path === 'class') {
      await loadClassData(String(value));
    }
    if (input.dataset.path.startsWith('abilities.') && state.character.level === 1) {
      // Update HP based on new ability scores
    }
    if (path === 'abilityMethod') {
      applyAbilityMethod(String(value));
    }
    if (path === 'race') {
      await loadRaceData(String(value));
    }
    normalizeCharacterState();
    persist();
    renderChrome();
    if (needsFullRender) render();
    else renderSheet();
  }

  // Handler for ability adjustments
  function handleAbilityAdjustClick(button) {
    const state = getState();
    // Handle ability adjust logic
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for class feature choices
  function handleClassFeatureChoiceChange(input) {
    const state = getState();
    state.character.classFeatureChoices ??= {};
    state.character.classFeatureChoices[input.dataset.classFeatureChoice] = input.value;
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for ASI mode changes
  function handleAsiModeChange(input) {
    const state = getState();
    state.character.asiChoices ??= {};
    const ruleId = input.dataset.asiMode;
    // Update ASI choice
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for equipment choices
  function handleEquipmentChoiceChange(input) {
    const state = getState();
    state.character.equipmentChoices ??= {};
    state.character.equipmentChoices[input.dataset.equipmentChoice] = input.value;
    rebuildInventoryFromChoices();
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for background spell changes
  function handleBgSpellChange(input) {
    const state = getState();
    state.character.bgSpellChoices = state.character.bgSpellChoices || {};
    const key = input.dataset.bgSpell;
    const value = input.value;
    const checked = input.checked;
    if (!state.character.bgSpellChoices[key]) {
      state.character.bgSpellChoices[key] = [];
    }
    if (checked) {
      if (!state.character.bgSpellChoices[key].includes(value)) {
        state.character.bgSpellChoices[key].push(value);
      }
    } else {
      state.character.bgSpellChoices[key] = state.character.bgSpellChoices[key].filter(v => v !== value);
    }
    persist();
    render();
  }

  // Handler for background select
  function handleBgSelectChange(select) {
    const state = getState();
    state.character = applyBackgroundStepSelection(
      state.character,
      select.value,
      backgroundSkillProficiencies
    );
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for background increment
  function handleBgIncrementChange(input) {
    const state = getState();
    state.character.bgChoices = applyGuidedBackgroundIncrement(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      input.value
    );
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for background ability
  function handleBgAbilityChange(input) {
    const state = getState();
    const ability = input.dataset.bgAbility;
    state.character.bgChoices = toggleGuidedBackgroundAbility(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      ability,
      input.checked
    );
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for background equipment
  function handleBgEquipmentChange(input) {
    const state = getState();
    state.character.bgChoices = applyGuidedBackgroundEquipmentChoice(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      input.value
    );
    rebuildInventoryFromChoices();
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for spellcasting ability change
  function handleSpellcastingAbilityChange(input) {
    const state = getState();
    state.character.bgChoices = applyGuidedBackgroundSpellcastingAbility(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      input.value
    );
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for level up HP gain input
  function handleLevelUpHpGainInput(input) {
    const state = getState();
    // Set level up HP gain
    persist();
    render();
  }

  // Handler for HP preset buttons
  function handleHpPresetClick(button) {
    const state = getState();
    // Set HP gain from preset
    persist();
    render();
  }

  // Handler for cancel level up
  function handleCancelLevelUp() {
    const state = getState();
    // Cancel level up operation
    persist();
    render();
  }

  // Handler for apply level up
  function handleApplyLevelUp() {
    const state = getState();
    // Apply level up
    persist();
    render();
  }

  // Handler for list changes
  function handleListChange(input) {
    const state = getState();
    // Update choice list
    normalizeCharacterState();
    persist();
    render();
  }

  // Handler for navigation - navigates between creation steps
  function handleMoveClick(button) {
    const state = getState();
    const targetStepIndex = Number(button.dataset.move);
    const steps = ['lineage', 'background', 'abilities', 'choices', 'leveling'];
    if (targetStepIndex >= 0 && targetStepIndex < steps.length) {
      state.step = steps[targetStepIndex];
      persist();
      render();
    }
  }

  // Handler for remove attack
  function handleRemoveAttackClick(button) {
    const state = getState();
    const attackIndex = Number(button.dataset.removeAttack);
    state.character.attacks.splice(attackIndex, 1);
    persist();
    render();
  }

  // Handler for add attack
  function handleAddAttackClick() {
    const state = getState();
    state.character.attacks.push({ name: 'New', range: '5 feet', type: 'Bludgeoning', damage: '1d4' });
    persist();
    render();
  }

  // Handler for suggest attacks
  function handleSuggestAttacksClick() {
    const state = getState();
    // Suggest attacks based on class
    persist();
    render();
  }

  return {
    bindCreationEvents,
  };
}
