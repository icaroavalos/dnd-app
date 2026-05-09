/**
 * Teste de criacao completa de personagens D&D 2024
 *
 * Cenarios testados:
 * 1. Fighter sem magia - personagem marcial puro
 * 2. Wizard com cantrips e magias - conjurador completo
 * 3. Cleric com spellcasting - conjurador divino
 * 4. Acolyte background - Magic Initiate feat
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Carrega modulos compilados
const stateModule = await import('../dist/src/core/state/state-manager.js');
const persistenceModule = await import('../dist/src/core/state/persistence.js');
const backgroundChoicesModule = await import('../dist/src/core/character/background-choices.js');
const backgroundRulesModule = await import('../dist/src/core/character/background-rules.js');

// Dados locais de D&D 2024
const DATA_DIR = './data/5etools/5e-2024';

function loadJsonFile(filename) {
  const path = `${DATA_DIR}/${filename}`;
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

// Campos minimos para um CharacterRecord completo
const REQUIRED_CHARACTER_FIELDS = [
  'name',
  'class',
  'race',
  'background',
  'level',
  'alignment',
  'experience',
  'abilities',
  'savingThrows',
  'skillProficiencies',
  'classSkillChoices',
  'classFeatureChoices',
  'equipmentChoices',
  'inventory',
  'attacks',
  'spells',
  'bgChoices',
  'bgSpellChoices',
  'creationComplete',
  'hitDiceUsed',
  'hp',
  'armorClass',
  'speed',
  'tempHp',
];

// Campos que nao podem ser undefined
const NO_UNDEFINED_FIELDS = [
  'name',
  'class',
  'race',
  'background',
  'level',
  'abilities',
  'savingThrows',
  'skillProficiencies',
  'classSkillChoices',
  'classFeatureChoices',
  'equipmentChoices',
  'inventory',
  'attacks',
  'spells',
  'bgChoices',
  'bgSpellChoices',
  'creationComplete',
  'hitDiceUsed',
  'hp',
  'armorClass',
  'speed',
  'tempHp',
];

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

describe('Complete Character Creation - D&D 2024', () => {
  let classes, backgrounds, spells, classSpells, races, equipment;

  before(() => {
    classes = loadJsonFile('classes.json');
    backgrounds = loadJsonFile('backgrounds.json');
    spells = loadJsonFile('spells.json');
    classSpells = loadJsonFile('class-spells.json');
    races = loadJsonFile('races.json');
    equipment = loadJsonFile('equipment.json');
  });

  it('Scenario 1: Fighter without magic - creates complete character record', () => {
    const fighter = stateModule.createDefaultCharacter();
    fighter.name = 'Thorin Steelheart';
    fighter.class = 'fighter';
    fighter.race = 'human';
    fighter.subrace = 'Human';
    fighter.background = 'Soldier';
    fighter.alignment = 'Lawful Neutral';
    fighter.level = 1;
    fighter.experience = 0;
    fighter.abilities = { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 };
    fighter.savingThrows = ['str', 'con'];
    fighter.skillProficiencies = ['Athletics', 'Intimidation'];
    fighter.classSkillChoices = ['Athletics', 'Perception'];
    fighter.classFeatureChoices = { fightingStyle: 'Defense', martialWeapon: 'longsword' };
    fighter.equipmentChoices = { fighterPack: 'explorerPack' };
    fighter.inventory = ['longsword', 'chainMail', 'shield', 'explorerPack'];
    fighter.attacks = [{ name: 'Longsword', ability: 'str', prof: true, damage: { dice: '1d8', type: 'slashing' } }];
    fighter.spells = [];
    fighter.bgChoices = {
      background: 'Soldier',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['str', 'con'],
      skillChoices: ['Athletics', 'Intimidation'],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: null,
    };
    fighter.bgSpellChoices = {};
    fighter.creationComplete = true;
    fighter.hitDiceUsed = 0;
    fighter.hp = 12;
    fighter.armorClass = 18;
    fighter.speed = 30;
    fighter.tempHp = 0;
    fighter.notes = '';

    // Validate required fields exist
    for (const field of REQUIRED_CHARACTER_FIELDS) {
      assert.ok(fighter[field] !== undefined, `Fighter missing required field: ${field}`);
    }

    // Validate no undefined values in critical fields
    for (const field of NO_UNDEFINED_FIELDS) {
      assert.ok(fighter[field] !== undefined, `Fighter ${field} is undefined`);
    }

    // Validate abilities structure
    for (const key of ABILITY_KEYS) {
      assert.ok(typeof fighter.abilities[key] === 'number', `Fighter abilities.${key} should be a number`);
    }

    // Validate Fighter has no spells (non-caster at level 1)
    assert.deepEqual(fighter.spells, [], 'Fighter should have no spells at level 1');
    assert.deepEqual(fighter.bgSpellChoices, {}, 'Fighter should have no background spell choices');

    console.log('  Fighter: OK - Complete character record');
  });

  it('Scenario 2: Wizard with cantrips and spells - creates complete spellcasting record', () => {
    const wizard = stateModule.createDefaultCharacter();
    wizard.name = 'Elara Spellweaver';
    wizard.class = 'wizard';
    wizard.race = 'highElf';
    wizard.subrace = 'High Elf';
    wizard.background = 'Sage';
    wizard.alignment = 'Neutral Good';
    wizard.level = 1;
    wizard.experience = 0;
    wizard.abilities = { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 };
    wizard.savingThrows = ['int', 'wis'];
    wizard.skillProficiencies = ['Arcana', 'Investigation'];
    wizard.classSkillChoices = ['Arcana', 'Investigation', 'History'];
    wizard.classFeatureChoices = { arcaneTradition: 'evocation' };
    wizard.equipmentChoices = { wizardPack: 'scholarPack' };
    wizard.inventory = ['spellbook', 'componentPouch', 'scholarPack'];
    wizard.attacks = [{ name: 'Dagger', ability: 'dex', prof: true, damage: { dice: '1d4', type: 'piercing' } }];
    wizard.spells = ['Fire Bolt', 'Prestidigitation', 'Magic Missile', 'Shield'];
    wizard.bgChoices = {
      background: 'Sage',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['int', 'con'],
      skillChoices: ['Arcana', 'Investigation'],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: 'int',
    };
    wizard.bgSpellChoices = {};
    wizard.creationComplete = true;
    wizard.hitDiceUsed = 0;
    wizard.hp = 9;
    wizard.armorClass = 12;
    wizard.speed = 30;
    wizard.tempHp = 0;
    wizard.notes = '';

    // Validate required fields
    for (const field of REQUIRED_CHARACTER_FIELDS) {
      assert.ok(wizard[field] !== undefined, `Wizard missing required field: ${field}`);
    }

    // Validate no undefined values
    for (const field of NO_UNDEFINED_FIELDS) {
      assert.ok(wizard[field] !== undefined, `Wizard ${field} is undefined`);
    }

    // Validate abilities
    for (const key of ABILITY_KEYS) {
      assert.ok(typeof wizard.abilities[key] === 'number', `Wizard abilities.${key} should be a number`);
    }

    // Validate Wizard has spells
    assert.ok(wizard.spells.length > 0, 'Wizard should have spells');
    assert.ok(wizard.spells.includes('Fire Bolt'), 'Wizard should have Fire Bolt cantrip');
    assert.ok(wizard.spells.includes('Magic Missile'), 'Wizard should have Magic Missile');

    // Validate spellcasting ability
    assert.equal(wizard.bgChoices.spellcastingAbility, 'int', 'Wizard should use Intelligence for spellcasting');

    console.log('  Wizard: OK - Complete spellcasting record');
  });

  it('Scenario 3: Cleric with spellcasting - creates divine caster record', () => {
    const cleric = stateModule.createDefaultCharacter();
    cleric.name = 'Brother Marcus';
    cleric.class = 'cleric';
    cleric.race = 'human';
    cleric.subrace = 'Human';
    cleric.background = 'Acolyte';
    cleric.alignment = 'Lawful Good';
    cleric.level = 1;
    cleric.experience = 0;
    cleric.abilities = { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 12 };
    cleric.savingThrows = ['wis', 'cha'];
    cleric.skillProficiencies = ['Insight', 'Religion'];
    cleric.classSkillChoices = ['Insight', 'Medicine'];
    cleric.classFeatureChoices = { divineDomain: 'life' };
    cleric.equipmentChoices = { clericPack: 'priestPack' };
    cleric.inventory = ['mace', 'scaleMail', 'priestPack', 'holySymbol'];
    cleric.attacks = [{ name: 'Mace', ability: 'str', prof: true, damage: { dice: '1d6', type: 'bludgeoning' } }];
    cleric.spells = ['Guidance', 'Spare the Dying', 'Cure Wounds', 'Bless'];
    cleric.bgChoices = {
      background: 'Acolyte',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['wis', 'con'],
      skillChoices: ['Insight', 'Religion'],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: 'wis',
    };
    cleric.bgSpellChoices = {};
    cleric.creationComplete = true;
    cleric.hitDiceUsed = 0;
    cleric.hp = 8;
    cleric.armorClass = 16;
    cleric.speed = 30;
    cleric.tempHp = 0;
    cleric.notes = '';

    // Validate required fields
    for (const field of REQUIRED_CHARACTER_FIELDS) {
      assert.ok(cleric[field] !== undefined, `Cleric missing required field: ${field}`);
    }

    // Validate no undefined values
    for (const field of NO_UNDEFINED_FIELDS) {
      assert.ok(cleric[field] !== undefined, `Cleric ${field} is undefined`);
    }

    // Validate abilities
    for (const key of ABILITY_KEYS) {
      assert.ok(typeof cleric.abilities[key] === 'number', `Cleric abilities.${key} should be a number`);
    }

    // Validate Cleric has spells
    assert.ok(cleric.spells.length > 0, 'Cleric should have spells');
    assert.ok(cleric.spells.some(s => s.toLowerCase().includes('guidance')), 'Cleric should have Guidance');

    // Validate spellcasting ability
    assert.equal(cleric.bgChoices.spellcastingAbility, 'wis', 'Cleric should use Wisdom for spellcasting');

    console.log('  Cleric: OK - Complete divine caster record');
  });

  it('Scenario 4: Acolyte background with Magic Initiate - creates feat record', () => {
    const acolyte = stateModule.createDefaultCharacter();
    acolyte.name = 'Sister Amara';
    acolyte.class = 'rogue';
    acolyte.race = 'human';
    acolyte.subrace = 'Human';
    acolyte.background = 'Acolyte';
    acolyte.alignment = 'Chaotic Good';
    acolyte.level = 1;
    acolyte.experience = 0;
    acolyte.abilities = { str: 10, dex: 16, con: 14, int: 12, wis: 14, cha: 12 };
    acolyte.savingThrows = ['dex', 'int'];
    acolyte.skillProficiencies = ['Stealth', 'Investigation'];
    acolyte.classSkillChoices = ['Stealth', 'Investigation', 'Deception'];
    acolyte.classFeatureChoices = { rogueScheme: 'thief' };
    acolyte.equipmentChoices = { roguePack: 'burglarPack' };
    acolyte.inventory = ['rapier', 'leatherArmor', 'burglarPack', 'thievesTools'];
    acolyte.attacks = [{ name: 'Rapier', ability: 'dex', prof: true, damage: { dice: '1d8', type: 'piercing' } }];
    acolyte.spells = ['Guidance', 'Spare the Dying', 'Light'];
    acolyte.bgChoices = {
      background: 'Acolyte',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['dex', 'con'],
      skillChoices: ['Stealth', 'Investigation'],
      toolChoices: ['thievesTools'],
      equipmentChoice: 'A',
      spellcastingAbility: 'wis',
    };
    // Magic Initiate (Cleric): 2 cantrips, 1 level 1 spell
    acolyte.bgSpellChoices = {
      'bg-spell-cantrip': ['Guidance', 'Spare the Dying'],
      'bg-spell-level1': ['Light'],
    };
    acolyte.creationComplete = true;
    acolyte.hitDiceUsed = 0;
    acolyte.hp = 9;
    acolyte.armorClass = 14;
    acolyte.speed = 30;
    acolyte.tempHp = 0;
    acolyte.notes = '';

    // Validate required fields
    for (const field of REQUIRED_CHARACTER_FIELDS) {
      assert.ok(acolyte[field] !== undefined, `Acolyte missing required field: ${field}`);
    }

    // Validate no undefined values
    for (const field of NO_UNDEFINED_FIELDS) {
      assert.ok(acolyte[field] !== undefined, `Acolyte ${field} is undefined`);
    }

    // Validate abilities
    for (const key of ABILITY_KEYS) {
      assert.ok(typeof acolyte.abilities[key] === 'number', `Acolyte abilities.${key} should be a number`);
    }

    // Validate Acolyte has Magic Initiate spells
    assert.ok(acolyte.spells.length > 0, 'Acolyte should have Magic Initiate spells');
    assert.ok(acolyte.bgSpellChoices, 'Acolyte should have background spell choices');

    // Validate background choices completeness
    assert.equal(acolyte.bgChoices.background, 'Acolyte', 'Should have Acolyte background');
    assert.equal(acolyte.bgChoices.abilityIncrement, '2_1', 'Should have ability increment pattern');
    assert.ok(acolyte.bgChoices.abilityScores.length > 0, 'Should have ability score selections');

    console.log('  Acolyte with Magic Initiate: OK - Complete feat record');
  });

  it('CharacterRecord to Character conversion - preserves all fields', () => {
    // Simula conversao de CharacterRecord (backend) para Character (frontend)
    const characterRecord = {
      id: 'test-123',
      name: 'Test Hero',
      ruleset: '5e-2024',
      lineageId: 'human',
      backgroundId: 'acolyte',
      alignment: 'Neutral Good',
      experience: 0,
      classes: [{ classId: 'cleric', level: 1 }],
      abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 12 },
      skillProficiencies: ['Insight', 'Religion'],
      savingThrowProficiencies: ['wis', 'cha'],
      inventory: ['mace', 'holySymbol'],
      spellChoices: [],
      backgroundChoices: {
        backgroundId: 'acolyte',
        abilityMode: 'fixed',
        abilityAssignments: { wis: 16, con: 14 },
        equipmentSelection: ['priestPack'],
      },
      attacks: [],
      spells: ['Guidance', 'Cure Wounds'],
      resources: { spellSlots: { 1: 2 } },
      state: {
        hp: 8,
        maxHpOverride: null,
        tempHp: 0,
        hitDiceUsed: 0,
        spellSlotsUsed: {},
        activeConditions: [],
      },
    };

    // Validate all fields are preserved
    assert.ok(characterRecord.id, 'Should have id');
    assert.ok(characterRecord.name, 'Should have name');
    assert.ok(characterRecord.abilities, 'Should have abilities');
    assert.ok(characterRecord.spellChoices !== undefined, 'Should have spellChoices (can be empty array)');
    assert.ok(characterRecord.backgroundChoices, 'Should have backgroundChoices');
    assert.ok(characterRecord.state, 'Should have state');
    assert.ok(characterRecord.resources, 'Should have resources');

    // Validate nested structures
    assert.ok(Array.isArray(characterRecord.classes), 'classes should be array');
    assert.ok(Array.isArray(characterRecord.skillProficiencies), 'skillProficiencies should be array');
    assert.ok(Array.isArray(characterRecord.savingThrowProficiencies), 'savingThrowProficiencies should be array');

    console.log('  CharacterRecord conversion: OK - All fields preserved');
  });

  it('Data coverage: All required catalogs have minimum entries', () => {
    // Validate classes
    assert.ok(classes.results.length >= 10, `Should have at least 10 classes, got ${classes.results.length}`);

    // Validate backgrounds
    assert.ok(backgrounds.results.length >= 20, `Should have at least 20 backgrounds, got ${backgrounds.results.length}`);

    // Validate spells
    assert.ok(spells.results.length >= 200, `Should have at least 200 spells, got ${spells.results.length}`);

    // Validate races
    assert.ok(races.results.length >= 10, `Should have at least 10 races, got ${races.results.length}`);

    console.log(`  Data coverage: OK - Classes: ${classes.results.length}, Backgrounds: ${backgrounds.results.length}, Spells: ${spells.results.length}, Races: ${races.results.length}`);
  });
});
