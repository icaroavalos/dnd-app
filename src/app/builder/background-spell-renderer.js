/**
 * Background Spell Renderer
 *
 * Renderiza escolhas de magias do background (Magic Initiate):
 * - Cantrips
 * - Magias de 1o nivel
 */

export function createBackgroundSpellRenderer({
  getState,
  escapeHtml,
  creationChoicesLocked,
  backgroundSpellOptions,
}) {
  /**
   * Renderiza escolha de magias do background
   */
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
    renderBgSpellChoice,
  };
}
