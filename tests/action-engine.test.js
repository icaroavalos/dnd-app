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

  it('uses dedicated resources for Magic Initiate leveled spells instead of class slots', () => {
    const actions = module.deriveAvailableActions(createContext({
      character: {
        class: 'barbarian',
        attacks: [],
        inventory: [],
        spells: [],
        spellEntries: [
          {
            name: 'Bless',
            level: 1,
            castMode: 'resource',
            resourceId: 'bgSpell:bless',
          },
        ],
        resources: { 'bgSpell:bless': { used: 0, max: 1 } },
        spellSlots: {},
      },
      spellDetails: {
        bless: {
          name: 'Bless',
          level: 1,
          castingTime: '1 action',
          range: '30 feet',
          components: 'V, S, M',
          description: 'Up to three creatures gain a bonus to attack rolls and saving throws.',
        },
      },
      loadedSpellDetails: {},
      resourceDefinitions: [],
    }));

    const bless = actions.find((action) => action.id === 'spell-action:bless');

    assert.equal(bless?.resource, 'bgSpell:bless');
    assert.equal(bless?.slotLevel, null);
    assert.equal(bless?.disabled, false);
  });
});

/**
 * Testes de contrato para derivacao de actions via API.
 * Valida:
 * - Sucesso: backend retorna actions derivadas
 * - Fallback: fallback para derivacao local quando backend falha
 * - Equivalencia: shape das actions basicas
 */

const originalFetch = global.fetch;

function mockFetchSuccess(data) {
  global.fetch = async (url) => ({
    ok: true,
    json: async () => data,
    url,
  });
}

function mockFetchFailure() {
  global.fetch = async () => {
    throw new Error('Network error');
  };
}

function restoreFetch() {
  global.fetch = originalFetch;
}

function createBaseCharacter(overrides = {}) {
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ruleset: '5.5e-2024',
    name: 'Test Character',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: { str: 1, dex: 0, con: 1, int: 0, wis: 1, cha: 0 },
      equipmentSelection: []
    },
    resources: {
      second_wind: { current: 1, max: 1, recovery: 'short_rest' }
    },
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: []
    },
    ...overrides,
  };
}

describe('api-actions-client', () => {
  it('deriveActions returns backend actions on success', async () => {
    const { deriveActions } = await import('../src/lib/api-actions-client.ts');

    mockFetchSuccess([
      {
        id: 'rule:attack',
        kind: 'action',
        icon: 'A',
        name: 'Attack',
        subtitle: 'Combat Action',
        range: '--',
        rangeLabel: 'Varies',
        hit: '--',
        damage: [],
        notes: 'Make one attack.',
        detail: 'Attack action details.',
        cost: { economy: 'action' }
      }
    ]);

    try {
      const result = await deriveActions(createBaseCharacter());
      assert.ok(Array.isArray(result), 'Should return array');
      assert.equal(result.length, 1);
      assert.equal(result[0].name, 'Attack');
      assert.equal(result[0].kind, 'action');
    } finally {
      restoreFetch();
    }
  });

  it('deriveActions throws on backend failure', async () => {
    const { deriveActions } = await import('../src/lib/api-actions-client.ts');

    mockFetchFailure();

    try {
      await deriveActions(createBaseCharacter());
      assert.fail('Should throw on network error');
    } catch (err) {
      assert.ok(err.message.includes('Network error') || err.message.includes('Failed'), 'Should throw network error');
    } finally {
      restoreFetch();
    }
  });
});

