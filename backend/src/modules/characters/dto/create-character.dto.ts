import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para criação de um novo personagem.
 *
 * @example
 * {
 *   id: "char-001",
 *   name: "Fighter",
 *   lineageId: "human",
 *   backgroundId: "soldier",
 *   abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
 *   classes: [{ classId: "fighter", level: 1 }]
 * }
 */
export interface CreateCharacterDto extends Omit<CharacterRecord, 'id'> {
  /** ID único do personagem (opcional, gera UUID se não fornecido) */
  id?: string;
}
