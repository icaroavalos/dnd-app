/**
 * Persistence and API hydration logic
 *
 * Nota: Este modulo lida apenas com preferencias de UI e estado da sessao.
 * Dados canonicos (personagens) sao persistidos via backend apenas.
 * localStorage e usado apenas para:
 * - Preferencias de UI (tema, layout, expansao de secoes)
 * - ID do ultimo personagem selecionado (para restaurar sessao)
 */
import type { AppState, Character } from '../../types/state.js';
import {
  saveCharacter as apiSaveCharacter,
  getCharacter as apiGetCharacter,
  listCharacters as apiListCharacters,
  deleteCharacter as apiDeleteCharacter,
  CharacterStorageError,
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
  // Nao persistir dados de API ou estado derivado
  delete savedState.api;
  delete savedState.derived;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
}

/**
 * Salva ID do personagem ativo no localStorage (apenas preferencia de sessao)
 */
export function saveActiveCharacterId(id: string): void {
  localStorage.setItem(ACTIVE_CHAR_ID_KEY, id);
}

/**
 * Carrega ID do personagem ativo do localStorage (apenas preferencia de sessao)
 */
export function loadActiveCharacterId(): string | null {
  return localStorage.getItem(ACTIVE_CHAR_ID_KEY);
}

/**
 * Salva personagem no backend (sem fallback local)
 * Lanca CharacterStorageError se backend falhar
 */
export async function saveCharacterToBackend(character: Character & { id?: string }): Promise<Character & { id: string }> {
  const saved = await apiSaveCharacter(character as any);
  return saved as any;
}

/**
 * Carrega personagem do backend (sem fallback local)
 * Lanca CharacterStorageError se backend falhar
 */
export async function loadCharacterFromBackend(id: string): Promise<(Character & { id: string }) | null> {
  const character = await apiGetCharacter(id);
  return character as any;
}

/**
 * Lista todos os personagens do backend (sem fallback local)
 * Lanca CharacterStorageError se backend falhar
 */
export async function listAllCharacters(): Promise<Array<Character & { id: string }>> {
  const summaries = await apiListCharacters();
  if (!summaries || summaries.length === 0) {
    return [];
  }

  const fullChars = await Promise.all(
    summaries.map(async (s) => {
      const full = await apiGetCharacter(s.id!);
      return full as any;
    })
  );
  return fullChars.filter(Boolean) as any;
}

/**
 * Deleta personagem do backend (sem fallback local)
 * Lanca CharacterStorageError se backend falhar
 */
export async function deleteCharacterFromBackend(id: string): Promise<void> {
  await apiDeleteCharacter(id);
}

export async function fetchJson<T = any>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  return response.json();
}
