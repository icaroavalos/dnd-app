export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Attack {
  name: string;
  range: string;
  type: string;
  damage: string;
}

export interface Feature {
  id: string;
  name: string;
  kind: 'class' | 'species' | 'feat' | 'background';
  description: string;
  meta?: string;
  resource?: {
    id: string;
    remaining: number;
    max: number;
    recoveryLabel: string;
  };
}

export interface Character {
  id?: string;
  name: string;
  class: string;
  level: number;
  race: string;
  subrace: string;
  background: string;
  alignment: string;
  experience: number;
  abilityMethod: 'standard' | 'pointBuy' | 'manual';
  classFeatureChoices: Record<string, string>;
  asiChoices: Record<string, any>;
  equipmentChoices: Record<string, string>;
  inventory: string[];
  equippedItems: string[];
  hitDiceUsed: number;
  spellSlots: Record<string, { max: number; used: number }>;
  resources: Record<string, any>;
  tempHp: number;
  creationComplete: boolean;
  hp: number;
  maxHp?: number;
  armorClass: number;
  speed: number;
  abilities: AbilityScores;
  savingThrows: string[];
  classSkillChoices: string[];
  skillProficiencies: string[];
  attacks: Attack[];
  spells: any[]; // Changed to any[] to support spell objects
  features: Feature[];
  notes: string;
  bgSpellChoices?: Record<string, string[]>;
  bgChoices?: any;
}
