import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para requisição de uso de recurso limitado.
 * Exemplo: usar Second Wind, Action Surge, etc.
 */
export interface UseResourceRequestDto {
  /** Personagem a ser atualizado */
  character: CharacterRecord;
  /** ID do recurso a ser usado (ex: 'second_wind', 'action_surge') */
  resourceId: string;
  /** Quantidade a gastar (padrão: 1, mínimo: 1) */
  amount?: number;
}
