/**
 * Adaptador para migrar mutações de recursos do frontend para backend.
 *
 * Este módulo fornece funções que substituem a lógica local de
 * recuperação de recursos (resource-recovery.ts) por chamadas ao backend.
 *
 * Quando o backend está disponível e habilitado, as mutações são
 * enviadas para o servidor que aplica event sourcing via ResourceLedger.
 *
 * @see ../backend/src/modules/characters/ledger/resource-ledger.service.ts
 */

import {
  applyDamage as apiApplyDamage,
  applyHealing as apiApplyHealing,
  shortRest as apiShortRest,
  longRest as apiLongRest,
  useHitDie as apiUseHitDie,
  useSpellSlot as apiUseSpellSlot,
  useResource as apiUseResource,
  spendAmmo as apiSpendAmmo,
  recoverAmmo as apiRecoverAmmo,
  getResourceProjection,
  type DamageInput,
  type HealInput,
  type ShortRestInput,
  type LongRestInput,
  type HitDieInput,
  type SpellSlotInput,
  type UseResourceInput,
  type AmmoInput,
} from './api-resource-mutations.js';

/**
 * Estado do adaptador.
 */
let useBackendMutations = false;
let pendingCharacterId: string | null = null;

/**
 * Habilita ou desabilita mutações via backend.
 */
export function enableBackendMutations(enabled: boolean, characterId?: string) {
  useBackendMutations = enabled;
  if (characterId) {
    pendingCharacterId = characterId;
  }
}

/**
 * Verifica se mutações via backend estão habilitadas.
 */
export function isBackendMutationsEnabled(): boolean {
  return useBackendMutations;
}

/**
 * Aplica dano ao personagem via backend.
 */
export async function applyDamageBackend(
  characterId: string,
  amount: number,
  currentHp: number,
  description?: string
): Promise<any> {
  return apiApplyDamage(characterId, { amount, currentHp, description });
}

/**
 * Aplica cura ao personagem via backend.
 */
export async function applyHealingBackend(
  characterId: string,
  amount: number,
  currentHp: number,
  description?: string
): Promise<any> {
  return apiApplyHealing(characterId, { amount, currentHp, description });
}

/**
 * Realiza Short Rest via backend.
 */
export async function shortRestBackend(
  characterId: string,
  hitDiceSpent: number,
  hpRegained: number,
  description?: string
): Promise<any> {
  return apiShortRest(characterId, { hitDiceSpent, hpRegained, description });
}

/**
 * Realiza Long Rest via backend.
 */
export async function longRestBackend(
  characterId: string,
  hpRegained: number,
  description?: string
): Promise<any> {
  return apiLongRest(characterId, { hpRegained, description });
}

/**
 * Gasta Hit Die via backend.
 */
export async function useHitDieBackend(
  characterId: string,
  amount: number,
  source: 'short_rest' | 'healing' = 'short_rest',
  description?: string
): Promise<any> {
  return apiUseHitDie(characterId, { amount, source, description });
}

/**
 * Gasta slot de magia via backend.
 */
export async function useSpellSlotBackend(
  characterId: string,
  slotLevel: number,
  description?: string
): Promise<any> {
  return apiUseSpellSlot(characterId, { slotLevel, description });
}

/**
 * Gasta recurso genérico (Ki, Rage, etc.) via backend.
 */
export async function useResourceBackend(
  characterId: string,
  resourceType: string,
  amount: number,
  source: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<any> {
  return apiUseResource(characterId, { resourceType, amount, source, description, metadata });
}

/**
 * Gasta munição via backend.
 */
export async function spendAmmoBackend(
  characterId: string,
  itemId: string,
  quantity: number,
  source: string = 'attack',
  description?: string
): Promise<any> {
  return apiSpendAmmo(characterId, { itemId, quantity, source, description });
}

/**
 * Recupera munição via backend.
 */
export async function recoverAmmoBackend(
  characterId: string,
  itemId: string,
  quantity: number,
  source: string = 'loot',
  description?: string
): Promise<any> {
  return apiRecoverAmmo(characterId, { itemId, quantity, source, description });
}

/**
 * Busca projeção atual dos recursos.
 */
export async function fetchResourceProjection(characterId: string): Promise<any> {
  return getResourceProjection(characterId);
}

/**
 * Wrapper para funções de resource-recovery.ts que usa o backend quando disponível.
 */
export class ResourceRecoveryAdapter {
  private characterId: string;

  constructor(characterId: string) {
    this.characterId = characterId;
  }

  async shortRest(hitDiceSpent: number, hpRegained: number, description?: string): Promise<any> {
    if (useBackendMutations) {
      return shortRestBackend(this.characterId, hitDiceSpent, hpRegained, description);
    }
    // Fallback: retorna null para indicar que o frontend deve aplicar localmente
    return null;
  }

  async longRest(hpRegained: number, description?: string): Promise<any> {
    if (useBackendMutations) {
      return longRestBackend(this.characterId, hpRegained, description);
    }
    return null;
  }

  async spendResource(
    resourceType: string,
    amount: number,
    source: string,
    description?: string
  ): Promise<any> {
    if (useBackendMutations) {
      return useResourceBackend(this.characterId, resourceType, amount, source, description);
    }
    return null;
  }
}
