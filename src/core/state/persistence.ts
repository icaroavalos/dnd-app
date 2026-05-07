/**
 * Persistence and API hydration logic
 */
import type { AppState, Character } from '../../types/state.js';

const STORAGE_KEY = "dnd-sheet-builder";

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

export async function fetchJson<T = any>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  return response.json();
}
