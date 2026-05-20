import type {
  AbilityKey,
  AbilityScoreMap,
  RulesetId
} from './base.contract.js';
import type { CharacterResourceState } from './character.contract.js';

export interface DerivedSpellcasting {
  ability: AbilityKey;
  attackBonus: number;
  saveDc: number;
}
export interface ArmorClassOption {
  id: string;
  name: string;
  value: number;
  description: string;
}

export interface DerivedCharacterSheet {
  ruleset: RulesetId;
  level: number;
  proficiencyBonus: number;
  abilityScores: AbilityScoreMap;
  abilityModifiers: AbilityScoreMap;
  savingThrows: Record<AbilityKey, number>;
  skillBonuses: Record<string, number>;
  armorClass: number;
  armorClassOptions: ArmorClassOption[];
  proficiencyWarnings: string[]; // e.g. ["Wearing Heavy Armor without proficiency"]
  initiative: number;
  speed: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  passivePerception: number;
  spellcasting?: DerivedSpellcasting | null;
  spellSlotsMax: Record<string, number>;
  resources: Record<string, CharacterResourceState>;
}
