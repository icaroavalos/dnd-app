import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para requisição de recuperação de munição.
 * Usado quando um personagem coleta/recupera munição de uma arma.
 */
export interface RecoverAmmoRequestDto {
  /** Personagem a ser atualizado */
  character: CharacterRecord;
  /** ID da arma instanciada (ex: 'item-inst-longbow') */
  weaponItemId: string;
  /** Quantidade de munição a recuperar (padrão: 1, mínimo: 1) */
  amount?: number;
}
