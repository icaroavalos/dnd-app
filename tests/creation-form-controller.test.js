import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const controllerModule = await import('../dist/src/core/state/creation-form-controller.js');

describe('creation form controller', () => {
  it('resets class-driven character state when class changes', () => {
    const { updateCreationField } = controllerModule;

    const character = {
      level: 1,
      class: 'fighter',
      race: 'human',
      subrace: 'Human',
      background: 'Acolyte',
      alignment: 'Neutral',
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      savingThrows: ['str', 'con'],
      classSkillChoices: ['Athletics'],
      classFeatureChoices: { foo: 'bar' },
      asiChoices: { asi: ['str'] },
      bgSpellChoices: { keep: ['Light'] },
      equipmentChoices: { kit: 'a' },
      inventory: ['rope'],
      equippedItems: ['rope'],
    };

    const next = updateCreationField(character, 'class', 'wizard', {
      defaultSaves: (className) => className === 'wizard' ? ['int', 'wis'] : ['str', 'con'],
      maxLevelOneHp: () => 7,
      defaultSubrace: (raceName) => raceName,
      backgroundSkillProficiencies: () => [],
    });

    assert.equal(next.class, 'wizard');
    assert.deepEqual(next.savingThrows, ['int', 'wis']);
    assert.deepEqual(next.classSkillChoices, []);
    assert.deepEqual(next.classFeatureChoices, {});
    assert.deepEqual(next.asiChoices, {});
    assert.deepEqual(next.bgSpellChoices, {});
    assert.deepEqual(next.equipmentChoices, {});
    assert.deepEqual(next.inventory, []);
    assert.deepEqual(next.equippedItems, []);
    assert.equal(next.hp, 7);
  });

  it('updates subrace when race changes', () => {
    const { updateCreationField } = controllerModule;

    const character = {
      level: 1,
      class: 'fighter',
      race: 'human',
      subrace: 'Human',
      background: '',
      alignment: 'Neutral',
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      savingThrows: [],
      classSkillChoices: [],
      classFeatureChoices: {},
      asiChoices: {},
      bgSpellChoices: {},
      equipmentChoices: {},
      inventory: [],
      equippedItems: [],
    };

    const next = updateCreationField(character, 'race', 'elf', {
      defaultSaves: () => [],
      maxLevelOneHp: () => 10,
      defaultSubrace: () => 'High Elf',
      backgroundSkillProficiencies: () => [],
    });

    assert.equal(next.race, 'elf');
    assert.equal(next.subrace, 'High Elf');
  });

  it('applies background-step selection through bgChoices', () => {
    const { applyBackgroundStepSelection } = controllerModule;

    const character = {
      background: '',
      bgChoices: {
        background: null,
        source: 'XPHB',
        abilityIncrement: '2_1',
        abilityScores: ['int', 'wis'],
        skillChoices: [],
        toolChoices: [],
        equipmentChoice: 'A',
        spellcastingAbility: 'wis',
      },
      classSkillChoices: ['Religion'],
      equipmentChoices: { pack: 'a' },
      inventory: ['book'],
      equippedItems: ['book'],
    };

    const next = applyBackgroundStepSelection(character, 'Acolyte');

    assert.equal(next.background, 'Acolyte');
    assert.equal(next.bgChoices.background, 'Acolyte');
    assert.equal(next.bgChoices.source, 'XPHB');
    assert.equal(next.bgChoices.abilityIncrement, null);
    assert.deepEqual(next.bgChoices.abilityScores, []);
    assert.equal(next.bgChoices.equipmentChoice, null);
  });
});
