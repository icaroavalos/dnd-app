import type { CharacterRecord, DerivedAction } from '@shared/contracts';

/**
 * DTO para requisição de derivação de ações.
 * Calcula as ações disponíveis para um personagem com base no seu estado atual.
 */
export interface DeriveActionsRequestDto {
  /** Personagem para o qual derivar ações */
  character: CharacterRecord;
}

/**
 * DTO para resposta de derivação de ações.
 * Lista de ações derivadas com estado de disponibilidade.
 */
export interface DeriveActionsResponseDto {
  /** Lista de ações derivadas para o personagem */
  actions: DerivedAction[];
}
