export function createAppShell({
  getState,
  els,
  steps,
  tabs,
  persist,
  validateStepRange,
  bindFormEvents,
  renderNameField,
  renderLineageForm,
  renderAbilitiesForm,
  renderChoicesForm,
  renderBackgroundForm,
  renderLevelingForm,
  renderCharacterMenu,
  renderSheet,
  renderHpModal,
  renderRestModal,
}) {
  function render() {
    const state = getState();
    renderChrome();
    renderCharacterMenu();
    if (state.builderVisible !== false) {
      renderSteps();
      renderForm();
    }
    renderTabs();
    renderSheet();
    renderHpModal();

    renderRestModal();
  }

  function renderChrome() {
    const state = getState();
    els.app.classList.toggle("sheet-only", state.builderVisible === false);
    els.topbarName.textContent = state.character.name || "Nova Ficha";
    els.syncState.textContent = state.dataStatus;
  }

  function renderSteps() {
    const state = getState();
    if (state.levelUpMode) {
      els.stepNav.innerHTML = `<button type="button" class="step-button active" data-step="leveling">Subir nivel</button>`;
      return;
    }
    els.stepNav.innerHTML = steps.map(([id, label]) => (
      `<button type="button" class="step-button ${state.step === id ? "active" : ""}" data-step="${id}">${label}</button>`
    )).join("");
    els.stepNav.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const currentIndex = steps.findIndex(([id]) => id === state.step);
        const nextIndex = steps.findIndex(([id]) => id === button.dataset.step);
        if (nextIndex > currentIndex && !validateStepRange(currentIndex, nextIndex)) {
          persist();
          render();
          return;
        }
        state.validationMessage = "";
        state.step = button.dataset.step;
        persist();
        render();
      });
    });
  }

  function renderTabs() {
    const state = getState();
    els.sheetTabs.innerHTML = tabs.map(([id, label]) => (
      `<button type="button" class="tab-button ${state.tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`
    )).join("");
    els.sheetTabs.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.tab = button.dataset.tab;
        // Clear spell selection when entering spells tab to avoid auto-opening card
        if (state.tab === 'spells') {
          state.selectedSpell = '';
        }
        persist();
        renderSheet();
        renderTabs();
      });
    });
  }

  function renderForm() {
    const state = getState();
    if (state.levelUpMode) {
      state.step = "leveling";
      els.form.innerHTML = renderLevelingForm();
      bindFormEvents();
      return;
    }
    const renderers = {
      lineage: renderLineageForm,
      abilities: renderAbilitiesForm,
      choices: renderChoicesForm,
      background: renderBackgroundForm,
      leveling: renderLevelingForm,
    };
    const renderer = renderers[state.step];
    const html = renderer();

    els.form.innerHTML = `${state.step === "lineage" ? renderNameField() : ""}${html}`;
    bindFormEvents();
  }

  return {
    render,
    renderChrome,
    renderSteps,
    renderTabs,
    renderForm,
  };
}
