/**
 * Level Up Renderer
 *
 * Renderiza controles de level up:
 * - Escolha de classe
 * - HP gain control
 * - Navigation buttons
 */

export function createLevelUpRenderer({
  getState,
  titleCase,
  deriveProjectedAbilityModifier,
  calculateFixedHpGain,
  signed,
  escapeHtml,
}) {
  /**
   * Renderiza escolha de classe no level up
   */
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

  /**
   * Renderiza controle de HP gain no level up
   */
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

  /**
   * Renderiza botões de navegação do level up
   */
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

  return {
    renderLevelUpClassChoice,
    renderLevelUpHpControl,
    renderLevelUpNavButtons,
  };
}
