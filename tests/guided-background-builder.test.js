import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const module = await import('../dist/src/core/state/guided-background-builder.js');

describe('guided background builder', () => {
  const source = {
    backgroundOptions: [
      ['Acolyte', 'Acolyte'],
      ['Criminal', 'Criminal'],
      ['Hermit', 'Hermit'],
      ['Soldier', 'Soldier'],
    ],
    backgroundDetails: {
      acolyte: {
        name: 'Acolyte',
        source: 'XPHB',
        ability: [{ choose: { weighted: { from: ['int', 'wis', 'cha'], weights: [2, 1] } } }],
        skillProficiencies: [{ insight: true, religion: true }],
        toolProficiencies: [{ "calligrapher's supplies": true }],
        startingEquipment: [{ A: [{ item: 'book|xphb' }], B: [{ value: 5000 }] }],
        feats: [{ 'magic initiate;cleric|xphb': true }],
      },
      criminal: {
        name: 'Criminal',
        source: 'XPHB',
        ability: [{ choose: { weighted: { from: ['dex', 'con', 'int'], weights: [2, 1] } } }],
        skillProficiencies: [{ sleight_of_hand: true, stealth: true }],
        toolProficiencies: [{ "thieves' tools": true }],
        startingEquipment: [{ A: [{ item: 'crowbar|xphb' }], B: [{ value: 5000 }] }],
      },
      hermit: {
        name: 'Hermit',
        source: 'XPHB',
        ability: [{ choose: { weighted: { from: ['con', 'wis', 'cha'], weights: [2, 1] } } }],
        skillProficiencies: [{ medicine: true, religion: true }],
        toolProficiencies: [{ 'herbalism kit': true }],
        startingEquipment: [{ A: [{ item: 'quarterstaff|xphb' }], B: [{ value: 5000 }] }],
      },
      soldier: {
        name: 'Soldier',
        source: 'XPHB',
        ability: [{ choose: { weighted: { from: ['str', 'dex', 'con'], weights: [2, 1] } } }],
        skillProficiencies: [{ athletics: true, intimidation: true }],
        toolProficiencies: [{ 'gaming set': true, 'land vehicles': true }],
        startingEquipment: [{ A: [{ item: 'spear|xphb' }], B: [{ value: 5000 }] }],
      },
    },
  };

  it('builds guided options from the 5etools source catalog', () => {
    const model = module.buildGuidedBackgroundViewModel({ background: 'Hermit' }, source);

    assert.equal(model.currentBackground, 'Hermit');
    assert.deepEqual(model.options.map((option) => option.value), ['Acolyte', 'Criminal', 'Hermit', 'Soldier']);
    assert.deepEqual(model.abilityOptions.map((option) => option.value), ['con', 'wis', 'cha']);
    assert.deepEqual(model.skills, ['Medicine', 'Religion']);
    assert.deepEqual(model.tools, ['Herbalism Kit']);
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
    }, source);

    assert.equal(model.currentBackground, 'Acolyte');
    assert.deepEqual(model.options.map((option) => option.value), ['Acolyte', 'Criminal', 'Hermit', 'Soldier']);
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

  it('normalizes backgrounds against the supplied source catalog instead of a hardcoded list', () => {
    assert.equal(module.normalizeGuidedBackground('Criminal', source), 'Criminal');
    assert.equal(module.normalizeGuidedBackground('Noble', source), null);
  });

  it('can expose every XPHB background from the compact 5etools data file', () => {
    const data = JSON.parse(readFileSync('./data/5etools/5e-2024/backgrounds.json', 'utf8'));
    const backgrounds = data.results.filter((background) => background.source === 'XPHB');
    const realSource = {
      backgroundOptions: backgrounds.map((background) => [background.name, background.name]),
      backgroundDetails: Object.fromEntries(backgrounds.map((background) => [background.name.toLowerCase(), background])),
    };

    const model = module.buildGuidedBackgroundViewModel({ background: 'Guide' }, realSource);

    assert.equal(backgrounds.length, 16);
    assert.equal(model.options.length, 16);
    assert.ok(model.options.some((option) => option.value === 'Guide'));
    assert.ok(model.options.some((option) => option.value === 'Sage'));
    assert.equal(model.showsMagicInitiate, true);
    assert.equal(model.magicInitiateClass, 'druid');
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
