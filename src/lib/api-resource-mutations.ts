/**
 * API Client para mutações de recursos e descansos.
 *
 * Envia comandos de gasto/recuperação de recursos para o backend,
 * que aplica event sourcing via ResourceLedger.
 *
 * Endpoints:
 * - POST /characters/:id/resources/damage
 * - POST /characters/:id/resources/heal
 * - POST /characters/:id/resources/short-rest
 * - POST /characters/:id/resources/long-rest
 * - POST /characters/:id/resources/hit-die
 * - POST /characters/:id/resources/spell-slot
 * - POST /characters/:id/resources/use-resource
 * - POST /characters/:id/resources/ammo/spend
 * - POST /characters/:id/resources/ammo/recover
 */

import { getBaseUrl } from './api-catalog-client.js';

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

/**
 * Aplica dano ao personagem.
 */
export async function applyDamage(
  characterId: string,
  input: DamageInput
): Promise<ResourceMutationResult> {
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/damage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to apply damage: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/heal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to apply healing: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/short-rest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to short rest: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/long-rest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to long rest: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/hit-die`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to use hit die: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/spell-slot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to use spell slot: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/use-resource`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to use resource: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/ammo/spend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to spend ammo: ${response.statusText} - ${error}`);
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
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/ammo/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to recover ammo: ${response.statusText} - ${error}`);
  }

  return response.json();
}

/**
 * Busca o estado projetado dos recursos.
 */
export async function getResourceProjection(
  characterId: string
): Promise<any> {
  const response = await fetch(`${getBaseUrl()}/characters/${characterId}/resources/projection`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get resource projection: ${response.statusText} - ${error}`);
  }

  return response.json();
}
