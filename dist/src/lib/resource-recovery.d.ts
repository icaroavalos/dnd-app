/**
 * Recuperação de recursos (Rage, Wild Shape, Second Wind, etc.)
 *
 * BUG HISTORY: O bug original detectava "all" para Rage ao invés de "1"
 * porque os padrões regex eram muito genéricos e o texto não era normalizado.
 *
 * Com TypeScript, o bug seria pego em tempo de compilação ao misturar
 * "1" (string) com 1 (number).
 */
import type { RecoveryResult } from '../types/recovery.js';
/**
 * Normaliza texto do 5etools removendo markup {@variantrule ...}
 */
export declare function normalizeText(rawText: string): string;
/**
 * Detecta padrão de recuperação no texto da feature
 * Retorna tipado para evitar bugs como "1" vs 1
 */
export declare function parseRecovery(body: string): RecoveryResult;
/**
 * Aplica recuperação de Short Rest em um recurso
 *
 * @param currentUsed - Quantos usos estão gastos atualmente
 * @param recovery - Valor de recuperação ('all', '1', ou number)
 * @returns Novo valor de used após recuperação
 */
export declare function applyShortRestRecovery(currentUsed: number, recovery: RecoveryResult['short']): number;
/**
 * Aplica recuperação de Long Rest em um recurso
 * Sempre reseta para 0 (todos os usos recuperados)
 */
export declare function applyLongRestRecovery(_recovery: RecoveryResult['long']): number;
//# sourceMappingURL=resource-recovery.d.ts.map