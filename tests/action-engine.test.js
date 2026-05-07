import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const module = await import('../dist/src/core/engine/action-engine.js');

function createContext(overrides = {}) {
  return {
    character: {
      class: 'rogue',
      attacks: [{ name: 'Rapier', range: '5 feet', type: 'Piercing', damage: '1d8', itemId: 'item-1' }],
      inventory: [{ id: 'item-1', name: 'Rapier', entries: ['Finesse'], type: 'M' }],
      spells: ['Sacred Flame', 'Healing Word'],
      resources: { second_wind: { used: 1, max: 1 } },
      spellSlots: { 1: { used: 1, max: 1 } },
    },
    projection: {
      abilityModifiers: { dex: 3, str: 1 },
      proficiencyBonus: 2,
      spellSaveDc: 13,
      spellAttack: 5,
    },
    resourceDefinitions: [
      {
        id: 'second_wind',
        actionKind: 'bonus',
        kind: 'class',
        name: 'Second Wind',
        className: 'fighter',
        sourceLabel: 'Fighter',
        body: 'Recover hit points.',
        recovery: { short: true },
      },
    ],
    spellDetails: {
      'sacred flame': {
        name: 'Sacred Flame',
        level: 0,
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        description: 'Target makes a saving throw and takes 1d8 radiant damage.',
      },
    },
    loadedSpellDetails: {
      'Healing Word': {
        name: 'Healing Word',
        level: 1,
        castingTime: '1 bonus action',
        range: '60 feet',
        components: 'V',
        description: 'A creature regains 1d4 hit points.',
      },
    },
    compactRange: (value) => value,
    rangeLabel: (value) => (String(value).includes('feet') ? 'Range' : String(value)),
    signed: (value) => (value >= 0 ? `+${value}` : `${value}`),
    slugify: (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    itemTypeLabel: () => 'Weapon / Attack',
    itemTags: () => ['Finesse'],
    entriesToText: (entries) => entries.join(' '),
    resourceRecoveryLabel: (recovery) => (recovery?.short ? 'Short Rest Resource' : 'Limited Use Resource'),
    ...overrides,
  };
}

describe('action engine', () => {
  it('derives attack, spell, and feature actions with disabled state', () => {
    const actions = module.deriveAvailableActions(createContext());

    const rapier = actions.find((action) => action.id.startsWith('attack:0:rapier'));
    const sacredFlame = actions.find((action) => action.id === 'spell-action:sacred-flame');
    const healingWord = actions.find((action) => action.id === 'spell-action:healing-word');
    const secondWind = actions.find((action) => action.id === 'feature:second_wind');
    const secondWindUses = actions.find((action) => action.id === 'limited:second_wind');

    assert.equal(rapier?.hit, '+5');
    assert.deepEqual(rapier?.damage, ['1d8+3']);
    assert.equal(rapier?.notes, 'Finesse');

    assert.equal(sacredFlame?.kind, 'attack');
    assert.equal(sacredFlame?.hit, '13');
    assert.deepEqual(sacredFlame?.damage, ['1d8']);

    assert.equal(healingWord?.kind, 'bonus');
    assert.equal(healingWord?.disabled, true);

    assert.equal(secondWind?.kind, 'bonus');
    assert.equal(secondWind?.disabled, true);
    assert.equal(secondWindUses?.subtitle, 'Short Rest Resource');
  });

  it('keeps basic actions available and exposes icon mapping', () => {
    const actions = module.deriveAvailableActions(createContext({ character: { attacks: [], spells: [], inventory: [], resources: {}, spellSlots: {} } }));
    const basicNames = actions.filter((action) => action.id.startsWith('rule:')).map((action) => action.name);

    assert.deepEqual(basicNames, [
      'Attack',
      'Dash',
      'Dodge',
      'Two-Weapon Fighting',
      'Opportunity Attack',
      'Interact with an Object',
    ]);
    assert.equal(module.actionIconForKind('reaction'), 'R');
    assert.equal(module.isActionDisabled({ resource: 'missing' }, createContext({ character: { resources: {} } })), true);
  });

  it('keeps app.js as a shell instead of redefining legacy action builders', async () => {
    const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

    assert.match(source, /function currentActionItems\(\)/);
    assert.match(source, /return deriveAvailableActions\(actionEngineContext\(\)\);/);
    assert.doesNotMatch(source, /function currentAttackActions\(\)/);
    assert.doesNotMatch(source, /function currentSpellActions\(\)/);
    assert.doesNotMatch(source, /function rulesActionItems\(\)/);
    assert.doesNotMatch(source, /function spellActionVisible\(/);
    assert.doesNotMatch(source, /function actionKindForSpell\(/);
    assert.doesNotMatch(source, /function spellHitOrDc\(/);
    assert.doesNotMatch(source, /function spellDamageChips\(/);
  });
});
