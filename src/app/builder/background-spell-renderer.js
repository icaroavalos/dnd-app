/**
 * Background Spell Renderer - Renders background spell selection UI
 *
 * Handles:
 * - Magic Initiate spell choices
 * - Background spell selections
 */

export function createBackgroundSpellRenderer({
  getState,
  escapeHtml,
  creationChoicesLocked,
  backgroundSpellOptions,
}) {
  /**
   * Render a single background spell choice (for Magic Initiate rules)
   */
  function renderBgSpellChoice(rule) {
    const state = getState();
    const character = state.character;
    const bgSpellChoices = character.bgSpellChoices || {};
    const locked = creationChoicesLocked;

    // rule should have: name, spellList, cantrips, level1Spells
    const ruleId = rule.id;
    const storageKey = `bg-${ruleId}`;
    const selected = bgSpellChoices[storageKey] || [];

    // Get spell options for this spell list
    const spellListKey = rule.spellList.toLowerCase();
    const options = backgroundSpellOptions(spellListKey) || [];

    if (options.length === 0) {
      return '';
    }

    return `
      <fieldset class="choice-group">
        <legend>${escapeHtml(rule.name)}</legend>
        <p class="hint">Choose ${rule.cantrips} cantrip(s) and ${rule.level1Spells} spell(s) from ${rule.spellList} spell list.</p>
        <div class="choice-list">
          ${options.map((spell) => {
            const isSelected = selected.includes(spell.name);
            const isCantrip = spell.level === 0;
            const cantripCount = selected.filter(s => {
              const opt = options.find(o => o.name === s);
              return opt && opt.level === 0;
            }).length;
            const leveledCount = selected.filter(s => {
              const opt = options.find(o => o.name === s);
              return opt && opt.level > 0;
            }).length;
            const disabled = locked || (isCantrip && cantripCount >= rule.cantrips) || (!isCantrip && leveledCount >= rule.level1Spells);
            return `
              <label class="${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}">
                <input type="checkbox" value="${escapeHtml(spell.name)}" ${isSelected ? 'checked' : ''} ${disabled ? 'disabled' : ''} data-bg-spell="${escapeHtml(spell.name)}" data-rule-id="${ruleId}" />
                <span>
                  <strong>${escapeHtml(spell.name)}</strong>
                  <small class="choice-hint">${escapeHtml(spell.level > 0 ? `Level ${spell.level}` : 'Cantrip')}</small>
                </span>
              </label>
            `;
          }).join('')}
        </div>
      </fieldset>
    `;
  }

  /**
   * Render all background spell choices (deprecated, use renderBgSpellChoice)
   */
  function renderBgSpellChoices() {
    return renderBgSpellChoicesImpl();
  }

  function renderBgSpellChoicesImpl() {
    const state = getState();
    const character = state.character;
    const bgSpellChoices = character.bgSpellChoices || {};
    const locked = creationChoicesLocked;

    const spellOptions = backgroundSpellOptions();
    if (!spellOptions || spellOptions.length === 0) {
      return '';
    }

    return `
      <fieldset class="choice-group">
        <legend>Background Spells</legend>
        <p class="hint">Choose your spells from the available options.</p>
        <div class="choice-list">
          ${spellOptions.map((spell) => `
            <label class="${bgSpellChoices[spell.name]?.selected ? 'selected' : ''} ${locked ? 'disabled' : ''}">
              <input type="checkbox" value="${escapeHtml(spell.name)}" ${bgSpellChoices[spell.name]?.selected ? 'checked' : ''} ${locked ? 'disabled' : ''} data-bg-spell="${escapeHtml(spell.name)}" />
              <span>
                <strong>${escapeHtml(spell.name)}</strong>
                <small class="choice-hint">${escapeHtml(spell.level > 0 ? `Level ${spell.level}` : 'Cantrip')}</small>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>
    `;
  }

  return {
    renderBgSpellChoice,
    renderBgSpellChoices,
  };
}
