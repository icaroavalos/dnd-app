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
   * Render background spell choices (Magic Initiate)
   */
  function renderBgSpellChoices() {
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
    renderBgSpellChoices,
  };
}
