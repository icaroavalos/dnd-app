/**
 * Character Storage Facade
 *
 * Facade para persistencia de personagens via backend.
 * Sem fallback local para dados canonicos - backend e obrigatorio.
 *
 * localStorage e usado apenas para:
 * - Preferencias de UI (tema, layout)
 * - Ultimo personagem selecionado (apenas ID, para restaurar sessao)
 */

import {
  listCharacters as apiListCharacters,
  getCharacter as apiGetCharacter,
  saveCharacter as apiSaveCharacter,
  deleteCharacter as apiDeleteCharacter,
  CharacterStorageError,
} from '../../dist/src/lib/api-character-storage-client.js';

const ACTIVE_CHAR_KEY = 'dnd5e-active-character-id';

export function createCharacterStorageFacade({
  getActiveCharacterId,
  setActiveCharacterId,
  getCharacters,
  setCharacters,
} = {}) {
  /**
   * Carrega todos os personagens (apenas backend, sem fallback)
   */
  async function loadAll() {
    const summaries = await apiListCharacters();
    if (!summaries || summaries.length === 0) {
      return [];
    }

    const fullCharacters = await Promise.all(
      summaries.map(async (summary) => {
        try {
          return await apiGetCharacter(summary.id);
        } catch (e) {
          console.warn(`Failed to fetch character ${summary.id}:`, e);
          return null;
        }
      })
    );

    return fullCharacters.filter(Boolean);
  }

  /**
   * Salva um personagem (apenas backend, sem fallback)
   */
  async function save(character) {
    if (!character || !character.id) {
      throw new Error('Character must have an id');
    }

    const saved = await apiSaveCharacter(character);
    return saved;
  }

  /**
   * Deleta um personagem (apenas backend, sem fallback)
   */
  async function deleteCharacter(characterId) {
    if (!characterId) {
      throw new Error('Character ID is required');
    }

    await apiDeleteCharacter(characterId);

    // Se o personagem deletado for o ativo, limpa o ID armazenado
    if (getActiveCharacterId && getActiveCharacterId() === characterId) {
      localStorage.removeItem(ACTIVE_CHAR_KEY);
    }
  }

  /**
   * Lista todos os personagens (alias para loadAll)
   */
  async function list() {
    return loadAll();
  }

  /**
   * Carrega um personagem por ID (apenas backend, sem fallback)
   */
  async function loadById(characterId) {
    const character = await apiGetCharacter(characterId);
    return character;
  }

  /**
   * Sincroniza estado local (apenas para cache, nao persistencia canonica)
   */
  function syncLocalState(characters) {
    // Nao salva mais no localStorage para dados canonicos
    // Esta funcao e mantida para compatibilidade
  }

  /**
   * Limpa ID do personagem ativo (apenas preferencia, nao dados)
   */
  function clearLocal() {
    localStorage.removeItem(ACTIVE_CHAR_KEY);
  }

  return {
    loadAll,
    loadById,
    save,
    delete: deleteCharacter,
    list,
    syncLocalState,
    clearLocal,
    CharacterStorageError,
  };
}

// Legacy exports for compatibility - agora lancam erro se backend falhar
export const loadAll = async () => {
  const facade = createCharacterStorageFacade();
  return facade.loadAll();
};

export const save = async (character) => {
  const facade = createCharacterStorageFacade();
  return facade.save(character);
};

export const deleteCharacter = async (characterId) => {
  const facade = createCharacterStorageFacade();
  return facade.delete(characterId);
};

export const list = async () => {
  const facade = createCharacterStorageFacade();
  return facade.list();
};

export { CharacterStorageError };
