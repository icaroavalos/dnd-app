import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface ApplyRestInput {
  characterId: string;
  restType: 'short' | 'long';
  hpRegained: number;
  hitDiceRegained?: number;
  description?: string;
}

export async function applyRest(
  prisma: any,
  input: ApplyRestInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'REST_APPLIED',
    resourceType: input.restType === 'short' ? 'hit_die' : 'hp',
    amount: input.hpRegained + (input.hitDiceRegained || 0),
    source: input.restType === 'short' ? 'short_rest' : 'long_rest',
    description:
      input.description ||
      `${input.restType === 'short' ? 'Short' : 'Long'} rest applied`,
    metadata: {
      restType: input.restType,
      hpRegained: input.hpRegained,
      hitDiceRegained: input.hitDiceRegained,
    },
  });
}
