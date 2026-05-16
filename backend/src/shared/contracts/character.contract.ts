import type { BackgroundChoiceState } from './background-choice.contract.js';
import type { AbilityScoreMap, RulesetId } from './base.contract.js';
import type { SpellChoiceState } from './spell-choice.contract.js';

export type CharacterItemStatus =
  | 'backpack'
  | 'equipped_main_hand'
  | 'equipped_off_hand'
  | 'equipped_armor'
  | 'equipped_shield'
  | 'attuned';

export type RecoveryType = 'short_rest' | 'long_rest' | 'none';

export interface CharacterClassLevel {
  classId: string;
  level: number;
  subclassId?: string | null;
}

export interface CharacterInventoryItem {
  instanceId: string;
  baseItemId: string;
  status: CharacterItemStatus;
  quantity?: number;
  customName?: string | null;
}

export interface CharacterAttack {
  name: string;
  range: string;
  type: string;
  damage: string;
  itemId?: string | null;
}

export interface CharacterConditionState {
  conditionId: string;
  durationRounds?: number | null;
}

export interface CharacterResourceState {
  current: number;
  max: number;
  recovery: RecoveryType;
  recoveryAmount?: number;
}

export interface CharacterRuntimeState {
  hp: number;
  maxHpOverride?: number | null;
  tempHp: number;
  hitDiceUsed: number;
  spellSlotsUsed: Record<string, number>;
  activeConditions: CharacterConditionState[];
}

export interface CharacterRecord {
  id: string;
  ruleset: RulesetId;
  name: string;
  lineageId: string;
  backgroundId: string;
  alignment?: string | null;
  experience: number;
  classes: CharacterClassLevel[];
  abilities: AbilityScoreMap;
  skillProficiencies: string[];
  savingThrowProficiencies: string[];
  inventory: CharacterInventoryItem[];
  attacks?: CharacterAttack[];
  spells?: string[];
  spellChoices: SpellChoiceState[];
  backgroundChoices?: BackgroundChoiceState | null;
  features?: any[];
  resources: Record<string, CharacterResourceState>;
  state: CharacterRuntimeState;
}
