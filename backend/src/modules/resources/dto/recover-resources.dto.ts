import type { CharacterRecord } from '@shared/contracts';

/**
 * Tipo para tipo de recuperação (curta ou longa descanso).
 */
export type RecoveryType = 'short_rest' | 'long_rest';

/**
 * DTO para requisição de recuperação de recursos.
 * Exemplo: recuperar Second Wind após short rest, spell slots após long rest.
 */
export interface RecoverResourcesRequestDto {
  /** Personagem a ser atualizado */
  character: CharacterRecord;
  /** Tipo de descanso: 'short_rest' ou 'long_rest' */
  recovery: RecoveryType;
}
