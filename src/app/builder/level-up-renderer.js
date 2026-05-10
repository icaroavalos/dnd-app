/**
 * Level-up Renderer - Renders level-up specific UI components
 *
 * Handles:
 * - Class feature choices (subclass selection at appropriate levels)
 * - ASI (Ability Score Improvement) choices - either increase abilities or select feat
 * - Other level-up choices (e.g., cantrip choices, spell selections)
 */

export function createLevelUpRenderer({
  getState,
  titleCase,
  deriveProjectedAbilityModifier,
  calculateFixedHpGain,
  signed,
  escapeHtml,
  selectField,
  choiceLocked,
  normalizedAsiChoice,
  isAsiChoiceComplete,
  qualifiedFeatOptions,
  asiAbilityOptions,
}) {
  /**
   * Render subclass choice for level-up
   * Shows when character reaches a level that grants subclass (e.g., Barbarian level 3)
   */
  function renderLevelUpClassChoice() {
    const state = getState();
    const character = state.character;
    const level = character.level;

    // Check if subclass choice is available at this level
    const subclassOption = getSubclassOptionForLevel(character.class, level, state.api);
    if (!subclassOption) {
      return '<p class="hint">Nenhuma escolha de classe disponível neste nível.</p>';
    }

    const selectedSubclass = character.classFeatureChoices?.subclass;
    const subclasses = subclassOption.options || [];
    const locked = choiceLocked('subclass');

    return `
      <fieldset class="choice-group">
        <legend>${subclassOption.name}</legend>
        <p class="hint">${subclassOption.hint || 'Escolha sua especialização de classe.'}</p>
        <div class="choice-list">
          ${subclasses
            .map(
              (sub) => `
            <label class="${selectedSubclass === sub.value ? 'selected' : ''} ${locked ? 'disabled' : ''}">
              <input type="radio" name="subclass" value="${escapeHtml(sub.value)}" ${selectedSubclass === sub.value ? 'checked' : ''} ${locked ? 'disabled' : ''} data-class-feature-choice="subclass" />
              <span>${escapeHtml(sub.label)}</span>
            </label>
          `
            )
            .join('')}
        </div>
      </fieldset>
    `;
  }

  /**
   * Render ASI choice UI for level-up
   * Shows when character gains Ability Score Improvement (e.g., Barbarian level 4)
   */
  function renderAsiChoice(rule) {
    const state = getState();
    const character = state.character;
    const choice = normalizedAsiChoice(rule, character);
    const locked = choiceLocked('asi');

    return `
      <fieldset class="choice-group">
        <legend>${titleCase(rule.name)}</legend>
        <p class="choice-counter ${isAsiChoiceComplete(rule, character) ? 'complete' : ''}">
          ${choice.selectedAsiCount}/2 ability increases
        </p>
        <p class="hint">You can increase two ability scores by 1 each, or one ability score by 2. Alternatively, you can select a ${titleCase(rule.featOptionLabel || 'feat')} instead of ability increases.</p>

        <div class="choice-group-inline" style="margin-bottom: 1rem;">
          <label>
            <input type="radio" name="asi-mode" value="abilities" ${choice.mode === 'abilities' ? 'checked' : ''} ${locked ? 'disabled' : ''} data-asi-mode />
            <span>Aumentar Ability Scores</span>
          </label>
          <label style="margin-left: 1rem;">
            <input type="radio" name="asi-mode" value="feat" ${choice.mode === 'feat' ? 'checked' : ''} ${locked ? 'disabled' : ''} data-asi-mode />
            <span>Selecionar ${escapeHtml(rule.featOptionLabel || 'Feat')}</span>
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
      value: (character.abilities?.[key] || 10) + (choice.oneOrTwo === 2 ? 2 : 1),
      current: character.abilities?.[key] || 10,
    }));

    // Generate all possible combinations
    const combinations = [];
    if (choice.oneOrTwo === 1) {
      // Single +2
      abilities.forEach((ab) => {
        combinations.push([
          {
            key: ab.key,
            increase: 2,
            newValue: ab.current + 2,
            label: `${ab.label} +2 (${ab.current} → ${ab.current + 2})`,
          },
        ]);
      });
    } else {
      // Two +1s - same ability or different
      // Option: +1 to two different abilities
      for (let i = 0; i < abilities.length; i++) {
        for (let j = i + 1; j < abilities.length; j++) {
          combinations.push([
            { key: abilities[i].key, increase: 1, newValue: abilities[i].current + 1, label: `${abilities[i].label} +1` },
            { key: abilities[j].key, increase: 1, newValue: abilities[j].current + 1, label: `${abilities[j].label} +1` },
          ]);
        }
      }
    }

    return `
      <div class="asi-combinations">
        ${combinations
          .map(
            (combo, idx) => `
          <label class="asi-combination ${choice.selectedCombination === idx ? 'selected' : ''} ${locked ? 'disabled' : ''}" style="display:block;margin:0.25rem 0;">
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

    if (!feats.length) {
      return '<p class="hint">Nenhum feat disponível.</p>';
    }

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

  /**
   * Render HP gain control for level-up
   */
  function renderLevelUpHpControl() {
    const state = getState();
    const character = state.character;
    const hitDie = state.api.classes[character.class]?.hitDie || 'd10';
    const conMod = deriveProjectedAbilityModifier(character.abilities?.con || 10);
    const fixedGain = calculateFixedHpGain(hitDie, conMod);
    const totalHp = (character.hp || 0) + fixedGain;

    return `
      <fieldset class="choice-group">
        <legend>Hit Points</legend>
        <p class="hint">
          Seu hit die é ${hitDie}. Com Constituição ${signed(conMod)}, você ganha ${fixedGain} HP (média do hit die + modificador).
        </p>
        <div style="margin:0.5rem 0;">
          <label>
            <input type="checkbox" ${character.hpFixedGainAccepted ? 'checked' : ''} data-hp-fixed-gain />
            <span>Aceitar ${fixedGain} HP (total: ${totalHp})</span>
          </label>
        </div>
        <p class="hint">Alternativamente, você pode rolar o hit die manualmente.</p>
      </fieldset>
    `;
  }

  /**
   * Render level-up navigation buttons
   */
  function renderLevelUpNavButtons() {
    return `
      <nav class="button-bar">
        <button type="button" class="nav-button" data-action="prev">Back</button>
        <button type="button" class="nav-button" data-action="finish-level-up">Complete Level Up</button>
      </nav>
    `;
  }

  /**
   * Check if subclass option exists for given class and level
   */
  function getSubclassOptionForLevel(className, level, api) {
    const classFeatures = api.source?.classFeatures || [];
    const subclassFeature = classFeatures.find(
      (f) =>
        slugify(f.className) === slugify(className) &&
        f.level === level &&
        /subclass/i.test(f.name)
    );

    if (!subclassFeature) return null;

    // Find matching subclass options from subclasses array
    const subclasses = api.source?.subclasses || [];
    const matchingSubclasses = subclasses.filter(
      (s) => slugify(s.className) === slugify(className)
    );

    return {
      name: subclassFeature.name,
      hint: subclassFeature.entries?.join(' '),
      options: matchingSubclasses.map((s) => ({
        value: slugify(s.name),
        label: `${s.name}${s.shortName ? ` (${s.shortName})` : ''}`,
      })),
    };
  }

  function slugify(value: string): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return {
    renderLevelUpClassChoice,
    renderAsiChoice,
    renderLevelUpHpControl,
    renderLevelUpNavButtons,
  };
}
