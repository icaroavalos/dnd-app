import assert from 'node:assert/strict';
import test from 'node:test';

import { build5etoolsApi } from '../src/app/5etools-source.js';

const helpers = {
  slugifyName: (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  entriesToText: (entries) => Array.isArray(entries) ? entries.join(' ') : String(entries ?? ''),
  itemKey: (name, source) => `${name}|${source}`,
  deriveProficiencyBonus: (level) => Math.ceil((Number(level) || 1) / 4) + 1,
  buildSpellClassIndex: () => new Map(),
  normalize5etoolsSpell: (spell) => spell,
};

const emptyCatalogs = {
  classes: [],
  subraces: [],
  equipment: [],
  spells: [],
  classSpells: {},
  classFeatures: [],
  subclassFeatures: [],
  subclasses: [],
  feats: [],
  backgrounds: [],
};

test('build5etoolsApi accepts array catalog results used by frontend hydration', () => {
  const api = build5etoolsApi(
    {
      ...emptyCatalogs,
      races: [
        { name: 'Aarakocra', source: 'MPMM', entries: [], size: ['M'], speed: 30 },
        { name: 'Dragonborn', source: 'XPHB', entries: [], size: ['M'], speed: 30 },
      ],
    },
    helpers,
  );

  assert.deepEqual(api.source.raceOptions, [
    ['aarakocra', 'Aarakocra'],
    ['dragonborn', 'Dragonborn'],
  ]);
  assert.ok(api.races.aarakocra, 'MPMM species should be available in the builder API');
});

test('build5etoolsApi keeps wrapped catalog result compatibility', () => {
  const api = build5etoolsApi(
    {
      ...emptyCatalogs,
      races: {
        results: [
          { name: 'Aasimar', source: 'MPMM', entries: [], size: ['M'], speed: 30 },
        ],
      },
    },
    helpers,
  );

  assert.deepEqual(api.source.raceOptions, [['aasimar', 'Aasimar']]);
});
