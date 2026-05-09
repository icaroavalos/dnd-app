export function createBuilderRenderers({
  getState,
  abilities,
  numberField,
  buildStandardArrayCards,
  calculateCharacterAbilityBonuses,
  buildPointBuyViewModel,
  buildScoreCards,
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

  return {
    renderAbilityMethodControls,
    renderStandardArrayControls,
    renderPointBuyControls,
    renderAbilityScoreCalculations,
  };
}
