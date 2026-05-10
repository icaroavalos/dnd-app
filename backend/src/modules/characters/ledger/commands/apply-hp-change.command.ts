import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface ApplyHpChangeInput {
  characterId: string;
  amount: number;
  source: 'damage' | 'healing' | 'temp_hp';
  description?: string;
}

export async function applyHpChange(
  prisma: any,
  input: ApplyHpChangeInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'HP_CHANGE',
    resourceType: 'hp',
    amount: input.amount,
    source: input.source,
    description: input.description,
  });
}
