/**
 * Ability Method Renderer - Renders ability score generation UI
 *
 * Handles:
 * - Standard Array selection
 * - Point Buy UI
 * - Manual assignment
 * - Ability score calculations display
 */

export function createAbilityMethodRenderer({
  getState,
  abilities,
  numberField,
  buildStandardArrayCards,
  calculateCharacterAbilityBonuses,
  buildPointBuyViewModel,
  buildScoreCards,
  escapeHtml,
  deriveProjectedAbilityModifier,
  calculateFixedHpGain,
  signed,
}) {
  /**
   * Render ability method controls (Standard Array / Point Buy / Manual)
   */
  function renderAbilityMethodControls() {
    const state = getState();
    const method = state.character.abilityMethod || 'standard';

    if (method === 'standard') {
      return renderStandardArrayControls();
    } else if (method === 'pointBuy') {
      return renderPointBuyControls();
    }

    return '';
  }

  /**
   * Render Standard Array controls
   */
  function renderStandardArrayControls() {
    const state = getState();
    const standardArray = [15, 14, 13, 12, 10, 8];
    const cards = buildStandardArrayCards(standardArray);

    return `
      <div class="standard-array-cards">
        ${cards.map(card => `
          <div class="ability-card">
            <span class="ability-value">${card.value}</span>
            <span class="ability-label">${escapeHtml(card.label)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render Point Buy controls
   */
  function renderPointBuyControls() {
    const state = getState();
    const budget = state.pointBuyBudget || 27;
    const spent = state.pointBuySpent || 0;
    const remaining = budget - spent;
    const viewModel = buildPointBuyViewModel(budget);

    return `
      <div class="point-buy-container">
        <div class="point-buy-budget">
          <span>Pontos disponíveis: ${remaining}</span>
          <span class="hint">${spent}/${budget} gastos</span>
        </div>
        <div class="point-buy-abilities">
          ${viewModel.map(ability => `
            <div class="ability-row">
              <label>${escapeHtml(ability.label)}</label>
              <div class="ability-controls">
                <button type="button" class="ability-decrement" data-ability="${ability.key}" ${ability.value <= 8 ? 'disabled' : ''}>-</button>
                <span class="ability-value">${ability.value}</span>
                <button type="button" class="ability-increment" data-ability="${ability.key}" ${ability.value >= 15 || remaining <= 0 ? 'disabled' : ''}>+</button>
              </div>
              <span class="ability-cost">${ability.cost > 0 ? `+${ability.cost}` : ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render ability score calculations
   */
  function renderAbilityScoreCalculations() {
    const state = getState();
    const scoreCards = buildScoreCards();

    return `
      <div class="ability-scores">
        ${scoreCards.map(card => `
          <div class="ability-card ${card.modifier >= 0 ? 'positive' : 'negative'}">
            <div class="ability-main">
              <span class="ability-name">${escapeHtml(card.label)}</span>
              <span class="ability-score">${card.value}</span>
            </div>
            <div class="ability-modifier">${card.modifier >= 0 ? '+' : ''}${card.modifier}</div>
            ${card.bonuses.length > 0 ? `
              <div class="ability-bonuses">
                ${card.bonuses.map(b => `<span class="bonus-tag">${escapeHtml(b.source)}: ${b.bonus}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  return {
    renderAbilityMethodControls,
    renderStandardArrayControls,
    renderPointBuyControls,
    renderAbilityScoreCalculations,
  };
}
