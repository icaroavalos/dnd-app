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
  kind: 'class' | 'subclass' | 'species' | 'feat' | 'background' | 'other';
  description: string;
  meta?: string;
  level?: number;
  resource?: {
    id: string;
    remaining: number;
    max: number;
    recoveryLabel: string;
  };
}

export interface Choice {
  id: string;
  featureId: string;
  name: string;
  count: number;
  options: string[];
  type: 'weapon' | 'subclass' | 'feat' | 'asi' | 'generic';
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
  classFeatureChoices: Record<string, string[]>; // Changed to string[] for multiple choices
  asiChoices: Record<string, any>;
  equipmentChoices: Record<string, string>;
  inventory: any[]; // Changed to any[] for object support
  equippedItems: string[];
  hitDiceUsed: number;
  spellSlots: Record<string, { max: number; used: number }>;
  resources: Record<string, any>;
  tempHp: number;
  creationComplete: boolean;
  hp: number;
  maxHp: number;
  armorClass: number;
  speed: number;
  abilities: AbilityScores;
  savingThrows: string[];
  classSkillChoices: string[];
  skillProficiencies: string[];
  attacks: Attack[];
  spells: any[];
  features: Feature[];
  pendingChoices: Choice[];
  notes: string;
  bgSpellChoices?: Record<string, string[]>;
  bgChoices?: any;
  backgroundChoices?: any;
}
