export function createModalRenderers({
  getState,
  els,
  document,
  closeHpModal,
  applyHpModalAction,
  deriveProjectedAbilityModifier,
  availableHitDice,
  cancelRest,
  confirmRest,
}) {
  function renderHpModal() {
    const state = getState();
    if (!els.hpModal || !els.hpModalBackdrop) return;
    els.hpModal.hidden = !state.hpModalOpen;
    els.hpModalBackdrop.hidden = !state.hpModalOpen;
    if (!state.hpModalOpen) {
      els.hpModal.innerHTML = "";
      return;
    }
    const maxHp = state.derived?.maxHp ?? 0;
    const currentHp = state.derived?.currentHp ?? 0;
    const tempHp = state.derived?.tempHp ?? 0;
    const totalHp = currentHp + tempHp;
    els.hpModal.innerHTML = `
    <div class="hp-modal-panel">
      <div class="hp-modal-head">
        <div>
          <p class="eyebrow">HP Control</p>
          <h2>Gerenciar vida</h2>
        </div>
        <button type="button" class="icon-button" data-close-hp-modal aria-label="Fechar controle de HP">x</button>
      </div>
      <div class="hp-control-panel">
        <div class="hp-display-shell">
          <button type="button" class="hp-action-button hp-heal ${state.hpModalMode === "heal" ? "active" : ""}" data-hp-mode="heal">HEAL</button>
          <label class="hp-quantity-stack">
            <span>QUANTITY</span>
            <input type="number" min="0" step="1" value="${Number(state.hpModalAmount) || 0}" data-hp-amount />
          </label>
          <button type="button" class="hp-action-button hp-damage ${state.hpModalMode === "damage" ? "active" : ""}" data-hp-mode="damage">DAMAGE</button>
        </div>
        <div class="hp-display-grid">
          <div class="hp-display-cell hp-current-cell">
            <span>CURRENT</span>
            <strong>${totalHp}</strong>
          </div>
          <div class="hp-display-divider">/</div>
          <div class="hp-display-cell hp-max-cell">
            <span>MAX</span>
            <strong>${maxHp}</strong>
          </div>
        </div>
        <div class="hp-temp-strip">
          <div class="hp-temp-readout">
            <span>TEMPORARY HP</span>
            <strong>${tempHp > 0 ? tempHp : 0}</strong>
          </div>
          <label class="hp-temp-stack">
            <span>THP AMOUNT</span>
            <input type="number" min="0" step="1" value="${Number(state.hpModalTempAmount) || 0}" data-hp-temp-amount />
          </label>
          <button type="button" class="hp-temp-button ${state.hpModalMode === "temp" ? "active" : ""}" data-hp-mode="temp">GAIN THP</button>
        </div>
      </div>
    </div>
  `;

    els.hpModal.querySelectorAll("[data-close-hp-modal]").forEach((button) => {
      button.addEventListener("click", closeHpModal);
    });
    els.hpModal.querySelectorAll("[data-hp-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.hpModalMode = button.dataset.hpMode;
        applyHpModalAction();
      });
    });
    els.hpModal.querySelector("[data-hp-amount]")?.addEventListener("input", (event) => {
      state.hpModalAmount = Math.max(0, Math.floor(Number(event.target.value) || 0));
    });
    els.hpModal.querySelector("[data-hp-temp-amount]")?.addEventListener("input", (event) => {
      state.hpModalTempAmount = Math.max(0, Math.floor(Number(event.target.value) || 0));
    });
  }

  function renderRestModal() {
    const state = getState();
    const modal = document.getElementById("restModal");
    const backdrop = document.getElementById("restModalBackdrop");
    if (!modal || !backdrop) return;

    if (!state.restModalOpen) {
      modal.hidden = true;
      backdrop.hidden = true;
      modal.innerHTML = "";
      return;
    }

    modal.hidden = false;
    backdrop.hidden = false;

    const content = state.restModalContent || { label: "Rest", description: "" };
    const isShortRest = state.restModalType === "short";
    const className = state.character.class || "fighter";
    const hitDie = state.api.classes?.[className]?.hit_die || 8;
    const level = state.character.level || 1;
    const conMod = deriveProjectedAbilityModifier(state.character, "con");
    const hpPerDie = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
    state.restModalHitDice ??= {};

    let hitDiceHtml = '';
    if (isShortRest) {
      const checkboxes = [];
      for (let i = 0; i < level; i++) {
        const key = 'hd-' + i;
        const spent = i < (Number(state.character.hitDiceUsed) || 0);
        const isChecked = state.restModalHitDice?.[key]?.value ? 'checked' : '';
        checkboxes.push('<label class="hit-die-checkbox ' + (spent ? 'disabled' : '') + '"><input type="checkbox" data-hit-dice="' + key + '" ' + isChecked + ' ' + (spent ? 'disabled' : '') + ' />d' + hitDie + ' (' + hpPerDie + ' HP)</label>');
      }
      const available = availableHitDice();
      hitDiceHtml = '<div class="hit-dice-section"><p class="hit-dice-label">Gastar Hit Dice (' + available + '/' + level + ' disponiveis)</p><div class="hit-dice-controls">' + checkboxes.join('') + '</div></div>';
    }

    modal.innerHTML = '<div class="hp-modal-panel"><div class="hp-modal-head"><div><p class="eyebrow">' + content.label + '</p><h2>Confirmar</h2></div><button type="button" class="icon-button" id="restCloseBtn">x</button></div><div class="hp-control-panel">' + hitDiceHtml + '<div class="rest-actions"><button type="button" class="secondary-button" id="restCancelBtn">Cancelar</button><button type="button" class="primary-button" id="restConfirmBtn">Confirmar</button></div></div></div>';

    const closeBtn = document.getElementById("restCloseBtn");
    const cancelBtn = document.getElementById("restCancelBtn");
    const confirmBtn = document.getElementById("restConfirmBtn");

    if (closeBtn) closeBtn.onclick = () => { cancelRest(); };
    if (cancelBtn) cancelBtn.onclick = () => { cancelRest(); };
    if (confirmBtn) confirmBtn.onclick = () => { confirmRest(); };

    if (isShortRest) {
      document.querySelectorAll("[data-hit-dice]").forEach(cb => {
        cb.onchange = (e) => {
          const key = e.target.dataset.hitDice;
          state.restModalHitDice ??= {};
          state.restModalHitDice[key] = { value: e.target.checked ? 1 : 0 };
        };
      });
    }
  }

  return {
    renderHpModal,
    renderRestModal,
  };
}
