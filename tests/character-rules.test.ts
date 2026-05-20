import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildExclusiveFeatureChoices,
  classPreparedSpellLimit,
  classCantripLimit,
  classResourceLimit,
  instantiateStartingEquipment,
  normalizeClassSavingThrows,
  selectedFeatureNames,
} from '../frontend/src/lib/character-rules.ts';

const clericClass = {
  name: 'Cleric',
  proficiency: ['wis', 'cha'],
  classTableGroups: [
    {
      colLabels: ['Channel Divinity', '{@filter Cantrips|spells|level=0|class=Cleric}', '{@filter Prepared Spells|spells|level=!0|class=Cleric}'],
      rows: [
        [0, 3, 4],
        [2, 3, 5],
        [2, 3, 6],
        [2, 4, 7],
        [2, 4, 9],
        [3, 4, 10],
        [3, 4, 11],
        [3, 4, 12],
        [3, 4, 14],
        [3, 5, 15],
      ],
    },
  ],
  startingEquipment: {
    defaultData: [
      {
        A: [
          { item: 'chain shirt|xphb' },
          { item: 'shield|xphb' },
          { item: 'mace|xphb' },
          { item: 'holy symbol|xphb' },
          { item: "priest's pack|xphb" },
          { value: 700 },
        ],
      },
    ],
  },
};

const itemCatalog = [
  { id: 'chain-shirt|xphb', name: 'Chain Shirt', type: 'MA', ac: 13, weight: 20 },
  { id: 'shield|xphb', name: 'Shield', type: 'S', ac: 2, weight: 6 },
  { id: 'mace|xphb', name: 'Mace', type: 'M', dmg1: '1d6', weight: 4 },
  { id: 'holy-symbol|xphb', name: 'Holy Symbol', type: 'SCF', weight: 0 },
  { id: 'priest-s-pack|xphb', name: "Priest's Pack", type: 'G', weight: 24 },
];

describe('character rules helpers', () => {
  it('normalizes class saving throw proficiencies from catalog data', () => {
    assert.deepEqual(normalizeClassSavingThrows(clericClass), ['wis', 'cha']);
  });

  it('instantiates starting equipment with catalog details, currency, and default equip slots', () => {
    const result = instantiateStartingEquipment(clericClass.startingEquipment, 'A', itemCatalog, 'class');

    assert.deepEqual(result.currency, { cp: 0, sp: 0, ep: 0, gp: 7, pp: 0 });
    assert.equal(result.inventory.find((item) => item.baseItemId === 'chain shirt|xphb')?.status, 'equipped_armor');
    assert.equal(result.inventory.find((item) => item.baseItemId === 'shield|xphb')?.status, 'equipped_shield');
    assert.equal(result.inventory.find((item) => item.baseItemId === 'mace|xphb')?.status, 'equipped_main_hand');
    assert.equal(result.inventory.find((item) => item.baseItemId === 'mace|xphb')?.dmg1, '1d6');
  });

  it('reads class table cantrips, prepared spell limits, and class resources generically', () => {
    assert.equal(classCantripLimit(clericClass, 10), 5);
    assert.equal(classPreparedSpellLimit(clericClass, 10), 15);
    assert.equal(classResourceLimit(clericClass, 10, 'Channel Divinity'), 3);
  });

  it('turns one-of-following referenced features into an exclusive choice', () => {
    const features = [
      {
        id: 'blessed-strikes-7',
        name: 'Blessed Strikes',
        description: 'Divine power infuses you in battle. You gain one of the following options of your choice.',
        entries: [
          'Divine power infuses you in battle. You gain one of the following options of your choice.',
          {
            type: 'entries',
            entries: [
              { type: 'refClassFeature', classFeature: 'Divine Strike|Cleric|XPHB|7' },
              { type: 'refClassFeature', classFeature: 'Potent Spellcasting|Cleric|XPHB|7' },
            ],
          },
        ],
      },
      { id: 'divine-strike-7', name: 'Divine Strike', description: 'Weapon damage.' },
      { id: 'potent-spellcasting-7', name: 'Potent Spellcasting', description: 'Cantrip damage.' },
    ];

    const choices = buildExclusiveFeatureChoices(features as any);
    assert.deepEqual(choices, [
      {
        id: 'feature-choice-blessed-strikes-7',
        featureId: 'blessed-strikes-7',
        name: 'Blessed Strikes',
        count: 1,
        options: ['Divine Strike', 'Potent Spellcasting'],
        type: 'generic',
      },
    ]);
    assert.deepEqual(selectedFeatureNames(features as any, { 'feature-choice-blessed-strikes-7': ['Divine Strike'] }), [
      'Blessed Strikes',
      'Divine Strike',
    ]);
  });
});
