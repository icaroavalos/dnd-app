import { apiClient } from './api-client';
import type { Character } from '../types/character';

export class ActionMutationError extends Error {
  code?: string;

  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'ActionMutationError';
    this.code = cause?.response?.data?.code;
  }
}

export async function useResource(character: Character, resourceId: string, amount = 1): Promise<Character> {
  try {
    const response = await apiClient.post<Character>('/resources/use', {
      character,
      resourceId,
      amount,
    });
    return response.data;
  } catch (error) {
    throw new ActionMutationError('Não foi possível usar este recurso.', error);
  }
}

export async function spendAmmo(character: Character, itemId: string, amount = 1): Promise<Character> {
  try {
    const response = await apiClient.post<Character>('/inventory/spend-ammo', {
      character,
      itemId,
      amount,
    });
    return response.data;
  } catch (error) {
    throw new ActionMutationError('Não foi possível gastar munição.', error);
  }
}

export async function recoverAmmo(character: Character, itemId: string, amount = 1): Promise<Character> {
  try {
    const response = await apiClient.post<Character>('/inventory/recover-ammo', {
      character,
      itemId,
      amount,
    });
    return response.data;
  } catch (error) {
    throw new ActionMutationError('Não foi possível recuperar munição.', error);
  }
}
