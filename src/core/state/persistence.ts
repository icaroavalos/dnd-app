/**
 * Persistence and API hydration logic
 */
import type { AppState, Character } from '../../types/state.js';
import {
  saveCharacter,
  getCharacter,
  listCharacters,
  deleteCharacter,
  isBackendStorageEnabled,
} from '../../lib/api-character-storage-client.js';

const STORAGE_KEY = "dnd-sheet-builder";
const ACTIVE_CHAR_ID_KEY = "dnd-active-character-id";

export function loadState(defaultState: AppState): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { ...defaultState };
  try {
    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return { ...defaultState };
  }
}

export function saveState(state: AppState): void {
  const savedState = { ...state } as any;
  // Don't persist big API data or volatile derived state
  delete savedState.api;
  delete savedState.derived;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
}

/**
 * Saves active character ID to localStorage
 */
export function saveActiveCharacterId(id: string): void {
  localStorage.setItem(ACTIVE_CHAR_ID_KEY, id);
}

/**
 * Loads active character ID from localStorage
 */
export function loadActiveCharacterId(): string | null {
  return localStorage.getItem(ACTIVE_CHAR_ID_KEY);
}

/**
 * Saves character to backend if enabled, otherwise localStorage
 */
export async function saveCharacterToBackend(character: Character & { id?: string }): Promise<Character & { id: string }> {
  if (isBackendStorageEnabled()) {
    try {
      const saved = await saveCharacter(character as any);
      return saved as any;
    } catch (error) {
      console.warn('Backend save failed, falling back to localStorage:', error);
    }
  }

  // Fallback: localStorage
  const chars = loadCharactersFromLocal();
  const charWithId = character.id ? character : { ...character, id: String(Date.now()) };

  if (character.id) {
    const index = chars.findIndex(c => c.id === character.id);
    if (index !== -1) {
      chars[index] = charWithId as any;
    } else {
      chars.push(charWithId as any);
    }
  } else {
    chars.push(charWithId as any);
  }

  localStorage.setItem('dnd-characters', JSON.stringify(chars));
  return charWithId as any;
}

/**
 * Loads character from backend or localStorage
 */
export async function loadCharacterFromBackend(id: string): Promise<(Character & { id: string }) | null> {
  if (isBackendStorageEnabled()) {
    try {
      const character = await getCharacter(id);
      if (character) {
        return character as any;
      }
    } catch (error) {
      console.warn('Backend load failed, falling back to localStorage:', error);
    }
  }

  // Fallback: localStorage
  const chars = loadCharactersFromLocal();
  return chars.find(c => c.id === id) || null;
}

/**
 * Lists all characters from backend or localStorage
 */
export async function listAllCharacters(): Promise<Array<Character & { id: string }>> {
  if (isBackendStorageEnabled()) {
    try {
      const summaries = await listCharacters();
      // Backend returns summaries, need to fetch full records
      const fullChars = await Promise.all(
        summaries.map(async (s) => {
          const full = await getCharacter(s.id!);
          return full as any;
        })
      );
      return fullChars.filter(Boolean) as any;
    } catch (error) {
      console.warn('Backend list failed, falling back to localStorage:', error);
    }
  }

  return loadCharactersFromLocal();
}

/**
 * Deletes character from backend or localStorage
 */
export async function deleteCharacterFromBackend(id: string): Promise<void> {
  if (isBackendStorageEnabled()) {
    try {
      await deleteCharacter(id);
      return;
    } catch (error) {
      console.warn('Backend delete failed, falling back to localStorage:', error);
    }
  }

  // Fallback: localStorage
  const chars = loadCharactersFromLocal();
  const filtered = chars.filter(c => c.id !== id);
  localStorage.setItem('dnd-characters', JSON.stringify(filtered));
}

/**
 * Loads characters from localStorage
 */
function loadCharactersFromLocal(): Array<Character & { id: string }> {
  try {
    const stored = localStorage.getItem('dnd-characters');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load characters from localStorage:', error);
  }
  return [];
}

export async function fetchJson<T = any>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  return response.json();
}
