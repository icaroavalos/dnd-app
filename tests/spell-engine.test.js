import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const module = await import('../dist/src/core/character/spell-engine.js');

describe('spell engine', () => {
  it('builds the sheet spell list from class, auto-granted, and background spells', () => {
    const names = module.currentKnownSpellNames(
      {
        class: 'fighter',
        level: 1,
        background: 'Acolyte',
        spells: ['Guidance'],
        bgChoices: {
          background: 'Acolyte',
          spellcastingAbility: 'wis',
        },
        bgSpellChoices: {
          'bg-bg-magic-initiate-cleric-0': ['Resistance', 'Light', 'Bless'],
        },
      },
      {
        classes: {},
        levels: {},
        races: {},
        spells: [],
        classSpells: {},
        spellDetails: {},
        source: {
          classOptions: [],
          raceOptions: [],
          backgroundOptions: [],
          backgroundDetails: {
            acolyte: {
              name: 'Acolyte',
              source: 'XPHB',
              feats: [
                {
                  'Magic Initiate; Cleric': true,
                },
              ],
              entries: [
                'Choose two Cleric cantrips and one level 1 Cleric spell.'
              ],
            },
          },
          subraceDetails: {},
          itemDetails: {},
          classFeatures: [],
          subclasses: [],
          featDetails: {},
          spellDetails: {
            guidance: { name: 'Guidance', level: 0 },
            resistance: { name: 'Resistance', level: 0 },
            light: { name: 'Light', level: 0 },
            bless: { name: 'Bless', level: 1 },
            thaumaturgy: { name: 'Thaumaturgy', level: 0 },
          },
        },
      },
      [
        {
          name: 'Human Versatile',
          body: 'You always have {@spell Thaumaturgy} prepared.',
        },
      ]
    );

    assert.deepEqual(names, ['Guidance', 'Thaumaturgy', 'Resistance', 'Light', 'Bless']);
    assert.equal(module.resolveSelectedSpellName('Bless', names), 'Bless');
    assert.equal(module.resolveSelectedSpellName('Missing', names), 'Guidance');
    assert.equal(module.resolveSelectedSpellName('Missing', []), '');
  });

  it('keeps app.js consuming typed spell helpers for attacks and spells tabs', async () => {
    const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

    assert.match(source, /currentKnownSpellNames as typedCurrentKnownSpellNames/);
    assert.match(source, /resolveSelectedSpellName as typedResolveSelectedSpellName/);
    assert.match(source, /typedBackgroundSpellAbility\(state\.character, state\.api\)/);
    assert.doesNotMatch(source, /function currentKnownSpellNames\(/);
    assert.doesNotMatch(source, /backgroundSpellAbility\(\)/);
  });
});
