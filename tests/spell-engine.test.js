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
    assert.match(source, /currentSpellEntries as typedCurrentSpellEntries/);
    assert.match(source, /resolveSelectedSpellName as typedResolveSelectedSpellName/);
    assert.match(source, /function currentSheetSpellEntries\(\)/);
    assert.doesNotMatch(source, /function currentKnownSpellNames\(/);
    assert.doesNotMatch(source, /backgroundSpellAbility\(\)/);
  });

  it('derives Magic Initiate background spells as separate spell resources for non-casters', () => {
    const spellEntries = module.currentSpellEntries(
      {
        class: 'barbarian',
        level: 1,
        background: 'Acolyte',
        spells: [],
        bgChoices: {
          background: 'Acolyte',
          spellcastingAbility: 'wis',
        },
        bgSpellChoices: {
          'bg-bg-magic-initiate-cleric-0': ['Resistance', 'Sacred Flame', 'Bless'],
        },
      },
      {
        classes: {
          barbarian: { name: 'Barbarian' },
        },
        levels: {},
        races: {},
        spells: [],
        classSpells: {
          cleric: [
            { name: 'Resistance', level: 0, source: 'XPHB' },
            { name: 'Sacred Flame', level: 0, source: 'XPHB' },
            { name: 'Bless', level: 1, source: 'XPHB' },
          ],
        },
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
            resistance: { name: 'Resistance', level: 0 },
            'sacred flame': { name: 'Sacred Flame', level: 0 },
            bless: { name: 'Bless', level: 1 },
          },
        },
      },
      []
    );

    const bless = spellEntries.find((spell) => spell.name === 'Bless');
    const sacredFlame = spellEntries.find((spell) => spell.name === 'Sacred Flame');

    assert.equal(bless?.origin, 'background');
    assert.equal(bless?.castMode, 'resource');
    assert.equal(bless?.resourceId, 'bgSpell:bless');
    assert.equal(sacredFlame?.castMode, 'at-will');

    const resources = module.backgroundSpellResourceDefinitions(
      {
        class: 'barbarian',
        level: 1,
        background: 'Acolyte',
        spells: [],
        bgChoices: {
          background: 'Acolyte',
          spellcastingAbility: 'wis',
        },
        bgSpellChoices: {
          'bg-bg-magic-initiate-cleric-0': ['Resistance', 'Sacred Flame', 'Bless'],
        },
      },
      {
        classes: {
          barbarian: { name: 'Barbarian' },
        },
        levels: {},
        races: {},
        spells: [],
        classSpells: {
          cleric: [
            { name: 'Resistance', level: 0, source: 'XPHB' },
            { name: 'Sacred Flame', level: 0, source: 'XPHB' },
            { name: 'Bless', level: 1, source: 'XPHB' },
          ],
        },
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
            resistance: { name: 'Resistance', level: 0 },
            'sacred flame': { name: 'Sacred Flame', level: 0 },
            bless: { name: 'Bless', level: 1 },
          },
        },
      }
    );

    assert.deepEqual(resources, [
      {
        id: 'bgSpell:bless',
        name: 'Bless',
        kind: 'spell',
        sourceLabel: 'Magic Initiate (Cleric)',
        body: 'Cast Bless once without using a class spell slot. You regain the ability to cast it this way when you finish a Long Rest.',
        level: 1,
        max: 1,
        recovery: { long: 'all' },
        actionKind: 'action',
      },
    ]);
  });
});
