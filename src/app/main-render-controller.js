/**
 * Main Render Controller
 *
 * Orquestra a renderizacao da tela principal, delegando para app-shell
 * e outros renderers especializados.
 *
 * Nao acessa DOM global diretamente - recebe todas as dependencias via injecao.
 */

export function createMainRenderController({
  getState,
  appShell,
  renderSheet,
  renderCharacterMenu,
  renderHpModal,
  renderRestModal,
}) {
  /**
   * Renderiza a aplicacao completa
   * Ordem: chrome -> menu -> steps -> form -> tabs -> sheet -> modals
   */
  function renderApp() {
    const state = getState();

    // Renderiza cabecalho e status bar
    appShell.renderChrome();

    // Renderiza menu de personagem
    renderCharacterMenu();

    // Renderiza steps de criacao se visivel
    if (state.builderVisible !== false) {
      appShell.renderSteps();
      appShell.renderForm();
    }

    // Renderiza abas
    appShell.renderTabs();

    // Renderiza ficha
    renderSheet();

    // Renderiza modais
    renderHpModal();
    renderRestModal();
  }

  /**
   * Renderiza apenas o chrome (cabecalho e status)
   */
  function renderChromeOnly() {
    appShell.renderChrome();
  }

  /**
   * Renderiza apenas steps
   */
  function renderStepsOnly() {
    appShell.renderSteps();
  }

  /**
   * Renderiza apenas form
   */
  function renderFormOnly() {
    appShell.renderForm();
  }

  /**
   * Renderiza apenas tabs
   */
  function renderTabsOnly() {
    appShell.renderTabs();
  }

  /**
   * Renderiza apenas sheet
   */
  function renderSheetOnly() {
    renderSheet();
  }

  return {
    renderApp,
    renderChromeOnly,
    renderStepsOnly,
    renderFormOnly,
    renderTabsOnly,
    renderSheetOnly,
  };
}
