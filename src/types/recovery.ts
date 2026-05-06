/**
 * Tipos para recuperação de recursos (Rage, Wild Shape, etc.)
 * Bug do Rage: "1" (string) vs 1 (number) causava recovery incorreta
 */

export type RecoveryValue = 'all' | '1' | number;

export interface RecoveryResult {
  short?: RecoveryValue;
  long?: RecoveryValue;
}

export interface ResourceText {
  raw: string;
  normalized: string;
}
