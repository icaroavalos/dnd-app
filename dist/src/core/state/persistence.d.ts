/**
 * Persistence and API hydration logic
 */
import type { AppState, Character } from '../../types/state.js';
export declare function loadState(defaultState: AppState): AppState;
export declare function saveState(state: AppState): void;
/**
 * Saves active character ID to localStorage
 */
export declare function saveActiveCharacterId(id: string): void;
/**
 * Loads active character ID from localStorage
 */
export declare function loadActiveCharacterId(): string | null;
/**
 * Saves character to backend if enabled, otherwise localStorage
 */
export declare function saveCharacterToBackend(character: Character & {
    id?: string;
}): Promise<Character & {
    id: string;
}>;
/**
 * Loads character from backend or localStorage
 */
export declare function loadCharacterFromBackend(id: string): Promise<(Character & {
    id: string;
}) | null>;
/**
 * Lists all characters from backend or localStorage
 */
export declare function listAllCharacters(): Promise<Array<Character & {
    id: string;
}>>;
/**
 * Deletes character from backend or localStorage
 */
export declare function deleteCharacterFromBackend(id: string): Promise<void>;
export declare function fetchJson<T = any>(url: string): Promise<T>;
//# sourceMappingURL=persistence.d.ts.map