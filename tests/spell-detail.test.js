import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../dist/src/core/character/spell-detail.js');

describe('spell detail normalization', () => {
  it('builds dense spell detail cards from local 5etools data', () => {
    const classIndex = module.buildSpellClassIndex({
      cleric: [{ name: 'Bless', level: 1, source: 'XPHB' }],
      paladin: [{ name: 'Bless', level: 1, source: 'XPHB' }],
    });

    const detail = module.normalize5etoolsSpell({
      name: 'Bless',
      source: 'XPHB',
      page: 247,
      level: 1,
      school: 'E',
      time: [{ number: 1, unit: 'action' }],
      range: { type: 'point', distance: { type: 'feet', amount: 30 } },
      components: {
        v: true,
        s: true,
        m: { text: 'a Holy Symbol worth 5+ GP', cost: 500 },
      },
      duration: [{ type: 'timed', duration: { type: 'minute', amount: 1 }, concentration: true }],
      entries: ['You bless up to three creatures within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target adds {@dice 1d4} to the attack roll or save.'],
      entriesHigherLevel: [{ type: 'entries', name: 'Using a Higher-Level Spell Slot', entries: ['You can target one additional creature for each spell slot level above 1.'] }],
      meta: { ritual: true },
      damageInflict: ['radiant'],
    }, classIndex);

    assert.equal(detail.levelLine, '1st-level Enchantment');
    assert.equal(detail.concentration, true);
    assert.equal(detail.ritual, true);
    assert.equal(detail.castingTime, '1 action');
    assert.equal(detail.range, '30 feet');
    assert.equal(detail.duration, 'Concentration, up to 1 minute');
    assert.equal(detail.material, 'a Holy Symbol worth 5+ GP');
    assert.equal(detail.saveOrAttack, '-');
    assert.deepEqual(detail.damageTypes, ['Radiant']);
    assert.deepEqual(detail.traditions, ['Divine']);
    assert.deepEqual(detail.classes, ['Cleric', 'Paladin']);
    assert.equal(detail.reference, 'XPHB • p. 247');
  });

  it('resolves full spell detail objects before the sheet renders a spell card', () => {
    const detail = module.resolveSpellDetail('Guidance', {
      spellDetails: {},
      source: {
        spellDetails: {
          guidance: {
            name: 'Guidance',
            level: 0,
            levelLine: 'Divination cantrip',
            description: 'You touch a willing creature.',
            castingTime: '1 action',
            range: 'Touch',
            duration: 'Concentration, up to 1 minute',
          },
        },
      },
    });

    assert.equal(detail?.name, 'Guidance');
    assert.equal(detail?.description, 'You touch a willing creature.');
    assert.equal(detail?.levelLine, 'Divination cantrip');
  });
});
