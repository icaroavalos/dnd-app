import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { applyRest } from './apply-rest.command.js';
import type { ApplyRestInput } from './apply-rest.command.js';

export interface ApplyLongRestInput
  extends Omit<ApplyRestInput, 'restType' | 'hitDiceRegained'> {
  hpRegained: number;
  description?: string;
}

export async function applyLongRest(
  prisma: any,
  input: ApplyLongRestInput,
): Promise<LedgerEntry> {
  return applyRest(prisma, {
    characterId: input.characterId,
    restType: 'long',
    hpRegained: input.hpRegained,
    hitDiceRegained: undefined,
    description: input.description,
  });
}
