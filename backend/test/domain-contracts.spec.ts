import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ABILITY_KEYS,
  RULESET_ID,
  type BackgroundChoiceState,
  type CharacterRecord,
  type DerivedCharacterSheet,
  type RuleDefinition,
  type SpellChoiceState
} from '../src/domain/contracts/index.js';

test('domain contracts export canonical backend constants', () => {
  assert.equal(RULESET_ID, '5.5e-2024');
  assert.deepEqual(ABILITY_KEYS, ['str', 'dex', 'con', 'int', 'wis', 'cha']);
});

test('domain contract examples satisfy the canonical shapes', () => {
  const backgroundChoice: BackgroundChoiceState = {
    backgroundId: 'acolyte',
    abilityMode: 'plus2_plus1',
    abilityAssignments: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 2,
      cha: 1
    },
    equipmentSelection: ['holy-symbol', 'prayer-book'],
    featChoiceId: 'magic-initiate-cleric'
  };

  const spellChoice: SpellChoiceState = {
    sourceId: 'magic-initiate-cleric',
    spellcastingAbility: 'wis',
    selectedCantrips: ['Guidance', 'Sacred Flame'],
    selectedLevel1Spells: ['Cure Wounds']
  };

  const character: CharacterRecord = {
    id: 'char-001',
    ruleset: RULESET_ID,
    name: 'Kael',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral Good',
    experience: 0,
    classes: [
      {
        classId: 'fighter',
        level: 1
      }
    ],
    abilities: {
      str: 15,
      dex: 14,
      con: 13,
      int: 8,
      wis: 12,
      cha: 10
    },
    skillProficiencies: ['athletics', 'insight'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-001',
        baseItemId: 'longsword',
        status: 'equipped_main_hand'
      }
    ],
    attacks: [
      {
        name: 'Longsword',
        range: '5 feet',
        type: 'Slashing',
        damage: '1d8',
        itemId: 'item-inst-001'
      }
    ],
    spells: ['Guidance'],
    spellChoices: [spellChoice],
    backgroundChoices: backgroundChoice,
    resources: {
      second_wind: {
        current: 1,
        max: 1,
        recovery: 'short_rest'
      }
    },
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {
        '1': 0
      },
      activeConditions: []
    }
  };

  const derivedSheet: DerivedCharacterSheet = {
    ruleset: RULESET_ID,
    level: 1,
    proficiencyBonus: 2,
    abilityScores: character.abilities,
    abilityModifiers: {
      str: 2,
      dex: 2,
      con: 1,
      int: -1,
      wis: 1,
      cha: 0
    },
    savingThrows: {
      str: 4,
      dex: 2,
      con: 3,
      int: -1,
      wis: 1,
      cha: 0
    },
    skillBonuses: {
      athletics: 4,
      insight: 3
    },
    armorClass: 16,
    initiative: 2,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 11,
    spellcasting: {
      ability: 'wis',
      attackBonus: 3,
      saveDc: 11
    },
    spellSlotsMax: {
      '1': 0
    },
    resources: character.resources
  };

  const ruleDefinition: RuleDefinition = {
    id: 'magic-initiate-cleric',
    kind: 'feat',
    name: 'Magic Initiate (Cleric)',
    source: 'XPHB',
    ruleset: RULESET_ID,
    tags: ['spellcasting', 'feat']
  };

  assert.equal(character.backgroundChoices?.featChoiceId, 'magic-initiate-cleric');
  assert.equal(character.attacks?.[0]?.name, 'Longsword');
  assert.equal(character.spells?.[0], 'Guidance');
  assert.equal(derivedSheet.spellcasting?.ability, 'wis');
  assert.equal(derivedSheet.spellSlotsMax['1'], 0);
  assert.equal(ruleDefinition.kind, 'feat');
});
