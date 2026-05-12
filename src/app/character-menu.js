export function createCharacterMenu({
  getState,
  els,
  escapeHtml,
  titleCase,
  createNewCharacter,
  closeCharacterMenu,
  startLevelUpAssistant,
  persist,
  render,
  requestDeleteCharacter,
  switchCharacter,
  deleteCharacter,
  cancelDeleteCharacter,
}) {
  function renderCharacterMenu() {
    const state = getState();
    const characterToDelete = state.deleteConfirmId ? state.characters.find(c => c.id === state.deleteConfirmId) : null;
    const isConfirming = !!characterToDelete;

    els.characterMenu.innerHTML = `
    <div class="character-menu-head">
      <div>
        <p class="eyebrow">Fichas</p>
        <h2>${escapeHtml(state.character.name || "Nova Ficha")}</h2>
      </div>
      <button type="button" class="icon-button" data-close-menu aria-label="Fechar menu">x</button>
    </div>
    <div class="menu-actions">
      <button type="button" class="primary-button" data-menu-new>Nova ficha</button>
      <button type="button" class="secondary-button" data-menu-level-up ${state.character.level >= 20 ? "disabled" : ""}>Subir nivel</button>
      ${state.builderVisible === false ? `<button type="button" class="secondary-button" data-menu-toggle-builder>Mostrar criador</button>` : ""}
      <button type="button" class="danger-button" data-menu-delete-active>Excluir ficha</button>
    </div>
    ${isConfirming ? `
      <div class="delete-confirmation-card">
        <p class="delete-confirmation-title">Tem certeza que deseja excluir?</p>
        <p class="delete-confirmation-character">
          <strong>${escapeHtml(characterToDelete.name || "Sem nome")}</strong> -
          ${titleCase(characterToDelete.subrace || characterToDelete.race)} ${titleCase(characterToDelete.class)} ${characterToDelete.level}
        </p>
        <p class="delete-confirmation-warning">Esta ação não pode ser desfeita.</p>
        <div class="delete-confirmation-actions">
          <button type="button" class="secondary-button" data-cancel-delete>Cancelar</button>
          <button type="button" class="danger-button" data-confirm-delete>Excluir</button>
        </div>
      </div>
    ` : ''}
    <div class="menu-current">
      <span>Nivel ${state.character.level}</span>
      <strong>${titleCase(state.character.subrace || state.character.race)} ${titleCase(state.character.class)}</strong>
    </div>
    <div class="roster-list menu-roster">
      ${state.characters.map((character) => `
        <button type="button" class="roster-button ${character.id === state.activeCharacterId ? "active" : ""}" data-menu-roster-id="${character.id}">
          <span class="roster-main"><strong>${escapeHtml(character.name || "Nova Ficha")}</strong><span>${titleCase(character.subrace || character.race)} ${titleCase(character.class)} ${character.level}</span></span>
          <span class="delete-character" data-menu-delete-id="${character.id}" aria-label="Excluir ficha">x</span>
        </button>
      `).join("")}
    </div>
  `;
    bindCharacterMenuEvents();
  }

  function bindCharacterMenuEvents() {
    const state = getState();
    els.characterMenu.querySelector("[data-close-menu]")?.addEventListener("click", closeCharacterMenu);
    els.characterMenu.querySelector("[data-menu-new]")?.addEventListener("click", () => {
      createNewCharacter();
      closeCharacterMenu();
    });
    els.characterMenu.querySelector("[data-menu-level-up]")?.addEventListener("click", async () => {
      await startLevelUpAssistant();
      await persist();
      render();
      closeCharacterMenu();
    });
    els.characterMenu.querySelector("[data-menu-toggle-builder]")?.addEventListener("click", () => {
      state.builderVisible = state.builderVisible === false;
      persist();
      render();
      closeCharacterMenu();
    });
    els.characterMenu.querySelector("[data-menu-delete-active]")?.addEventListener("click", () => {
      requestDeleteCharacter(state.activeCharacterId);
    });
    els.characterMenu.querySelectorAll("[data-menu-roster-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        await switchCharacter(button.dataset.menuRosterId);
        closeCharacterMenu();
      });
    });
    els.characterMenu.querySelectorAll("[data-menu-delete-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        requestDeleteCharacter(button.dataset.menuDeleteId);
      });
    });
    const confirmBtn = els.characterMenu.querySelector("[data-confirm-delete]");
    const cancelBtn = els.characterMenu.querySelector("[data-cancel-delete]");
    confirmBtn?.addEventListener("click", async () => {
      if (state.deleteConfirmId) {
        await deleteCharacter(state.deleteConfirmId);
      }
    });
    cancelBtn?.addEventListener("click", () => {
      cancelDeleteCharacter();
    });
  }

  function toggleCharacterMenu() {
    const willOpen = els.characterMenu.hidden;
    els.characterMenu.hidden = !willOpen;
    els.menuBackdrop.hidden = !willOpen;
    els.characterMenuButton.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) renderCharacterMenu();
  }

  function closeMenu() {
    els.characterMenu.hidden = true;
    els.menuBackdrop.hidden = true;
    els.characterMenuButton.setAttribute("aria-expanded", "false");
  }

  return {
    renderCharacterMenu,
    bindCharacterMenuEvents,
    toggleCharacterMenu,
    closeCharacterMenu: closeMenu,
  };
}
