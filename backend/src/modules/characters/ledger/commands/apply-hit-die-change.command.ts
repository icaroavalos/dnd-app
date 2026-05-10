import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface ApplyHitDieChangeInput {
  characterId: string;
  amount: number;
  source: 'short_rest' | 'healing';
  description?: string;
}

export async function applyHitDieChange(
  prisma: any,
  input: ApplyHitDieChangeInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'HIT_DIE',
    resourceType: 'hit_die',
    amount: input.amount,
    source: input.source,
    description: input.description,
  });
}
