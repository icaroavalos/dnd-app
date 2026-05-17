export interface AbilityScores {
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
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
  subclassShortName?: string;
  resource?: {
    id: string;
    remaining: number;
    max: number;
    recoveryLabel: string;
    recovery?: 'full' | 'inc'; // 'full' (default) resets to max, 'inc' adds recoveryAmount
    recoveryAmount?: number;
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

export interface BackgroundChoices {
  background?: string;
  source?: string;
  abilityIncrement: '2_1' | '1_1_1' | null;
  abilityScores: string[];
  spellcastingAbility: string | null;
  equipmentChoice: 'A' | 'B' | null;
  skillChoices: string[];
  toolChoices?: string[];
  skillCollisions: string[];
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
  classes: Array<{ classId: string; level: number }>;
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
  bgChoices: BackgroundChoices;
  backgroundChoices?: any;
}
