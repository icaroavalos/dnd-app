export function createBuilderRenderers({
  getState,
  abilities,
  numberField,
  buildStandardArrayCards,
  calculateCharacterAbilityBonuses,
  buildPointBuyViewModel,
  buildScoreCards,
  escapeHtml,
  selectField,
  choiceLocked,
  normalizedAsiChoice,
  isAsiChoiceComplete,
  qualifiedFeatOptions,
  asiAbilityOptions,
  titleCase,
  deriveProjectedAbilityModifier,
  calculateFixedHpGain,
  signed,
  creationChoicesLocked,
  backgroundSpellOptions,
}) {
  function renderAbilityMethodControls() {
    const state = getState();
    const method = state.character.abilityMethod ?? "standard";
    if (method === "standard") return renderStandardArrayControls();
    if (method === "pointBuy") return renderPointBuyControls();
    return `
      <div class="ability-grid">
        ${abilities.map(([key, label]) => numberField(`abilities.${key}`, label, state.character.abilities[key], 1, 30)).join("")}
      </div>
      <p class="hint">Use Manual/Rolled para digitar valores rolados na mesa ou qualquer distribuicao definida pelo mestre.</p>
    `;
  }

  function renderStandardArrayControls() {
    const cards = buildStandardArrayCards(getState().character);
    return `
      <div class="standard-array-grid">
        ${cards.map((card) => `
          <button type="button" class="standard-array-card" draggable="true" data-standard-ability="${card.key}">
            <span>${card.label}</span>
            <strong>${card.score}</strong>
            <em>${card.modifierFormatted}</em>
          </button>
        `).join('')}
      </div>
      <p class="hint">Arraste um atributo sobre outro para trocar os valores entre eles.</p>
    `;
  }

  function renderPointBuyControls() {
    const state = getState();
    const bonuses = calculateCharacterAbilityBonuses(state.character);
    const vm = buildPointBuyViewModel(state.character.abilities, bonuses);
    return `
      <div class="point-buy-head">
        <strong>${vm.remaining} pontos restantes</strong>
        <span>${vm.spent}/${vm.budget} gastos</span>
      </div>
      <div class="point-buy-grid">
        ${vm.rows.map((row) => `
          <article class="point-buy-row">
            <div>
              <strong>${row.label}</strong>
              <span>Custo ${row.cost} | Mod ${row.modifierFormatted}</span>
            </div>
            <div class="score-stepper">
              <button type="button" class="mini-button" data-ability-adjust="${row.key}" data-delta="-1" ${row.canDecrease ? "" : "disabled"}>-</button>
              <output>${row.score}</output>
              <button type="button" class="mini-button" data-ability-adjust="${row.key}" data-delta="1" ${row.canIncrease ? "" : "disabled"}>+</button>
            </div>
          </article>
        `).join('')}
      </div>
      <p class="hint">Point Buy usa valores de 8 a 15 antes dos bonus de especie. Aumentar de 13 para 14 ou 15 custa mais.</p>
    `;
  }

  function renderAbilityScoreCalculations() {
    const cards = buildScoreCards(getState().character);
    return `
      <section class="score-calculations">
        <h3>Score Calculations</h3>
        <div class="score-card-grid">
          ${cards.map((card) => `
            <article class="score-calc-card">
              <h4>${card.label}</h4>
              <div><span>Total Score</span><strong>${card.totalScore}</strong></div>
              <div><span>Modifier</span><strong>${card.modifierFormatted}</strong></div>
              <div><span>Base Score</span><strong>${card.baseScore}</strong></div>
              <div><span>Bonus</span><strong>${card.bonusFormatted}</strong></div>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

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

  function renderLevelUpClassChoice() {
    const state = getState();
    return `
      <fieldset class="choice-group">
        <legend>Classe deste nivel</legend>
        <p class="choice-counter complete">1/1 escolhida</p>
        <div class="choice-list">
          <label>
            <input type="radio" name="level-up-class-mode" data-level-up-class-mode value="same" checked />
            <span><strong>${titleCase(state.character.class)}</strong><small>Nivel ${state.character.level}</small></span>
          </label>
          <label class="disabled">
            <input type="radio" name="level-up-class-mode" value="multiclass" disabled />
            <span><strong>Multiclasse</strong><small>Vai exigir suporte de niveis por classe antes de aplicar regras corretamente.</small></span>
          </label>
        </div>
      </fieldset>
    `;
  }

  function renderLevelUpHpControl() {
    const state = getState();
    const con = deriveProjectedAbilityModifier(state.character, "con");
    const die = (state.api.classes[state.character.class]?.hit_die ?? 8);
    const fixed = calculateFixedHpGain(die, con);
    const min = Math.max(1, 1 + con);
    const max = Math.max(1, die + con);
    return `
      <fieldset class="choice-group hp-level-group">
        <legend>Hit Points deste nivel</legend>
        <p class="hint">D&D 2024: ao subir de nivel, escolha rolar 1d${die} ou usar o valor fixo ${fixed - con}; depois some seu modificador de Constitution (${signed(con)}). O ganho minimo e 1.</p>
        <div class="hp-gain-row">
          <button type="button" class="mini-button" data-hp-preset="${fixed}">Fixo ${fixed}</button>
          <button type="button" class="mini-button" data-hp-preset="${max}">Max ${max}</button>
          <label>
            Ganho de HP
            <input type="number" min="${min}" max="${max}" value="${state.levelUpHpGain || fixed}" data-level-hp-gain />
          </label>
        </div>
        <p class="choice-counter complete">HP: ${state.levelUpHpBase || state.character.hp - (state.levelUpHpGain || 0)} + ${state.levelUpHpGain || fixed} = ${state.character.hp}</p>
      </fieldset>
    `;
  }

  function renderLevelUpNavButtons() {
    const state = getState();
    return `
      ${state.validationMessage ? `<p class="validation-message">${escapeHtml(state.validationMessage)}</p>` : ""}
      <div class="nav-row">
        <button type="button" class="secondary-button" data-cancel-level-up>Cancelar</button>
        <button type="button" class="primary-button" data-apply-level-up>Aplicar</button>
      </div>
    `;
  }

  function renderBgSpellChoice(rule) {
    const state = getState();
    const storageKey = `bg-${rule.id}`;
    const selected = state.character.bgSpellChoices?.[storageKey] || [];
    const locked = creationChoicesLocked();
    const spellList = rule.spellList?.toLowerCase() || "";
    const listSpells = backgroundSpellOptions(spellList);
    const cantrips = listSpells.filter((spell) => spell.level === 0).map((spell) => spell.name);
    const level1 = listSpells.filter((spell) => spell.level === 1).map((spell) => spell.name);
    const selectedCantrips = selected.filter((spell) => cantrips.includes(spell));
    const selectedLevel1 = selected.filter((spell) => level1.includes(spell));
    return `
      <fieldset class="choice-group bg-spell-choice">
        <legend>${escapeHtml(rule.name)}</legend>
        <p class="choice-counter">${selectedCantrips.length}/${rule.cantrips} cantrips e ${selectedLevel1.length}/${rule.level1Spells} magias de nivel 1</p>
        <h4>Cantrips (escolha ${rule.cantrips})</h4>
        <div class="choice-list">
          ${cantrips.map((name) => {
            const isSelected = selected.includes(name);
            const disabled = locked || (!isSelected && selectedCantrips.length >= rule.cantrips);
            return `<label><input type="checkbox" data-bg-spell="${storageKey}" value="${name}" ${isSelected ? "checked" : ""} ${disabled ? "disabled" : ""}/> ${escapeHtml(name)}</label>`;
          }).join("")}
        </div>
        <h4>Magias de 1° nivel (escolha ${rule.level1Spells})</h4>
        <div class="choice-list">
          ${level1.map((name) => {
            const isSelected = selected.includes(name);
            const disabled = locked || (!isSelected && selectedLevel1.length >= rule.level1Spells);
            return `<label><input type="checkbox" data-bg-spell="${storageKey}" value="${name}" ${isSelected ? "checked" : ""} ${disabled ? "disabled" : ""}/> ${escapeHtml(name)}</label>`;
          }).join("")}
        </div>
      </fieldset>
    `;
  }

  return {
    renderAbilityMethodControls,
    renderStandardArrayControls,
    renderPointBuyControls,
    renderAbilityScoreCalculations,
    renderEquipmentChoice,
    renderClassCreationChoice,
    renderAsiChoice,
    renderLevelUpClassChoice,
    renderLevelUpHpControl,
    renderLevelUpNavButtons,
    renderBgSpellChoice,
  };
}
