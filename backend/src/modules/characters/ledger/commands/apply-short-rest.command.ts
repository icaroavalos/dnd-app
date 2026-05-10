import type { LedgerEntry } from '../shared/ledger-entry.entity.js';
import { applyHitDieChange } from './apply-hit-die-change.command.js';
import { applyRest } from './apply-rest.command.js';
import type { ApplyRestInput } from './apply-rest.command.js';

export interface ApplyShortRestInput extends Omit<ApplyRestInput, 'restType'> {
  hitDiceSpent: number;
  hpRegained: number;
  description?: string;
}

export async function applyShortRest(
  prisma: any,
  input: ApplyShortRestInput,
): Promise<LedgerEntry> {
  await applyHitDieChange(prisma, {
    characterId: input.characterId,
    amount: -input.hitDiceSpent,
    source: 'short_rest',
    description: input.description,
  });

  return applyRest(prisma, {
    characterId: input.characterId,
    restType: 'short',
    hpRegained: input.hpRegained,
    hitDiceRegained: input.hitDiceSpent,
    description: input.description,
  });
}
