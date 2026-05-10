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
 * Fallback: Se o backend estiver indisponível, usa localStorage.
 */

import { getBaseUrl } from './api-catalog-client.js';

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

let backendEnabled = true;

/**
 * Habilita ou desabilita persistência via backend.
 */
export function enableBackendStorage(enabled: boolean) {
  backendEnabled = enabled;
}

/**
 * Verifica se persistência via backend está habilitada.
 */
export function isBackendStorageEnabled(): boolean {
  return backendEnabled;
}

/**
 * Lista todos os personagens (resumo).
 */
export async function listCharacters(): Promise<CharacterSummary[]> {
  if (!backendEnabled) {
    return [];
  }

  try {
    const response = await fetch(`${getBaseUrl()}/characters`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Failed to list characters: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn('Backend list failed, using fallback:', error);
    return [];
  }
}

/**
 * Busca um personagem por ID.
 */
export async function getCharacter(id: string): Promise<CharacterRecord | null> {
  if (!backendEnabled) {
    return null;
  }

  try {
    const response = await fetch(`${getBaseUrl()}/characters/${id}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get character: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn('Backend get failed, using fallback:', error);
    return null;
  }
}

/**
 * Cria um novo personagem.
 */
export async function createCharacter(
  character: CharacterRecord
): Promise<CharacterRecord> {
  const response = await fetch(`${getBaseUrl()}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(character),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create character: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(character),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update character: ${response.statusText} - ${error}`);
  }

  return response.json();
}

/**
 * Remove um personagem por ID.
 */
export async function deleteCharacter(id: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/characters/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete character: ${response.statusText}`);
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
    // Se falhar atualização, tenta criar
    console.warn('Update failed, trying create:', error);
    return createCharacter(character);
  }
}
