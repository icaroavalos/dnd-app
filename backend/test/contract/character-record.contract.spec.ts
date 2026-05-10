/**
 * Contract tests for CharacterRecord compatibility between frontend and backend
 * These tests ensure backend types match frontend expectations
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type { CharacterRecord } from '../../src/shared/contracts/character.contract.js';
import type { BackgroundChoiceState } from '../../src/shared/contracts/background-choice.contract.js';
import type { SpellChoiceState } from '../../src/shared/contracts/spell-choice.contract.js';
import type { DerivedCharacterSheet } from '../../src/shared/contracts/derived-character-sheet.contract.js';

test('CharacterRecord contract - required fields', () => {
  const record: CharacterRecord = {
    id: 'test-001',
    ruleset: '5.5e-2024' as const,
    name: 'Test Character',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Perception'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
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

  assert.ok(record.id, 'id is required');
  assert.ok(record.ruleset, 'ruleset is required');
  assert.ok(record.name, 'name is required');
  assert.ok(record.lineageId, 'lineageId is required');
  assert.ok(record.backgroundId, 'backgroundId is required');
  assert.ok(record.classes, 'classes is required');
  assert.ok(record.abilities, 'abilities is required');
  assert.ok(record.inventory, 'inventory is required');
  assert.ok(record.spellChoices, 'spellChoices is required');
  assert.ok(record.resources, 'resources is required');
  assert.ok(record.state, 'state is required');
});

test('CharacterRecord - classes array structure', () => {
  const record: CharacterRecord = {
    id: 'test-001',
    ruleset: '5.5e-2024' as const,
    name: 'Test',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral',
    experience: 0,
    classes: [
      { classId: 'fighter', level: 1, subclassId: null },
      { classId: 'wizard', level: 2, subclassId: 'evocation' },
    ],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: [],
    savingThrowProficiencies: [],
    inventory: [],
    spellChoices: [],
    backgroundChoices: null,
    resources: {},
    state: {
      hp: 10,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
  };

  assert.equal(record.classes.length, 2);
  assert.equal(record.classes[0].classId, 'fighter');
  assert.equal(record.classes[0].level, 1);
  assert.equal(record.classes[1].subclassId, 'evocation');
});

test('CharacterRecord - inventory items structure', () => {
  const record: CharacterRecord = {
    id: 'test-001',
    ruleset: '5.5e-2024' as const,
    name: 'Test',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: [],
    savingThrowProficiencies: [],
    inventory: [
      {
        instanceId: 'item-001',
        baseItemId: 'longsword',
        status: 'backpack',
        quantity: 1,
      },
      {
        instanceId: 'item-002',
        baseItemId: 'shield',
        status: 'equipped_shield',
      },
    ],
    attacks: [],
    spells: [],
    spellChoices: [],
    backgroundChoices: null,
    resources: {},
    state: {
      hp: 10,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
  };

  assert.equal(record.inventory.length, 2);
  assert.equal(record.inventory[0].instanceId, 'item-001');
  assert.equal(record.inventory[0].baseItemId, 'longsword');
  assert.equal(record.inventory[0].status, 'backpack');
  assert.equal(record.inventory[0].quantity, 1);
  assert.equal(record.inventory[1].status, 'equipped_shield');
});

test('BackgroundChoiceState structure', () => {
  const backgroundChoices: BackgroundChoiceState = {
    backgroundId: 'acolyte',
    abilityMode: 'plus2_plus1',
    abilityAssignments: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 2,
      cha: 1,
    },
    equipmentSelection: ['A'],
    featChoiceId: null,
  };

  assert.ok(backgroundChoices.backgroundId, 'backgroundId is required');
  assert.ok(backgroundChoices.abilityMode, 'abilityMode is required');
  assert.ok(backgroundChoices.abilityAssignments, 'abilityAssignments is required');
  assert.ok(backgroundChoices.equipmentSelection, 'equipmentSelection is required');
  assert.equal(backgroundChoices.abilityMode, 'plus2_plus1');

  // Verify all six abilities are present
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
  for (const ability of abilities) {
    assert.ok(
      backgroundChoices.abilityAssignments[ability] !== undefined,
      `${ability} assignment is required`
    );
  }
});

test('SpellChoiceState structure', () => {
  const spellChoice: SpellChoiceState = {
    sourceId: 'wizard',
    spellcastingAbility: 'int',
    selectedCantrips: ['fire-bolt', 'prestidigitation'],
    selectedLevel1Spells: ['magic-missile', 'shield'],
  };

  assert.ok(spellChoice.sourceId, 'sourceId is required');
  assert.ok(spellChoice.spellcastingAbility, 'spellcastingAbility is required');
  assert.ok(spellChoice.selectedCantrips, 'selectedCantrips is required');
  assert.ok(spellChoice.selectedLevel1Spells, 'selectedLevel1Spells is required');
  assert.ok(Array.isArray(spellChoice.selectedCantrips));
  assert.ok(Array.isArray(spellChoice.selectedLevel1Spells));
});

test('DerivedCharacterSheet structure', () => {
  const sheet: DerivedCharacterSheet = {
    ruleset: '5.5e-2024' as const,
    level: 1,
    proficiencyBonus: 2,
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityModifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    savingThrows: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    skillBonuses: { perception: 2 },
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

  assert.ok(sheet.ruleset, 'ruleset is required');
  assert.ok(sheet.level !== undefined, 'level is required');
  assert.ok(sheet.proficiencyBonus !== undefined, 'proficiencyBonus is required');
  assert.ok(sheet.abilityScores, 'abilityScores is required');
  assert.ok(sheet.abilityModifiers, 'abilityModifiers is required');
  assert.ok(sheet.savingThrows, 'savingThrows is required');
  assert.ok(sheet.skillBonuses, 'skillBonuses is required');
  assert.ok(sheet.armorClass !== undefined, 'armorClass is required');
  assert.ok(sheet.initiative !== undefined, 'initiative is required');
  assert.ok(sheet.speed !== undefined, 'speed is required');
  assert.ok(sheet.maxHp !== undefined, 'maxHp is required');
  assert.ok(sheet.currentHp !== undefined, 'currentHp is required');
  assert.ok(sheet.tempHp !== undefined, 'tempHp is required');
  assert.ok(sheet.passivePerception !== undefined, 'passivePerception is required');
  assert.ok(sheet.spellSlotsMax, 'spellSlotsMax is required');
  assert.ok(sheet.resources, 'resources is required');

  // Verify all six abilities are present
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
  for (const ability of abilities) {
    assert.ok(sheet.abilityScores[ability] !== undefined, `${ability} score is required`);
    assert.ok(sheet.abilityModifiers[ability] !== undefined, `${ability} modifier is required`);
    assert.ok(sheet.savingThrows[ability] !== undefined, `${ability} save is required`);
  }
});

test('CharacterRecord - optional fields can be omitted', () => {
  const record: CharacterRecord = {
    id: 'test-001',
    ruleset: '5.5e-2024' as const,
    name: 'Test',
    lineageId: 'human',
    backgroundId: 'acolyte',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: [],
    savingThrowProficiencies: [],
    inventory: [],
    spellChoices: [],
    backgroundChoices: null,
    resources: {},
    state: {
      hp: 10,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
  };

  // alignment is optional
  record.alignment = undefined;

  // attacks is optional
  record.attacks = undefined;

  // spells is optional
  record.spells = undefined;
});

test('CharacterRecord - state structure', () => {
  const record: CharacterRecord = {
    id: 'test-001',
    ruleset: '5.5e-2024' as const,
    name: 'Test',
    lineageId: 'human',
    backgroundId: 'acolyte',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: [],
    savingThrowProficiencies: [],
    inventory: [],
    spellChoices: [],
    backgroundChoices: null,
    resources: {},
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
  };

  assert.ok(record.state.hp !== undefined, 'state.hp is required');
  assert.ok(record.state.tempHp !== undefined, 'state.tempHp is required');
  assert.ok(record.state.hitDiceUsed !== undefined, 'state.hitDiceUsed is required');
  assert.ok(record.state.spellSlotsUsed !== undefined, 'state.spellSlotsUsed is required');
  assert.ok(record.state.activeConditions !== undefined, 'state.activeConditions is required');
});
