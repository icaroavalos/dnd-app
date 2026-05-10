/**
 * Class Creation Renderer
 *
 * Renderiza escolhas de criacao de personagem:
 * - Equipment choices
 * - Class feature choices
 * - ASI (Ability Score Improvement) choices
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
   * Renderiza escolha de equipment
   */
  function renderEquipmentChoice(rule, locked) {
    const state = getState();
    const selected = state.character.equipmentChoices?.[rule.id] ?? "";
    return `
<fieldset class="choice-group">
  <legend>${escapeHtml(rule.name)}</legend>
  <p class="choice-counter ${selected ? "complete" : ""}">${selected ? "1" : "0"}/1 escolhida</p>
  <p class="hint">${escapeHtml(rule.summary)}</p>
  <div class="choice-list">
    ${rule.options.map((option) => `
      <label>
        <input type="radio" name="equipment-${rule.id}" data-equipment-choice="${rule.id}" value="${escapeHtml(option.value)}" ${selected === option.value ? "checked" : ""} ${locked ? "disabled" : ""} />
        <span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.hint)}</small></span>
      </label>
    `).join("")}
  </div>
</fieldset>
`;
  }

  /**
   * Renderiza escolha de class feature
   */
  function renderClassCreationChoice(rule) {
    if (rule.type === "asi") return renderAsiChoice(rule);
    const selected = getState().character.classFeatureChoices?.[rule.id] ?? "";
    return `
<fieldset class="choice-group">
  <legend>${escapeHtml(rule.name)}</legend>
  <p class="choice-counter ${selected ? "complete" : ""}">${selected ? "1" : "0"}/${rule.count} escolhida</p>
  <p class="hint">${escapeHtml(rule.summary)}</p>
  <div class="choice-list">
    ${rule.options.map((option) => `
      <label>
        <input type="radio" name="class-feature-${rule.id}" data-class-feature-choice="${rule.id}" value="${escapeHtml(option.value)}" ${selected === option.value ? "checked" : ""} ${choiceLocked(rule) ? "disabled" : ""} />
        <span><strong>${escapeHtml(option.label)}</strong>${option.hint ? `<small>${escapeHtml(option.hint)}</small>` : ""}</span>
      </label>
    `).join("")}
  </div>
</fieldset>
`;
  }

  /**
   * Renderiza escolha de ASI (Ability Score Improvement)
   */
  function renderAsiChoice(rule) {
    const rawChoice = getState().character.asiChoices?.[rule.id];
    const choice = normalizedAsiChoice(rule);
    const featOptions = qualifiedFeatOptions(rule.featCategory);
    return `
<fieldset class="choice-group">
  <legend>${escapeHtml(rule.name)}</legend>
  <p class="choice-counter ${isAsiChoiceComplete(rule) ? "complete" : ""}">${isAsiChoiceComplete(rule) ? "1" : "0"}/1 escolhida</p>
  <p class="hint">${escapeHtml(rule.summary)}</p>
  <div class="choice-list">
    <label>
      <input type="radio" name="asi-mode-${rule.id}" data-asi-mode="${rule.id}" value="asi" ${rawChoice?.mode === "asi" ? "checked" : ""} ${choiceLocked(rule) ? "disabled" : ""} />
      <span><strong>Ability Score Improvement</strong><small>+2 em um atributo, ou +1 em dois atributos, maximo 20.</small></span>
    </label>
    <label>
      <input type="radio" name="asi-mode-${rule.id}" data-asi-mode="${rule.id}" value="feat" ${rawChoice?.mode === "feat" ? "checked" : ""} ${choiceLocked(rule) ? "disabled" : ""} />
      <span><strong>Escolher feat</strong><small>Mostra feats para as quais o personagem qualifica.</small></span>
    </label>
  </div>
  ${rawChoice?.mode === "feat" ? `
    ${selectField(`asiChoices.${rule.id}.feat`, "Feat", choice.feat, [["", "Escolha um feat"], ...featOptions], choiceLocked(rule))}
  ` : rawChoice?.mode === "asi" ? `
    ${selectField(`asiChoices.${rule.id}.pattern`, "Bonus", choice.pattern, [["plus2", "+2 em um atributo"], ["plus1plus1", "+1 em dois atributos"]], choiceLocked(rule))}
    <div class="form-grid">
      ${selectField(`asiChoices.${rule.id}.ability1`, "Atributo 1", choice.ability1, asiAbilityOptions(), choiceLocked(rule))}
      ${choice.pattern === "plus1plus1" ? selectField(`asiChoices.${rule.id}.ability2`, "Atributo 2", choice.ability2, asiAbilityOptions(choice.ability1), choiceLocked(rule)) : ""}
    </div>
  ` : ""}
</fieldset>
`;
  }

  return {
    renderEquipmentChoice,
    renderClassCreationChoice,
    renderAsiChoice,
  };
}
