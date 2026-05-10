import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { fromPrismaData } from '../shared/ledger-entry.utils.js';

export interface CreateLedgerInput {
  characterId: string;
  eventType: string;
  resourceType: string;
  amount: number;
  source: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

export async function createLedgerEntry(
  prisma: any,
  input: CreateLedgerInput,
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
