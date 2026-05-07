import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../dist/src/core/state/guided-background-builder.js');

describe('guided background builder', () => {
  it('supports only Acolyte and Soldier in the guided builder', () => {
    assert.deepEqual(module.SUPPORTED_GUIDED_BACKGROUNDS, ['Acolyte', 'Soldier']);
  });

  it('builds a typed Acolyte view model with ability and magic initiate data', () => {
    const model = module.buildGuidedBackgroundViewModel({
      background: 'Acolyte',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['wis'],
      skillChoices: [],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: 'cha',
    });

    assert.equal(model.currentBackground, 'Acolyte');
    assert.deepEqual(model.options.map((option) => option.value), ['Acolyte', 'Soldier']);
    assert.deepEqual(model.abilityOptions.map((option) => option.value), ['int', 'wis', 'cha']);
    assert.equal(model.showsMagicInitiate, true);
    assert.equal(model.selectedAbilityCount, 1);
    assert.equal(model.maxAbilityChoices, 2);
    assert.equal(model.abilityOptions.find((option) => option.value === 'wis')?.selected, true);
    assert.equal(model.abilityOptions.find((option) => option.value === 'wis')?.bonus, 2);
  });

  it('updates background ability selections through typed state helpers', () => {
    const withIncrement = module.applyGuidedBackgroundIncrement(module.createGuidedBackgroundChoiceState('Soldier'), '1_1_1');
    const withStr = module.toggleGuidedBackgroundAbility(withIncrement, 'str', true);
    const withDex = module.toggleGuidedBackgroundAbility(withStr, 'dex', true);
    const withCon = module.toggleGuidedBackgroundAbility(withDex, 'con', true);
    const ignoredExtra = module.toggleGuidedBackgroundAbility(withCon, 'wis', true);

    assert.deepEqual(withCon.abilityScores, ['str', 'dex', 'con']);
    assert.deepEqual(ignoredExtra.abilityScores, ['str', 'dex', 'con']);
  });

  it('creates a complete guided background state before applying equipment and spellcasting updates', () => {
    const ensured = module.ensureGuidedBackgroundChoiceState(null, 'Acolyte');
    const withEquipment = module.applyGuidedBackgroundEquipmentChoice(ensured, 'A');
    const withAbility = module.applyGuidedBackgroundSpellcastingAbility(withEquipment, 'wis');

    assert.equal(ensured.background, 'Acolyte');
    assert.deepEqual(ensured.abilityScores, []);
    assert.equal(withEquipment.equipmentChoice, 'A');
    assert.equal(withAbility.spellcastingAbility, 'wis');
  });
});
