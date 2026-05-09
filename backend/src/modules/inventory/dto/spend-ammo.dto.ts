import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para requisição de gasto de munição.
 * Usado quando um personagem atira com uma arma que requer munição.
 */
export interface SpendAmmoRequestDto {
  /** Personagem a ser atualizado */
  character: CharacterRecord;
  /** ID da arma instanciada (ex: 'item-inst-longbow') */
  weaponItemId: string;
  /** Quantidade de munição a gastar (padrão: 1, mínimo: 1) */
  amount?: number;
}
