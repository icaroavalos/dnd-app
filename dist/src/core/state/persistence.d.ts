/**
 * Persistence and API hydration logic
 */
import type { AppState } from '../../types/state.js';
export declare function loadState(defaultState: AppState): AppState;
export declare function saveState(state: AppState): void;
export declare function fetchJson<T = any>(url: string): Promise<T>;
//# sourceMappingURL=persistence.d.ts.map