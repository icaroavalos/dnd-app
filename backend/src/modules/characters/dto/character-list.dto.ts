import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para listagem de personagens.
 *
 * @example
 * {
 *   characters: [
 *     { id: "char-001", name: "Fighter", level: 1, classes: [...] },
 *     { id: "char-002", name: "Wizard", level: 3, classes: [...] }
 *   ],
 *   total: 2
 * }
 */
export interface CharacterListDto {
  /** Lista de resumos de personagens */
  characters: CharacterSummaryDto[];
  /** Total de personagens */
  total: number;
}

/**
 * Resumo de um personagem para listagem.
 * Contém apenas dados necessários para listagem/preview.
 */
export interface CharacterSummaryDto {
  /** ID único do personagem */
  id: string;
  /** Nome do personagem */
  name: string;
  /** Nível total do personagem */
  level: number;
  /** Classe principal */
  primaryClass: string;
  /** Linhagem */
  lineageId: string;
  /** Background */
  backgroundId: string;
  /** Dados completos (para uso imediato) */
  fullCharacter?: CharacterRecord;
}
