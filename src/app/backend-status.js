/**
 * Backend Status - Gerencia estado visual quando backend está indisponível
 *
 * Mostra mensagem clara e bloqueia selects de classe/species/background
 * quando o catálogo de regras falha.
 */

export function createBackendStatus({ getState, setState }) {
  /**
   * Verifica se API está carregada e disponível
   */
  function isApiReady() {
    const state = getState();
    return !!(
      state.api?.source?.classOptions?.length > 0 &&
      state.api?.source?.raceOptions?.length > 0 &&
      state.api?.source?.backgroundOptions?.length > 0
    );
  }

  /**
   * Verifica se há erro de backend
   */
  function hasApiError() {
    const state = getState();
    return state.apiError !== undefined && state.apiError !== null;
  }

  /**
   * Obtém mensagem de erro
   */
  function getErrorMessage() {
    const state = getState();
    return state.apiError || 'Backend indisponível';
  }

  /**
   * Renderiza banner de erro do backend
   */
  function renderErrorBanner() {
    const state = getState();
    if (!state.apiError) return '';

    return `
      <div class="backend-error-banner">
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
      </div>
    `;
  }

  /**
   * Renderiza select bloqueado com mensagem de erro
   */
  function renderDisabledSelect(options, value, name, id) {
    const errorText = getErrorMessage();
    const placeholder = `Aguardando backend...`;

    return `
      <div class="select-disabled-wrapper">
        <select disabled class="select-disabled">
          <option value="">${placeholder}</option>
        </select>
        <p class="select-disabled-message">
          <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          ${errorText}
        </p>
      </div>
    `;
  }

  /**
   * Renderiza select normal ou bloqueado
   */
  function renderSelectOrDisabled(options, value, name, id, locked) {
    if (!isApiReady()) {
      return renderDisabledSelect(options, value, name, id);
    }

    // Renderiza select normal
    return renderNormalSelect(options, value, name, id, locked);
  }

  /**
   * Renderiza select normal
   */
  function renderNormalSelect(options, value, name, id, locked) {
    const opts = options.map(([val, label]) => {
      const selected = value === val ? 'selected' : '';
      const disabled = locked ? 'disabled' : '';
      return `<option value="${escapeHtml(val)}" ${selected} ${disabled}>${escapeHtml(label)}</option>`;
    }).join('');

    const disabledAttr = locked ? 'disabled' : '';

    return `<select name="${escapeHtml(name)}" id="${escapeHtml(id)}" ${disabledAttr}>${opts}</select>`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    isApiReady,
    hasApiError,
    getErrorMessage,
    renderErrorBanner,
    renderDisabledSelect,
    renderSelectOrDisabled,
  };
}
