import type { CharacterRecord } from '@shared/contracts';

/**
 * DTO para atualização de personagem.
 * Todos os campos são opcionais (Partial).
 */
export type UpdateCharacterDto = Partial<CharacterRecord>;
