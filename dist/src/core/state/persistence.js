import { saveCharacter, getCharacter, listCharacters, deleteCharacter, isBackendStorageEnabled, } from '../../lib/api-character-storage-client.js';
const STORAGE_KEY = "dnd-sheet-builder";
const ACTIVE_CHAR_ID_KEY = "dnd-active-character-id";
export function loadState(defaultState) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved)
        return { ...defaultState };
    try {
        return { ...defaultState, ...JSON.parse(saved) };
    }
    catch {
        return { ...defaultState };
    }
}
export function saveState(state) {
    const savedState = { ...state };
    // Don't persist big API data or volatile derived state
    delete savedState.api;
    delete savedState.derived;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
}
/**
 * Saves active character ID to localStorage
 */
export function saveActiveCharacterId(id) {
    localStorage.setItem(ACTIVE_CHAR_ID_KEY, id);
}
/**
 * Loads active character ID from localStorage
 */
export function loadActiveCharacterId() {
    return localStorage.getItem(ACTIVE_CHAR_ID_KEY);
}
/**
 * Saves character to backend if enabled, otherwise localStorage
 */
export async function saveCharacterToBackend(character) {
    if (isBackendStorageEnabled()) {
        try {
            const saved = await saveCharacter(character);
            return saved;
        }
        catch (error) {
            console.warn('Backend save failed, falling back to localStorage:', error);
        }
    }
    // Fallback: localStorage
    const chars = loadCharactersFromLocal();
    const charWithId = character.id ? character : { ...character, id: String(Date.now()) };
    if (character.id) {
        const index = chars.findIndex(c => c.id === character.id);
        if (index !== -1) {
            chars[index] = charWithId;
        }
        else {
            chars.push(charWithId);
        }
    }
    else {
        chars.push(charWithId);
    }
    localStorage.setItem('dnd-characters', JSON.stringify(chars));
    return charWithId;
}
/**
 * Loads character from backend or localStorage
 */
export async function loadCharacterFromBackend(id) {
    if (isBackendStorageEnabled()) {
        try {
            const character = await getCharacter(id);
            if (character) {
                return character;
            }
        }
        catch (error) {
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
export async function listAllCharacters() {
    if (isBackendStorageEnabled()) {
        try {
            const summaries = await listCharacters();
            // Backend returns summaries, need to fetch full records
            const fullChars = await Promise.all(summaries.map(async (s) => {
                const full = await getCharacter(s.id);
                return full;
            }));
            return fullChars.filter(Boolean);
        }
        catch (error) {
            console.warn('Backend list failed, falling back to localStorage:', error);
        }
    }
    return loadCharactersFromLocal();
}
/**
 * Deletes character from backend or localStorage
 */
export async function deleteCharacterFromBackend(id) {
    if (isBackendStorageEnabled()) {
        try {
            await deleteCharacter(id);
            return;
        }
        catch (error) {
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
function loadCharactersFromLocal() {
    try {
        const stored = localStorage.getItem('dnd-characters');
        if (stored) {
            return JSON.parse(stored);
        }
    }
    catch (error) {
        console.warn('Failed to load characters from localStorage:', error);
    }
    return [];
}
export async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return response.json();
}
//# sourceMappingURL=persistence.js.map