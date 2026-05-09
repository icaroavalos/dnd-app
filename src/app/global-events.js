export function createGlobalEvents({
  getState,
  els,
  document,
  persist,
  renderChrome,
  toggleCharacterMenu,
  closeCharacterMenu,
  closeHpModal,
  cancelRest,
}) {
  function bindGlobalEvents() {
    els.saveButton.addEventListener("click", () => {
      const state = getState();
      persist();
      state.dataStatus = state.dataStatus.includes("API") ? "salvo + API" : "salvo local";
      renderChrome();
    });

    els.characterMenuButton.addEventListener("click", () => {
      toggleCharacterMenu();
    });

    els.menuBackdrop.addEventListener("click", () => {
      closeCharacterMenu();
    });

    els.hpModalBackdrop.addEventListener("click", closeHpModal);

    document.getElementById("restModalBackdrop")?.addEventListener("click", () => {
      if (getState().restModalOpen) cancelRest();
    });

    document.addEventListener("keydown", (event) => {
      const state = getState();
      if (event.key === "Escape" && state.hpModalOpen) closeHpModal();
      if (event.key === "Escape" && state.restModalOpen) cancelRest();
    });
  }

  return {
    bindGlobalEvents,
  };
}
