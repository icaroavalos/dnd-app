import type { LedgerEntry, CreateLedgerInput } from '../shared/ledger-entry.entity.js';
import { fromPrismaData } from '../shared/ledger-entry.utils.js';

export async function createLedgerEntry(
  prisma: any,
  input: CreateLedgerInput
): Promise<LedgerEntry> {
  const character = await prisma.character.findUnique({
    where: { id: input.characterId },
  });

  if (!character) {
    throw new Error(`Character ${input.characterId} not found`);
  }

  const entry = await prisma.resourceLedgerEntry.create({
    data: {
      characterId: input.characterId,
      eventType: input.eventType,
      resourceType: input.resourceType,
      amount: input.amount,
      source: input.source,
      description: input.description,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  return fromPrismaData(entry);
}

export async function resourceUsed(
  prisma: any,
  characterId: string,
  resourceType: string,
  amount: number,
  source: string,
  description?: string,
  metadata?: Record<string, any>,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'RESOURCE_USED',
    resourceType,
    amount: -Math.abs(amount),
    source,
    description,
    metadata,
  });
}

export async function restApplied(
  prisma: any,
  characterId: string,
  restType: 'short' | 'long',
  hpRegained: number,
  hitDiceRegained?: number,
  description?: string,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'REST_APPLIED',
    resourceType: restType === 'short' ? 'hit_die' : 'hp',
    amount: hpRegained + (hitDiceRegained || 0),
    source: restType === 'short' ? 'short_rest' : 'long_rest',
    description: description || `${restType === 'short' ? 'Short' : 'Long'} rest applied`,
    metadata: { restType, hpRegained, hitDiceRegained },
  });
}

export async function ammoSpent(
  prisma: any,
  characterId: string,
  itemId: string,
  quantity: number,
  source: string,
  description?: string,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'AMMO_SPENT',
    resourceType: 'ammo',
    amount: -Math.abs(quantity),
    source,
    description: description || `Spent ${quantity} ${itemId}`,
    metadata: { itemId, quantity },
  });
}

export async function ammoRecovered(
  prisma: any,
  characterId: string,
  itemId: string,
  quantity: number,
  source: string,
  description?: string,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'AMMO_RECOVERED',
    resourceType: 'ammo',
    amount: quantity,
    source,
    description: description || `Recovered ${quantity} ${itemId}`,
    metadata: { itemId, quantity },
  });
}

export async function hpChange(
  prisma: any,
  characterId: string,
  amount: number,
  source: 'damage' | 'healing' | 'temp_hp',
  description?: string,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'HP_CHANGE',
    resourceType: 'hp',
    amount,
    source,
    description,
  });
}

export async function hitDieChange(
  prisma: any,
  characterId: string,
  amount: number,
  source: 'short_rest' | 'healing',
  description?: string,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'HIT_DIE',
    resourceType: 'hit_die',
    amount,
    source,
    description,
  });
}

export async function spellSlotChange(
  prisma: any,
  characterId: string,
  slotLevel: number,
  description?: string,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId,
    eventType: 'SPELL_SLOT',
    resourceType: 'spell_slot',
    amount: slotLevel,
    source: 'spell_cast',
    description: description || `Used spell slot level ${slotLevel}`,
  });
}

export async function shortRest(
  prisma: any,
  characterId: string,
  hitDiceSpent: number,
  hpRegained: number,
  description?: string,
): Promise<LedgerEntry> {
  await hitDieChange(prisma, characterId, -hitDiceSpent, 'short_rest', description);
  return restApplied(prisma, characterId, 'short', hpRegained, hitDiceSpent, description);
}

export async function longRest(
  prisma: any,
  characterId: string,
  hpRegained: number,
  description?: string,
): Promise<LedgerEntry> {
  return restApplied(prisma, characterId, 'long', hpRegained, undefined, description);
}
