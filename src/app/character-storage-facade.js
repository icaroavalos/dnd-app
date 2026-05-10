/**
 * Character Storage Facade
 *
 * Facade para persistencia de personagens com fallback automatico:
 * 1. Tenta API backend primeiro
 * 2. Fallback para localStorage se API falhar
 *
 * Mantem compatibilidade com codigo existente.
 */

import {
  listCharacters as apiListCharacters,
  getCharacter as apiGetCharacter,
  saveCharacter as apiSaveCharacter,
  deleteCharacter as apiDeleteCharacter,
  enableBackendStorage,
  isBackendStorageEnabled,
} from '../../dist/src/lib/api-character-storage-client.js';

const STORAGE_KEY = 'dnd5e-characters';
const ACTIVE_CHAR_KEY = 'dnd5e-active-character-id';

export function createCharacterStorageFacade({
  getActiveCharacterId,
  setActiveCharacterId,
  getCharacters,
  setCharacters,
} = {}) {
  // Enable backend storage by default
  enableBackendStorage(true);

  /**
   * Carrega todos os personagens
   * Tenta API primeiro, fallback para localStorage
   */
  async function loadAll() {
    try {
      if (isBackendStorageEnabled()) {
        // Get list of characters (summaries)
        const summaries = await apiListCharacters();
        if (summaries && summaries.length > 0) {
          // Fetch full records for each character
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
          const characters = fullCharacters.filter(Boolean);
          // Save to localStorage as cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
          return characters;
        }
      }
    } catch (error) {
      console.warn('API load failed, using localStorage fallback:', error.message);
    }

    // Fallback para localStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Failed to parse localStorage characters:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Salva um personagem
   * Tenta API primeiro, fallback para localStorage
   */
  async function save(character) {
    if (!character || !character.id) {
      throw new Error('Character must have an id');
    }

    try {
      if (isBackendStorageEnabled()) {
        await apiSaveCharacter(character);
      }
      // Update localStorage (always)
      const current = await loadAll();
      const updated = current.filter(c => c.id !== character.id);
      updated.push(character);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return character;
    } catch (error) {
      console.warn('API save failed, using localStorage fallback:', error.message);
      const current = await loadAll();
      const updated = current.filter(c => c.id !== character.id);
      updated.push(character);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return character;
    }
  }

  /**
   * Deleta um personagem
   * Tenta API primeiro, fallback para localStorage
   */
  async function deleteCharacter(characterId) {
    if (!characterId) {
      throw new Error('Character ID is required');
    }

    try {
      if (isBackendStorageEnabled()) {
        await apiDeleteCharacter(characterId);
      }
    } catch (error) {
      console.warn('API delete failed, using localStorage fallback:', error.message);
    }

    // Remove do localStorage
    const current = await loadAll();
    const updated = current.filter(c => c.id !== characterId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Se o personagem deletado for o ativo, limpa
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
   * Carrega um personagem por ID
   */
  async function loadById(characterId) {
    try {
      if (isBackendStorageEnabled()) {
        const character = await apiGetCharacter(characterId);
        if (character) {
          // Cache it
          const current = await loadAll();
          const updated = current.filter(c => c.id !== characterId);
          updated.push(character);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return character;
        }
      }
    } catch (error) {
      console.warn('API load by id failed, using localStorage fallback:', error.message);
    }

    // Fallback to localStorage
    const all = await loadAll();
    return all.find(c => c.id === characterId) || null;
  }

  /**
   * Sincroniza localStorage com estado atual
   */
  function syncLocalState(characters) {
    if (characters && Array.isArray(characters)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    }
  }

  /**
   * Limpa todos os dados locais
   */
  function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
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
    enableBackendStorage: (enabled) => enableBackendStorage(enabled),
    isBackendStorageEnabled: () => isBackendStorageEnabled(),
  };
}

// Legacy exports for compatibility
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
