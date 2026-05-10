/**
 * Shared fixtures for CharacterRecord and related types
 * Used for frontend-backend contract testing
 */

/**
 * Frontend BackgroundChoiceState type (matches backend structure)
 */
export interface FrontendBackgroundChoiceState {
  background: string | null;
  source: string;
  abilityIncrement: '2_1' | '1_1_1' | null;
  abilityScores: ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[];
  skillChoices: string[];
  toolChoices: string[];
  equipmentChoice: 'A' | 'B' | null;
  spellcastingAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' | null;
}

/**
 * Frontend SpellChoiceState type (matches backend structure)
 */
export interface FrontendSpellChoiceState {
  sourceId: string;
  spellcastingAbility: string;
  selectedCantrips: string[];
  selectedLevel1Spells: string[];
}

/**
 * Frontend DerivedCharacterSheet type
 */
export interface FrontendDerivedCharacterSheet {
  level: number;
  proficiencyBonus: number;
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  abilityModifiers: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  savingThrows: Record<string, number>;
  skillBonuses: Record<string, number>;
  passivePerception: number;
  armorClass: number;
  initiative: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDie: number;
  hitDiceTotal: number;
  spellAttack: number;
  spellSaveDc: number;
  spellSlotsMax: Record<string, number>;
  encumbrance: {
    carriedWeight: number;
    carryingCapacity: number;
    encumbered: boolean;
  };
}

/**
 * Create a minimal valid CharacterRecord for testing
 */
export function createMinimalCharacterRecord() {
  return {
    id: 'test-char-001',
    ruleset: '5.5e-2024' as const,
    name: 'Test Character',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    skillProficiencies: ['Perception'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-001',
        baseItemId: 'longsword',
        status: 'backpack' as const,
        quantity: 1,
      },
    ],
    attacks: [],
    spells: [],
    spellChoices: [],
    backgroundChoices: null,
    resources: {},
    state: {
      hp: 12,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
  };
}

/**
 * Create a CharacterRecord with background choices
 */
export function createCharacterWithBackground() {
  return {
    ...createMinimalCharacterRecord(),
    backgroundChoices: {
      backgroundId: 'acolyte',
      abilityMode: 'plus2_plus1' as const,
      abilityAssignments: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 2,
        cha: 1,
      },
      equipmentSelection: ['A'],
    },
  };
}

/**
 * Create a CharacterRecord with spell choices
 */
export function createCharacterWithSpells() {
  return {
    ...createMinimalCharacterRecord(),
    spellChoices: [
      {
        sourceId: 'wizard',
        spellcastingAbility: 'int' as const,
        selectedCantrips: ['fire-bolt', 'prestidigitation'],
        selectedLevel1Spells: ['magic-missile', 'shield'],
      },
    ],
  };
}

/**
 * Create a full DerivedCharacterSheet for testing
 */
export function createMinimalDerivedCharacterSheet(): FrontendDerivedCharacterSheet {
  return {
    level: 1,
    proficiencyBonus: 2,
    abilityScores: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    abilityModifiers: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    },
    savingThrows: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    },
    skillBonuses: {
      perception: 2,
    },
    passivePerception: 10,
    armorClass: 10,
    initiative: 0,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    hitDie: 1,
    hitDiceTotal: 1,
    spellAttack: 0,
    spellSaveDc: 0,
    spellSlotsMax: {},
    encumbrance: {
      carriedWeight: 0,
      carryingCapacity: 150,
      encumbered: false,
    },
  };
}

/**
 * Create a backend-compatible DerivedCharacterSheet
 */
export function createBackendDerivedCharacterSheet() {
  return {
    ruleset: '5.5e-2024' as const,
    level: 1,
    proficiencyBonus: 2,
    abilityScores: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    abilityModifiers: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    },
    savingThrows: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    },
    skillBonuses: {
      perception: 2,
    },
    armorClass: 10,
    initiative: 0,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 10,
    spellSlotsMax: {},
    resources: {},
  };
}
