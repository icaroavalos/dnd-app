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

    // Render backend error banner if API has error
    const errorBanner = els.app.querySelector('.backend-error-banner');
    if (state.apiError) {
      if (!errorBanner) {
        // Insert banner after topbar
        const banner = document.createElement('div');
        banner.className = 'backend-error-banner';
        banner.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div class="content">
            <strong>Backend indisponível</strong>
            <p>${escapeHtml(state.apiError)}</p>
            <p class="hint">Certifique-se de que o backend está rodando em http://localhost:3100</p>
          </div>
        `;
        els.app.insertBefore(banner, els.app.firstChild);
      }
    } else if (errorBanner) {
      errorBanner.remove();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
        render();
      });
    });
  }

  function renderForm() {
    const state = getState();
    if (state.builderVisible === false) return;
    let html = '';
    if (state.step === 'lineage') html = renderLineageForm();
    else if (state.step === 'abilities') html = renderAbilitiesForm();
    else if (state.step === 'choices') html = renderChoicesForm();
    else if (state.step === 'background') html = renderBackgroundForm();
    else if (state.step === 'leveling') html = renderLevelingForm();
    if (html) els.form.innerHTML = html;
  }

  return {
    render,
    renderChrome,
    renderSteps,
    renderForm,
    renderTabs,
  };
}
