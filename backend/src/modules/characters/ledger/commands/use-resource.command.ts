import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface UseResourceInput {
  characterId: string;
  resourceType: string;
  amount: number;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
}

export async function useResource(
  prisma: any,
  input: UseResourceInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'RESOURCE_USED',
    resourceType: input.resourceType,
    amount: -Math.abs(input.amount),
    source: input.source,
    description: input.description,
    metadata: input.metadata,
  });
}
