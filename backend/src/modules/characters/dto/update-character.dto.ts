import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para atualização de um personagem existente.
 *
 * @example
 * {
 *   id: "char-001",
 *   character: { ...CharacterRecord }
 * }
 */
export interface UpdateCharacterDto {
  /** ID do personagem a atualizar */
  id: string;
  /** Dados atualizados do personagem (deve incluir id) */
  character: CharacterRecord;
}
