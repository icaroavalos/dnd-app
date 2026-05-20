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
  originName?: string; // e.g., 'Barbarian', 'Actor', 'Acolyte'
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
  type: 'weapon' | 'subclass' | 'feat' | 'asi' | 'generic' | 'selection' | 'expertise' | 'spell';
  description?: string;
  subclassShortName?: string;
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

export interface Currency {
  gp: number;
  sp: number;
  cp: number;
  pp: number;
  ep: number;
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
  classFeatureChoices: Record<string, string[]>;
  asiChoices: Record<string, any>;
  equipmentChoices: Record<string, string>;
  inventory: any[];
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
  preparedSpells?: string[];
  features: Feature[];
  pendingChoices: Choice[];
  notes: string;
  bgSpellChoices?: Record<string, string[]>;
  bgChoices: BackgroundChoices;
  backgroundChoices?: any;
  currency?: Currency;
  equippedSlots?: Record<string, string>;
  acFormulaId?: string;
  _needsPreparation?: boolean;
  deathSaves?: {
    successes: number;
    failures: number;
  };
}
