import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { createLedgerEntry } from './create-ledger-entry.command.js';

export interface ApplySpellSlotChangeInput {
  characterId: string;
  slotLevel: number;
  description?: string;
}

export async function applySpellSlotChange(
  prisma: any,
  input: ApplySpellSlotChangeInput,
): Promise<LedgerEntry> {
  return createLedgerEntry(prisma, {
    characterId: input.characterId,
    eventType: 'SPELL_SLOT',
    resourceType: 'spell_slot',
    amount: input.slotLevel,
    source: 'spell_cast',
    description: input.description || `Used spell slot level ${input.slotLevel}`,
  });
}
