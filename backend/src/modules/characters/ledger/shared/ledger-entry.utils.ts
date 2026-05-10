import type { LedgerEntry } from './ledger-entry.entity.js';

export function fromPrismaData(data: any): LedgerEntry {
  return {
    id: data.id,
    characterId: data.characterId,
    eventType: data.eventType,
    resourceType: data.resourceType,
    amount: data.amount,
    source: data.source,
    description: data.description,
    metadata: data.metadata ? JSON.parse(data.metadata) : null,
    createdAt: data.createdAt,
  };
}
