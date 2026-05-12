import { apiClient } from './api-client';

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

export class CharacterApiError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'CharacterApiError';
  }
}

/**
 * Lista todos os personagens (resumo).
 */
export async function listCharacters(): Promise<CharacterSummary[]> {
  try {
    const response = await apiClient.get<CharacterSummary[]>('/characters');
    return response.data;
  } catch (error: any) {
    throw new CharacterApiError('Erro ao listar personagens', error);
  }
}

/**
 * Busca um personagem por ID.
 */
export async function getCharacter(id: string): Promise<CharacterRecord | null> {
  try {
    const response = await apiClient.get<CharacterRecord>(`/characters/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw new CharacterApiError(`Erro ao buscar personagem ${id}`, error);
  }
}

/**
 * Cria um novo personagem.
 */
export async function createCharacter(character: CharacterRecord): Promise<CharacterRecord> {
  try {
    const response = await apiClient.post<CharacterRecord>('/characters', character);
    return response.data;
  } catch (error: any) {
    throw new CharacterApiError('Erro ao criar personagem', error);
  }
}

/**
 * Atualiza um personagem existente.
 */
export async function updateCharacter(id: string, character: Partial<CharacterRecord>): Promise<CharacterRecord> {
  try {
    const response = await apiClient.put<CharacterRecord>(`/characters/${id}`, character);
    return response.data;
  } catch (error: any) {
    throw new CharacterApiError(`Erro ao atualizar personagem ${id}`, error);
  }
}

/**
 * Remove um personagem por ID.
 */
export async function deleteCharacter(id: string): Promise<void> {
  try {
    await apiClient.delete(`/characters/${id}`);
  } catch (error: any) {
    throw new CharacterApiError(`Erro ao deletar personagem ${id}`, error);
  }
}

/**
 * Salva personagem (cria ou atualiza).
 */
export async function saveCharacter(character: CharacterRecord): Promise<CharacterRecord> {
  if (!character.id) {
    return createCharacter(character);
  }

  try {
    return await updateCharacter(character.id, character);
  } catch (error: any) {
    // Se for erro de 404 (não existe), tenta criar
    if (error.cause?.response?.status === 404) {
      return createCharacter(character);
    }
    throw error;
  }
}
