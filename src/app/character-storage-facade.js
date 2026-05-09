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
  loadCharactersFromApi,
  saveCharacterToApi,
  deleteCharacterFromApi,
} from '../lib/api-character-storage-client.js';

const STORAGE_KEY = 'dnd5e-characters';
const ACTIVE_CHAR_KEY = 'dnd5e-active-character-id';

export function createCharacterStorageFacade({
  getActiveCharacterId,
  setActiveCharacterId,
  getCharacters,
  setCharacters,
} = {}) {
  /**
   * Carrega todos os personagens
   * Tenta API primeiro, fallback para localStorage
   */
  async function loadAll() {
    try {
      const apiCharacters = await loadCharactersFromApi();
      if (apiCharacters && apiCharacters.length >= 0) {
        // Salva no localStorage como cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiCharacters));
        return apiCharacters;
      }
    } catch (error) {
      // API falhou, fallback para localStorage
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
      // Tenta salvar na API
      await saveCharacterToApi(character);
      // Atualiza localStorage com dados da API
      const current = await loadAll();
      const updated = current.filter(c => c.id !== character.id);
      updated.push(character);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return character;
    } catch (error) {
      // API falhou, fallback para localStorage
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
      // Tenta deletar da API
      await deleteCharacterFromApi(characterId);
    } catch (error) {
      // API falhou, fallback para localStorage
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
