/**
 * API Client para CRUD canônico de personagens no backend.
 *
 * Endpoints:
 * - GET /characters - Lista todos os personagens (resumo)
 * - GET /characters/:id - Busca personagem por ID (completo)
 * - POST /characters - Cria novo personagem
 * - PUT /characters/:id - Atualiza personagem existente
 * - DELETE /characters/:id - Remove personagem
 *
 * Sem fallback local: requer backend disponível.
 */

import { getBaseUrl } from './api-catalog-client.js';

export class CharacterStorageError extends Error {
  name = 'CharacterStorageError';

  constructor(message: string, public cause?: Error) {
    super(message);
  }
}

export interface CharacterRecord {
  id?: string;
  ruleset?: string;
  name: string;
  lineageId?: string;
  backgroundId?: string;
  alignment?: string;
  experience?: number;
  classes?: Array<{ classId: string; level: number }>;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skillProficiencies?: string[];
  savingThrowProficiencies?: string[];
  inventory?: any[];
  spellChoices?: any[];
  backgroundChoices?: any;
  attacks?: any[];
  resources?: Record<string, any>;
  state?: {
    hp: number;
    maxHpOverride: number | null;
    tempHp: number;
    hitDiceUsed: number;
    spellSlotsUsed: Record<string, number>;
    activeConditions: any[];
  };
  [key: string]: any;
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  primaryClass: string;
}

function buildStorageError(operation: string, response: Response): string {
  return `Falha ao ${operation}: ${response.status} ${response.statusText}`;
}

/**
 * Lista todos os personagens (resumo).
 */
export async function listCharacters(): Promise<CharacterSummary[]> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    throw new CharacterStorageError(
      `Backend indisponível para listar personagens. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new CharacterStorageError(buildStorageError('listar personagens', response));
  }

  return response.json();
}

/**
 * Busca um personagem por ID.
 */
export async function getCharacter(id: string): Promise<CharacterRecord | null> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${id}`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    throw new CharacterStorageError(
      `Backend indisponível para buscar personagem. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new CharacterStorageError(buildStorageError('buscar personagem', response));
  }

  return response.json();
}

/**
 * Cria um novo personagem.
 */
export async function createCharacter(
  character: CharacterRecord
): Promise<CharacterRecord> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(character),
    });
  } catch (error) {
    throw new CharacterStorageError(
      `Backend indisponível para criar personagem. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    throw new CharacterStorageError(
      `Falha ao criar personagem: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

/**
 * Atualiza um personagem existente.
 */
export async function updateCharacter(
  id: string,
  character: Partial<CharacterRecord>
): Promise<CharacterRecord> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(character),
    });
  } catch (error) {
    throw new CharacterStorageError(
      `Backend indisponível para atualizar personagem. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    throw new CharacterStorageError(
      `Falha ao atualizar personagem: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

/**
 * Remove um personagem por ID.
 */
export async function deleteCharacter(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new CharacterStorageError(
      `Backend indisponível para deletar personagem. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new CharacterStorageError(buildStorageError('deletar personagem', response));
  }
}

/**
 * Salva personagem (cria ou atualiza).
 */
export async function saveCharacter(
  character: CharacterRecord
): Promise<CharacterRecord> {
  if (!character.id) {
    return createCharacter(character);
  }

  try {
    return await updateCharacter(character.id, character);
  } catch (error) {
    // Se for erro de 404 (nao existe), tenta criar
    if (error instanceof CharacterStorageError && error.message.includes('404')) {
      return createCharacter(character);
    }
    throw error;
  }
}