describe('action-engine with backend', () => {
  it('deriveAvailableActionsAsync uses backend by default', async () => {
    const { deriveAvailableActionsAsync } = await import('../src/core/engine/action-engine.ts');

    mockFetchSuccess([
      {
        id: 'rule:attack',
        kind: 'action',
        icon: 'A',
        name: 'Attack',
        subtitle: 'Combat Action',
        range: '--',
        rangeLabel: 'Varies',
        hit: '--',
        damage: [],
        notes: 'Make one attack.',
        detail: 'Attack action details.'
      }
    ]);

    try {
      const context = {
        character: { class: 'fighter' },
        projection: { abilityModifiers: { str: 3, dex: 2 }, proficiencyBonus: 2 },
        resourceDefinitions: [],
        spellDetails: {},
        loadedSpellDetails: {},
        compactRange: () => '--',
        rangeLabel: () => 'Varies',
        signed: (v) => `${v >= 0 ? '+' : ''}${v}`,
        slugify: (s) => s.toLowerCase(),
        itemTypeLabel: () => 'Weapon',
        itemTags: () => [],
        entriesToText: () => '',
        resourceRecoveryLabel: () => 'Short Rest'
      };

      const result = await deriveAvailableActionsAsync(createBaseCharacter(), context);
      assert.ok(Array.isArray(result), 'Should return array');
      assert.equal(result[0].name, 'Attack');
    } finally {
      restoreFetch();
    }
  });

  it('deriveAvailableActionsAsync falls back to local when backend fails', async () => {
    const { deriveAvailableActionsAsync, enableBackendDerivation } = await import('../src/core/engine/action-engine.ts');

    mockFetchFailure();

    try {
      const context = {
        character: { class: 'fighter', attacks: [], inventory: [], spells: [] },
        projection: { abilityModifiers: { str: 3, dex: 2 }, proficiencyBonus: 2 },
        resourceDefinitions: [],
        spellDetails: {},
        loadedSpellDetails: {},
        compactRange: () => '--',
        rangeLabel: () => 'Varies',
        signed: (v) => `${v >= 0 ? '+' : ''}${v}`,
        slugify: (s) => s.toLowerCase(),
        itemTypeLabel: () => 'Weapon',
        itemTags: () => [],
        entriesToText: () => '',
        resourceRecoveryLabel: () => 'Short Rest'
      };

      const result = await deriveAvailableActionsAsync(createBaseCharacter(), context);
      assert.ok(Array.isArray(result), 'Should return array from local fallback');
      assert.ok(result.length > 0, 'Should have basic actions');

      const attack = result.find(a => a.id === 'rule:attack');
      assert.ok(attack, 'Should have Attack action');
      assert.equal(attack.name, 'Attack');
      assert.equal(attack.kind, 'action');
    } finally {
      restoreFetch();
    }
  });

  it('enableBackendDerivation can disable backend', async () => {
    const { deriveAvailableActionsAsync, enableBackendDerivation } = await import('../src/core/engine/action-engine.ts');

    enableBackendDerivation(false);

    try {
      mockFetchSuccess([]);

      const context = {
        character: { class: 'fighter', attacks: [], inventory: [], spells: [] },
        projection: { abilityModifiers: { str: 3, dex: 2 }, proficiencyBonus: 2 },
        resourceDefinitions: [],
        spellDetails: {},
        loadedSpellDetails: {},
        compactRange: () => '--',
        rangeLabel: () => 'Varies',
        signed: (v) => `${v >= 0 ? '+' : ''}${v}`,
        slugify: (s) => s.toLowerCase(),
        itemTypeLabel: () => 'Weapon',
        itemTags: () => [],
        entriesToText: () => '',
        resourceRecoveryLabel: () => 'Short Rest'
      };

      const result = await deriveAvailableActionsAsync(createBaseCharacter(), context);
      assert.ok(Array.isArray(result), 'Should return local projection');
      assert.ok(result.length > 0, 'Should have basic actions');

      const attack = result.find(a => a.id === 'rule:attack');
      assert.ok(attack, 'Should have Attack action from local');

      enableBackendDerivation(true);
    } finally {
      restoreFetch();
    }
  });

  it('local derivation includes basic actions', async () => {
    const { deriveAvailableActions } = await import('../src/core/engine/action-engine.ts');

    const context = {
      character: { class: 'fighter', attacks: [], inventory: [], spells: [] },
      projection: { abilityModifiers: { str: 3, dex: 2 }, proficiencyBonus: 2 },
      resourceDefinitions: [],
      spellDetails: {},
      loadedSpellDetails: {},
      compactRange: () => '--',
      rangeLabel: () => 'Varies',
      signed: (v) => `${v >= 0 ? '+' : ''}${v}`,
      slugify: (s) => s.toLowerCase(),
      itemTypeLabel: () => 'Weapon',
      itemTags: () => [],
      entriesToText: () => '',
      resourceRecoveryLabel: () => 'Short Rest'
    };

    const result = deriveAvailableActions(context);
    assert.ok(Array.isArray(result), 'Should return array');
    assert.ok(result.length > 0, 'Should have actions');

    const attack = result.find(a => a.id === 'rule:attack');
    const dash = result.find(a => a.id === 'rule:dash');
    const dodge = result.find(a => a.id === 'rule:dodge');

    assert.ok(attack, 'Should have Attack action');
    assert.ok(dash, 'Should have Dash action');
    assert.ok(dodge, 'Should have Dodge action');
    assert.equal(attack.kind, 'action');
    assert.equal(dash.kind, 'action');
    assert.equal(dodge.kind, 'action');
  });

  it('shape equivalence between backend and local', async () => {
    const { deriveAvailableActionsAsync, deriveAvailableActions } = await import('../src/core/engine/action-engine.ts');

    const backendResponse = [
      {
        id: 'rule:attack',
        kind: 'action',
        icon: 'A',
        name: 'Attack',
        subtitle: 'Combat Action',
        range: '--',
        rangeLabel: 'Varies',
        hit: '--',
        damage: [],
        notes: 'Make one attack.',
        detail: 'Attack action details.'
      },
      {
        id: 'rule:dash',
        kind: 'action',
        icon: 'A',
        name: 'Dash',
        subtitle: 'Combat Action',
        range: 'Self',
        rangeLabel: 'Move',
        hit: '--',
        damage: [],
        notes: 'Extra movement.',
        detail: 'Dash details.'
      }
    ];

    mockFetchSuccess(backendResponse);

    try {
      const context = {
        character: { class: 'fighter', attacks: [], inventory: [], spells: [] },
        projection: { abilityModifiers: { str: 3, dex: 2 }, proficiencyBonus: 2 },
        resourceDefinitions: [],
        spellDetails: {},
        loadedSpellDetails: {},
        compactRange: () => '--',
        rangeLabel: () => 'Varies',
        signed: (v) => `${v >= 0 ? '+' : ''}${v}`,
        slugify: (s) => s.toLowerCase(),
        itemTypeLabel: () => 'Weapon',
        itemTags: () => [],
        entriesToText: () => '',
        resourceRecoveryLabel: () => 'Short Rest'
      };

      const backendResult = await deriveAvailableActionsAsync(createBaseCharacter(), context);
      const localResult = deriveAvailableActions(context);

      assert.equal(backendResult.length, backendResponse.length);
      assert.ok(localResult.length > 0);

      backendResult.forEach(action => {
        assert.ok(action.id, 'Action should have id');
        assert.ok(action.kind, 'Action should have kind');
        assert.ok(action.icon, 'Action should have icon');
        assert.ok(action.name, 'Action should have name');
        assert.ok(action.subtitle, 'Action should have subtitle');
        assert.ok(action.range, 'Action should have range');
        assert.ok(action.rangeLabel, 'Action should have rangeLabel');
        assert.ok(action.hit, 'Action should have hit');
        assert.ok(Array.isArray(action.damage), 'Action should have damage array');
      });
    } finally {
      restoreFetch();
    }
  });
});
