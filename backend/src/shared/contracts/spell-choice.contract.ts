import type { AbilityKey } from './base.contract.js';

export interface SpellChoiceState {
  sourceId: string;
  spellcastingAbility: AbilityKey;
  selectedCantrips: string[];
  selectedLevel1Spells: string[];
}
