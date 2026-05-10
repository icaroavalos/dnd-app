/**
 * API Client para mutações de recursos e inventário.
 *
 * Envia comandos de gasto/recuperação de recursos para o backend,
 * que aplica event sourcing via ResourceLedger.
 *
 * Sem fallback local: requer backend disponível.
 */

import { getBaseUrl } from './api-catalog-client.js';

export class ResourceMutationError extends Error {
  name = 'ResourceMutationError';

  constructor(message: string, public cause?: Error) {
    super(message);
  }
}

export interface ResourceMutationResult {
  event: any;
  [key: string]: any;
}

export interface DamageInput {
  amount: number;
  currentHp: number;
  description?: string;
}

export interface HealInput {
  amount: number;
  currentHp: number;
  description?: string;
}

export interface ShortRestInput {
  hitDiceSpent: number;
  hpRegained: number;
  description?: string;
}

export interface LongRestInput {
  hpRegained: number;
  description?: string;
}

export interface HitDieInput {
  amount: number;
  source: 'short_rest' | 'healing';
  description?: string;
}

export interface SpellSlotInput {
  slotLevel: number;
  description?: string;
}

export interface UseResourceInput {
  resourceType: string;
  amount: number;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AmmoInput {
  itemId: string;
  quantity: number;
  source: string;
  description?: string;
}

export interface InventoryMutationInput {
  itemId: string;
  quantity: number;
  source: string;
  description?: string;
}

function buildMutationError(operation: string, response: Response): string {
  return `Falha ao ${operation}: ${response.status} ${response.statusText}`;
}

/**
 * Aplica dano ao personagem.
 */
export async function applyDamage(
  characterId: string,
  input: DamageInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/damage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para aplicar dano. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('aplicar dano', response));
  }

  return response.json();
}

/**
 * Aplica cura ao personagem.
 */
export async function applyHealing(
  characterId: string,
  input: HealInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/heal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para aplicar cura. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('aplicar cura', response));
  }

  return response.json();
}

/**
 * Realiza um Short Rest.
 */
export async function shortRest(
  characterId: string,
  input: ShortRestInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/short-rest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para short rest. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('realizar short rest', response));
  }

  return response.json();
}

/**
 * Realiza um Long Rest.
 */
export async function longRest(
  characterId: string,
  input: LongRestInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/long-rest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para long rest. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('realizar long rest', response));
  }

  return response.json();
}

/**
 * Gasta um hit die.
 */
export async function useHitDie(
  characterId: string,
  input: HitDieInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/hit-die`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para usar hit die. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('usar hit die', response));
  }

  return response.json();
}

/**
 * Gasta um slot de magia.
 */
export async function useSpellSlot(
  characterId: string,
  input: SpellSlotInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/spell-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para usar slot de magia. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('usar slot de magia', response));
  }

  return response.json();
}

/**
 * Gasta um recurso genérico (Ki, Rage, etc.).
 */
export async function useResource(
  characterId: string,
  input: UseResourceInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/use-resource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para usar recurso. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('usar recurso', response));
  }

  return response.json();
}

/**
 * Gasta munição.
 */
export async function spendAmmo(
  characterId: string,
  input: AmmoInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/ammo/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para gastar munição. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('gastar munição', response));
  }

  return response.json();
}

/**
 * Recupera munição.
 */
export async function recoverAmmo(
  characterId: string,
  input: AmmoInput
): Promise<ResourceMutationResult> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/ammo/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para recuperar munição. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('recuperar munição', response));
  }

  return response.json();
}

/**
 * Busca o estado projetado dos recursos.
 */
export async function getResourceProjection(
  characterId: string
): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/projection`, {
      method: 'GET',
    });
  } catch (error) {
    throw new ResourceMutationError(
      `Backend indisponível para buscar projeção de recursos. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    throw new ResourceMutationError(buildMutationError('buscar projeção de recursos', response));
  }

  return response.json();
}
