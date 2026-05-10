import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface RecoverAmmoInput {
  characterId: string;
  itemId: string;
  quantity: number;
  source: string;
  description?: string;
}

export async function recoverAmmo(
  prisma: any,
  input: RecoverAmmoInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'AMMO_RECOVERED',
    resourceType: 'ammo',
    amount: input.quantity,
    source: input.source,
    description: input.description || `Recovered ${input.quantity} ${input.itemId}`,
    metadata: { itemId: input.itemId, quantity: input.quantity },
  });
}
