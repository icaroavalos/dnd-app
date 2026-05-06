/**
 * Backgrounds default - Acolyte e Soldier
 *
 * Este arquivo registra os backgrounds iniciais no sistema.
 * Para adicionar novos backgrounds, importe BackgroundRegistry e registre no init.
 */
import type { BackgroundData } from '../../types/background';
/**
 * Lista de backgrounds padroes disponiveis
 */
export declare const DEFAULT_BACKGROUNDS: BackgroundData[];
/**
 * Inicializa o registro de backgrounds com os defaults
 */
export declare function initializeDefaultBackgrounds(): void;
/**
 * Retorna os backgrounds iniciais para uso imediato
 */
export declare function getInitialBackgrounds(): BackgroundData[];
export default DEFAULT_BACKGROUNDS;
//# sourceMappingURL=backgrounds.d.ts.map