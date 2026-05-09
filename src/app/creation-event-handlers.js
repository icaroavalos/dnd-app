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
   * Bind all creation form events
   */
  function bindCreationEvents(form, els) {
    // Bind data-path inputs
    form.querySelectorAll('[data-path]').forEach((input) => {
      input.addEventListener('input', handlePathInputChange.bind(null, input));
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', handlePathInputChange.bind(null, input));
      }
    });

    // Bind ability adjustments
    form.querySelectorAll('[data-ability-adjust]').forEach((button) => {
      button.addEventListener('click', handleAbilityAdjustClick.bind(null, button));
    });

    // Bind class feature choices
    form.querySelectorAll('[data-class-feature-choice]').forEach((input) => {
      input.addEventListener('change', handleClassFeatureChoiceChange.bind(null, input));
    });

    // Bind ASI choices
    form.querySelectorAll('[data-asi-mode]').forEach((input) => {
      input.addEventListener('change', handleAsiModeChange.bind(null, input));
    });

    // Bind equipment choices
    form.querySelectorAll('[data-equipment-choice]').forEach((input) => {
      input.addEventListener('change', handleEquipmentChoiceChange.bind(null, input));
    });

    // Bind background spell choices
    form.querySelectorAll('[data-bg-spell]').forEach((input) => {
      input.addEventListener('change', handleBgSpellChange.bind(null, input));
    });

    // Bind background select
    form.querySelectorAll('[data-bg-select]').forEach((select) => {
      select.addEventListener('change', handleBgSelectChange.bind(null, select));
    });

    // Bind background increment
    form.querySelectorAll('[data-bg-increment]').forEach((input) => {
      input.addEventListener('change', handleBgIncrementChange.bind(null, input));
    });

    // Bind background ability
    form.querySelectorAll('[data-bg-ability]').forEach((input) => {
      input.addEventListener('change', handleBgAbilityChange.bind(null, input));
    });

    // Bind background equipment
    form.querySelectorAll('[data-bg-equipment]').forEach((input) => {
      input.addEventListener('change', handleBgEquipmentChange.bind(null, input));
    });

    // Bind spellcasting ability
    form.querySelectorAll('[name="spellcasting-ability"]').forEach((input) => {
      input.addEventListener('change', handleSpellcastingAbilityChange.bind(null, input));
    });

    // Bind level up HP gain
    form.querySelectorAll('[data-level-hp-gain]').forEach((input) => {
      input.addEventListener('input', handleLevelUpHpGainInput.bind(null, input));
    });

    // Bind HP preset buttons
    form.querySelectorAll('[data-hp-preset]').forEach((button) => {
      button.addEventListener('click', handleHpPresetClick.bind(null, button));
    });

    // Bind cancel level up
    const cancelLevelUpBtn = form.querySelector('[data-cancel-level-up]');
    if (cancelLevelUpBtn) {
      cancelLevelUpBtn.addEventListener('click', handleCancelLevelUp);
    }

    // Bind apply level up
    const applyLevelUpBtn = form.querySelector('[data-apply-level-up]');
    if (applyLevelUpBtn) {
      applyLevelUpBtn.addEventListener('click', handleApplyLevelUp);
    }

    // Bind list choices
    form.querySelectorAll('[data-list]').forEach((input) => {
      input.addEventListener('change', handleListChange.bind(null, input));
    });

    // Bind navigation buttons
    form.querySelectorAll('[data-move]').forEach((button) => {
      button.addEventListener('click', handleMoveClick.bind(null, button));
    });

    // Bind remove attack buttons
    form.querySelectorAll('[data-remove-attack]').forEach((button) => {
      button.addEventListener('click', handleRemoveAttackClick.bind(null, button));
    });

    // Bind add attack button
    const addAttackBtn = form.querySelector('#addAttackButton');
    if (addAttackBtn) {
      addAttackBtn.addEventListener('click', handleAddAttackClick);
    }

    // Bind suggest attacks button
    const suggestAttacksBtn = form.querySelector('#suggestAttacksButton');
    if (suggestAttacksBtn) {
      suggestAttacksBtn.addEventListener('click', handleSuggestAttacksClick);
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

  // Handler for navigation
  function handleMoveClick(button) {
    const state = getState();
    // Handle navigation
    persist();
    render();
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
