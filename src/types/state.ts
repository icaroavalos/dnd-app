/**
 * Tipos para o estado global da aplicação
 * Baseado na estrutura atual do app.js
 */

import type { SpellDetail, ClassData, RaceData, BackgroundData, ItemData, FeatureData, SubclassData } from './character';

/**
 * Dados da API/5etools
 */
export interface ApiState {
  classes: Record<string, ClassData>;
  levels: Record<string, unknown>;
  races: Record<string, RaceData>;
  spells: string[];
  classSpells: Record<string, { name: string; level: number; source: string }[]>;
  spellDetails: Record<string, SpellDetail>;
  source: {
    classOptions: [string, string][];
    raceOptions: [string, string][];
    backgroundOptions: [string, string][];
    backgroundDetails: Record<string, BackgroundData>;
    subraceDetails: Record<string, RaceData>;
    itemDetails: Record<string, ItemData>;
    classFeatures: FeatureData[];
    subclasses: SubclassData[];
    featDetails: Record<string, FeatureData>;
  };
}

/**
 * Os 6 ability scores
 */
export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

/**
 * Attack data structure
 */
export interface Attack {
  name: string;
  range: string;
  type: string;
  damage: string;
}

/**
 * Estado do character (app.js:207-242)
 */
export interface Character {
  name: string;
  class: string;
  level: number;
  race: string;
  subrace: string;
  background: string;
  alignment: string;
  experience: number;
  abilityMethod: 'standard' | 'pointBuy' | 'manual';
  classFeatureChoices: Record<string, string[]>;
  asiChoices: Record<string, string[]>;
  equipmentChoices: Record<string, string>;
  inventory: string[];
  equippedItems: string[];
  hitDiceUsed: number;
  spellSlots: Record<string, number>;
  resources: Record<string, unknown>;
  tempHp: number;
  creationComplete: boolean;
  hp: number;
  armorClass: number;
  speed: number;
  abilities: AbilityScores;
  savingThrows: string[];
  classSkillChoices: string[];
  skillProficiencies: string[];
  attacks: Attack[];
  spells: string[];
  notes: string;
  bgSpellChoices?: Record<string, string[]>;
}

/**
 * Estado da UI
 */
export interface UiState {
  step: 'lineage' | 'abilities' | 'choices' | 'leveling';
  tab: string;
  builderVisible: boolean;
  levelUpMode: boolean;
  levelUpFrom: number;
  levelUpHpBase: number;
  levelUpHpGain: number;
  levelUpSnapshot: Character | null;
  levelUpClassMode: 'same' | 'multiclass';
  hpModalOpen: boolean;
  hpModalMode: 'damage' | 'heal' | 'temp';
  hpModalAmount: number;
  restModalOpen: boolean;
  restModalType: 'short' | 'long' | null;
  restModalContent: unknown;
  validationMessage: string;
}

/**
 * Estado completo da aplicação
 * Reflete a estrutura do estado global em app.js
 */
export interface AppState {
  step: string;
  tab: string;
  dataStatus: 'local' | 'remote';
  derived: unknown;
  selectedSpell: string;
  actionFilter: string;
  selectedAction: string;
  featureFilter: string;
  selectedFeature: string;
  bgSpellChoices: Record<string, string[]>;
  hpModalOpen: boolean;
  hpModalMode: string;
  hpModalAmount: number;
  hpModalTempAmount: string;
  restModalOpen: boolean;
  restModalType: string | null;
  restModalContent: unknown;
  validationMessage: string;
  builderVisible: boolean;
  levelUpMode: boolean;
  levelUpFrom: number;
  levelUpHpBase: number;
  levelUpHpGain: number;
  levelUpSnapshot: Character | null;
  levelUpClassMode: string;
  activeCharacterId: string;
  characters: Character[];
  api: ApiState;
  character: Character;
}
