/**
 * Gerenciamento de estado e persistência
 *
 * Funções puras para load/save do estado da aplicação
 */
import type { AppState, Character } from '../../types/state.js';
/**
 * Carrega estado do localStorage ou retorna estado vazio
 */
export declare function loadState(): Partial<AppState>;
/**
 * Salva estado no localStorage
 */
export declare function saveState(state: Partial<AppState>): void;
/**
 * Cria um novo character com valores padrão
 */
export declare function createDefaultCharacter(): Character;
/**
 * Valida se um character está completo
 */
export declare function isCharacterComplete(character: Character): boolean;
/**
 * Cria um novo estado vazio
 */
export declare function createEmptyState(): Partial<AppState>;
//# sourceMappingURL=state-manager.d.ts.map