import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface SpendAmmoInput {
  characterId: string;
  itemId: string;
  quantity: number;
  source: string;
  description?: string;
}

export async function spendAmmo(
  prisma: any,
  input: SpendAmmoInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'AMMO_SPENT',
    resourceType: 'ammo',
    amount: -Math.abs(input.quantity),
    source: input.source,
    description: input.description || `Spent ${input.quantity} ${input.itemId}`,
    metadata: { itemId: input.itemId, quantity: input.quantity },
  });
}
