import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createSpellAction } from '../backend/src/modules/actions/domain/spell-actions.ts';

const projection: any = {
  spellcasting: { attackBonus: 3, saveDc: 11 },
  spellcastingByAbility: {
    wis: { attackBonus: 9, saveDc: 17 },
    int: { attackBonus: 3, saveDc: 11 },
  },
};

describe('backend spell actions', () => {
  it('uses the spell-specific spellcasting ability for save DC and spell attack', () => {
    const sacredFlame = createSpellAction(
      {
        name: 'Sacred Flame',
        level: 0,
        time: [{ unit: 'action' }],
        range: { distance: { type: 'feet', amount: 60 } },
        entries: ['The target must succeed on a Dexterity saving throw or take {@damage 1d8} Radiant damage.'],
      },
      projection,
      { castMode: 'at-will', spellcastingAbility: 'wis' }
    );

    const guidingBolt = createSpellAction(
      {
        name: 'Guiding Bolt',
        level: 1,
        time: [{ unit: 'action' }],
        range: { distance: { type: 'feet', amount: 120 } },
        entries: ['Make a ranged spell attack against the target. On a hit, it takes {@damage 4d6} Radiant damage.'],
      },
      projection,
      { castMode: 'slots', spellcastingAbility: 'wis' }
    );

    assert.equal(sacredFlame?.hit, '17');
    assert.equal(guidingBolt?.hit, '+9');
  });

  it('does not classify non-damaging buffs as attacks just because they roll dice', () => {
    const bless = createSpellAction(
      {
        name: 'Bless',
        level: 1,
        time: [{ unit: 'action' }],
        range: { distance: { type: 'feet', amount: 30 } },
        entries: ['Whenever a target makes an attack roll or a saving throw before the spell ends, the target adds {@dice 1d4}.'],
      },
      projection,
      { castMode: 'slots', spellcastingAbility: 'wis' }
    );

    assert.equal(bless?.kind, 'action');
    assert.deepEqual(bless?.damage, []);
    assert.equal(bless?.hit, '--');
  });
});
