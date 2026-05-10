/**
 * Class Creation Renderer - Renders class creation-specific UI components
 *
 * Handles:
 * - Equipment choices for class
 * - Class feature choices (ASI/feat during initial creation if applicable)
 * - Other class-specific choices
 */

export function createClassCreationRenderer({
  getState,
  escapeHtml,
  choiceLocked,
  normalizedAsiChoice,
  isAsiChoiceComplete,
  qualifiedFeatOptions,
  asiAbilityOptions,
  selectField,
  deriveProjectedAbilityModifier,
  calculateFixedHpGain,
  signed,
}) {
  /**
   * Render equipment choice group
   */
  function renderEquipmentChoice(equipmentOption) {
    const state = getState();
    const locked = choiceLocked('equipment');

    return `
      <fieldset class="choice-group">
        <legend>${escapeHtml(equipmentOption.name)}</legend>
        <p class="hint">${escapeHtml(equipmentOption.description || 'Escolha seu equipamento inicial.')}</p>
        <div class="choice-list">
          ${equipmentOption.choices.map(
            (choice) => `
            <label class="${state.character.equipmentChoices?.[equipmentOption.id] === choice.value ? 'selected' : ''} ${locked ? 'disabled' : ''}">
              <input type="radio" name="equipment-${escapeHtml(equipmentOption.id)}" value="${escapeHtml(choice.value)}" ${state.character.equipmentChoices?.[equipmentOption.id] === choice.value ? 'checked' : ''} ${locked ? 'disabled' : ''} data-equipment-choice="${escapeHtml(equipmentOption.id)}" />
              <span>${escapeHtml(choice.label)}</span>
              ${choice.hint ? `<small class="choice-hint">${escapeHtml(choice.hint)}</small>` : ''}
            </label>
          `
          ).join('')}
        </div>
      </fieldset>
    `;
  }

  /**
   * Render class creation choice (handles ASI/feat choices during creation if needed)
   */
  function renderClassCreationChoice(rule) {
    const state = getState();
    const character = state.character;

    // Handle ASI/feat choice
    if (rule.type === 'asi') {
      return renderAsiChoice(rule);
    }

    // Handle other choices from data-driven rules
    return renderGenericChoice(rule);
  }

  function renderAsiChoice(rule) {
    const state = getState();
    const character = state.character;
    const choice = normalizedAsiChoice(rule, character);
    const locked = choiceLocked('asi');

    return `
      <fieldset class="choice-group">
        <legend>${escapeHtml(rule.name)}</legend>
        <p class="choice-counter ${isAsiChoiceComplete(rule, character) ? 'complete' : ''}">
          ${choice.selectedAsiCount}/2 ability increases
        </p>
        <p class="hint">Increase two different ability scores by 1 each, or increase one ability score by 2. Or select a feat instead.</p>

        <div class="choice-group-inline" style="margin-bottom: 1rem;">
          <label>
            <input type="radio" name="asi-mode" value="abilities" ${choice.mode === 'abilities' ? 'checked' : ''} ${locked ? 'disabled' : ''} data-asi-mode />
            <span>Aumentar Ability Scores</span>
          </label>
          <label style="margin-left: 1rem;">
            <input type="radio" name="asi-mode" value="feat" ${choice.mode === 'feat' ? 'checked' : ''} ${locked ? 'disabled' : ''} data-asi-mode />
            <span>Selecionar Feat</span>
          </label>
        </div>

        ${choice.mode === 'abilities' ? renderAsiAbilityButtons(choice, locked) : renderFeatOptions(rule, character, locked)}
      </fieldset>
    `;
  }

  function renderAsiAbilityButtons(choice, locked) {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((key) => ({
      key,
      label: titleCase(key),
      current: character.abilities?.[key] || 10,
    }));

    const combinations = [];

    if (choice.oneOrTwo === 2) {
      // Single +2
      abilities.forEach((ab) => {
        combinations.push([
          {
            key: ab.key,
            increase: 2,
            label: `${ab.label} +2 (${ab.current} → ${ab.current + 2})`,
          },
        ]);
      });
    } else {
      // Two +1s to different abilities
      for (let i = 0; i < abilities.length; i++) {
        for (let j = i + 1; j < abilities.length; j++) {
          combinations.push([
            { key: abilities[i].key, increase: 1, label: `${abilities[i].label} +1` },
            { key: abilities[j].key, increase: 1, label: `${abilities[j].label} +1` },
          ]);
        }
      }
    }

    return `
      <div class="asi-combinations">
        ${combinations
          .map(
            (combo, idx) => `
          <label class="${choice.selectedCombination === idx ? 'selected' : ''} ${locked ? 'disabled' : ''}" style="display:block;margin:0.25rem 0;">
            <input type="radio" name="asi-combination" value="${idx}" ${choice.selectedCombination === idx ? 'checked' : ''} ${locked ? 'disabled' : ''} data-asi-combination />
            ${combo.map((c) => `<span>${c.label}</span>`).join(' + ')}
          </label>
        `
          )
          .join('')}
      </div>
    `;
  }

  function renderFeatOptions(rule, character, locked) {
    const feats = qualifiedFeatOptions(character);
    const selectedFeat = character.classFeatureChoices?.[rule.id];

    return `
      <div class="choice-list">
        ${feats
          .map(
            (feat) => `
          <label class="${selectedFeat === feat.value ? 'selected' : ''} ${locked ? 'disabled' : ''}">
            <input type="radio" name="feat-choice" value="${escapeHtml(feat.value)}" ${selectedFeat === feat.value ? 'checked' : ''} ${locked ? 'disabled' : ''} data-class-feature-choice="${rule.id}" />
            <div style="margin-left:0.5rem;">
              <strong>${escapeHtml(feat.label)}</strong>
              ${feat.description ? `<p class="hint" style="margin:0.25rem 0 0 0;">${escapeHtml(feat.description)}</p>` : ''}
            </div>
          </label>
        `
          )
          .join('')}
      </div>
    `;
  }

  function renderGenericChoice(rule) {
    const state = getState();
    const character = state.character;
    const locked = choiceLocked(rule.id);

    // Generic choice rendering - can be extended for other rule types
    return `
      <fieldset class="choice-group">
        <legend>${escapeHtml(rule.name)}</legend>
        <p class="hint">Escolha uma opção para ${escapeHtml(rule.name)}.</p>
        ${rule.options
          ?.map(
            (opt) => `
            <label class="${character.classFeatureChoices?.[rule.id] === opt.value ? 'selected' : ''} ${locked ? 'disabled' : ''}">
              <input type="radio" name="class-choice-${escapeHtml(rule.id)}" value="${escapeHtml(opt.value)}" ${character.classFeatureChoices?.[rule.id] === opt.value ? 'checked' : ''} ${locked ? 'disabled' : ''} data-class-feature-choice="${escapeHtml(rule.id)}" />
              <span>${escapeHtml(opt.label)}</span>
            </label>
          `
          )
          .join('')}
      </fieldset>
    `;
  }

  return {
    renderEquipmentChoice,
    renderClassCreationChoice,
    renderAsiChoice, // Also used in level-up context
  };
}
