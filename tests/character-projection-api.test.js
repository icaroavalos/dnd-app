/**
 * Testes de contrato para o client de projeção de personagem.
 *
 * Valida:
 * - Sucesso: backend retorna projeção correta
 * - Fallback: fallback para projeção local quando backend falha
 * - Equivalência: shape da backend é equivalente ao local
 */

import assert from 'node:assert/strict';
import test from 'node:test';

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

test('api-character-project-client: projectCharacter returns backend projection on success', async () => {
  const { projectCharacter } = await import('../dist/src/lib/api-character-project-client.js');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    level: 1,
    proficiencyBonus: 2,
    abilityScores: { str: 17, dex: 14, con: 14, int: 10, wis: 11, cha: 10 },
    abilityModifiers: { str: 3, dex: 2, con: 2, int: 0, wis: 0, cha: 0 },
    savingThrows: { str: 5, dex: 2, con: 4, int: 0, wis: 0, cha: 0 },
    skillBonuses: { Athletics: 5, Perception: 2 },
    armorClass: 12,
    initiative: 2,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 12,
    spellcasting: null,
    spellSlotsMax: {},
    resources: { second_wind: { current: 1, max: 1, recovery: 'short_rest' } }
  });

  try {
    const result = await projectCharacter(createBaseCharacter());
    assert.ok(result.level, 'Should return level');
    assert.equal(result.level, 1);
    assert.equal(result.proficiencyBonus, 2);
    assert.ok(result.abilityScores, 'Should return abilityScores');
    assert.ok(result.abilityModifiers, 'Should return abilityModifiers');
    assert.ok(result.savingThrows, 'Should return savingThrows');
    assert.ok(result.skillBonuses, 'Should return skillBonuses');
    assert.ok(result.armorClass, 'Should return armorClass');
    assert.ok(result.initiative, 'Should return initiative');
    assert.ok(result.maxHp, 'Should return maxHp');
    assert.ok(result.currentHp, 'Should return currentHp');
    assert.ok(result.passivePerception, 'Should return passivePerception');
    assert.ok(result.spellSlotsMax !== undefined, 'Should return spellSlotsMax');
    assert.ok(result.resources, 'Should return resources');
  } finally {
    restoreFetch();
  }
});

test('api-character-project-client: projectCharacter throws on backend failure', async () => {
  const { projectCharacter } = await import('../dist/src/lib/api-character-project-client.js');

  mockFetchFailure();

  try {
    await projectCharacter(createBaseCharacter());
    assert.fail('Should throw on network error');
  } catch (err) {
    assert.ok(err.message.includes('Network error') || err.message.includes('Failed'), 'Should throw network error');
  } finally {
    restoreFetch();
  }
});

test('api-character-project-client: projectCharacter handles spellcasting correctly', async () => {
  const { projectCharacter } = await import('../dist/src/lib/api-character-project-client.js');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    level: 1,
    proficiencyBonus: 2,
    abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 14, cha: 10 },
    abilityModifiers: { str: 3, dex: 2, con: 2, int: 0, wis: 2, cha: 0 },
    savingThrows: { str: 5, dex: 2, con: 4, int: 0, wis: 2, cha: 0 },
    skillBonuses: { Athletics: 5 },
    armorClass: 12,
    initiative: 2,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 12,
    spellcasting: {
      ability: 'wis',
      attackBonus: 4,
      saveDc: 12
    },
    spellSlotsMax: { '1': 2 },
    resources: {}
  });

  try {
    const result = await projectCharacter(createBaseCharacter());
    assert.ok(result.spellcasting, 'Should return spellcasting');
    assert.equal(result.spellcasting.ability, 'wis');
    assert.equal(result.spellcasting.attackBonus, 4);
    assert.equal(result.spellcasting.saveDc, 12);
    assert.ok(result.spellSlotsMax, 'Should return spellSlotsMax');
    assert.equal(result.spellSlotsMax['1'], 2);
  } finally {
    restoreFetch();
  }
});

test('api-character-project-client: createDebouncedProjector debounces calls', async () => {
  const { createDebouncedProjector } = await import('../dist/src/lib/api-character-project-client.js');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    level: 1,
    proficiencyBonus: 2,
    abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    abilityModifiers: { str: 3, dex: 2, con: 2, int: 0, wis: 0, cha: 0 },
    savingThrows: { str: 5, dex: 2, con: 4, int: 0, wis: 0, cha: 0 },
    skillBonuses: { Athletics: 5 },
    armorClass: 12,
    initiative: 2,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 12,
    spellcasting: null,
    spellSlotsMax: {},
    resources: {}
  });

  try {
    const projector = createDebouncedProjector(50);
    let callCount = 0;
    let result = null;

    await new Promise((resolve) => {
      projector(createBaseCharacter(), (res) => {
        callCount++;
        result = res;
        resolve();
      });
    });

    assert.equal(callCount, 1, 'Should call callback once');
    assert.ok(result, 'Should return result');
    assert.ok(result.level, 'Result should have level');
  } finally {
    restoreFetch();
  }
});

test('api-character-project-client: createDebouncedProjector cancel works', async () => {
  const { createDebouncedProjector } = await import('../dist/src/lib/api-character-project-client.js');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    level: 1,
    proficiencyBonus: 2,
    abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    abilityModifiers: { str: 3, dex: 2, con: 2, int: 0, wis: 0, cha: 0 },
    savingThrows: { str: 5, dex: 2, con: 4, int: 0, wis: 0, cha: 0 },
    skillBonuses: { Athletics: 5 },
    armorClass: 12,
    initiative: 2,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 12,
    spellcasting: null,
    spellSlotsMax: {},
    resources: {}
  });

  try {
    const projector = createDebouncedProjector(50);
    let callCount = 0;

    projector(createBaseCharacter(), () => {
      callCount++;
    });
    projector.cancel();

    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.equal(callCount, 0, 'Should not call callback after cancel');
  } finally {
    restoreFetch();
  }
});

test('character-projection: projectCharacterSheet uses backend by default', async () => {
  const { projectCharacter } = await import('../dist/src/lib/api-character-project-client.js');
  const { projectCharacterSheet } = await import('../dist/src/core/character/character-projection.js');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    level: 1,
    proficiencyBonus: 2,
    abilityScores: { str: 17, dex: 14, con: 14, int: 10, wis: 11, cha: 10 },
    abilityModifiers: { str: 3, dex: 2, con: 2, int: 0, wis: 0, cha: 0 },
    savingThrows: { str: 5, dex: 2, con: 4, int: 0, wis: 0, cha: 0 },
    skillBonuses: { Athletics: 5, Perception: 2 },
    armorClass: 12,
    initiative: 2,
    speed: 30,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    passivePerception: 12,
    spellcasting: null,
    spellSlotsMax: {},
    resources: { second_wind: { current: 1, max: 1, recovery: 'short_rest' } }
  });

  try {
    const result = await projectCharacterSheet(createBaseCharacter());
    assert.ok(result.level, 'Should return level');
    assert.equal(result.level, 1);
    assert.equal(result.proficiencyBonus, 2);
    assert.ok(result.abilityScores, 'Should return abilityScores');
    assert.ok(result.armorClass, 'Should return armorClass');
    assert.equal(result.currentHp, 12);
  } finally {
    restoreFetch();
  }
});

test('character-projection: projectCharacterSheet throws on backend failure (no fallback)', async () => {
  const { projectCharacterSheet } = await import('../dist/src/core/character/character-projection.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => projectCharacterSheet(createBaseCharacter()),
      {
        message: /Network error|Failed/,
      },
      'Should throw on backend failure - no local fallback'
    );
  } finally {
    restoreFetch();
  }
});

test('api-character-project-client: shape equivalence with backend', async () => {
  const { projectCharacter } = await import('../dist/src/lib/api-character-project-client.js');

  const backendResponse = {
    ruleset: '5.5e-2024',
    level: 3,
    proficiencyBonus: 2,
    abilityScores: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 10 },
    abilityModifiers: { str: 3, dex: 2, con: 2, int: 0, wis: 1, cha: 0 },
    savingThrows: { str: 5, dex: 2, con: 4, int: 0, wis: 1, cha: 0 },
    skillBonuses: { Athletics: 5, Perception: 3, Stealth: 4 },
    armorClass: 15,
    initiative: 2,
    speed: 30,
    maxHp: 24,
    currentHp: 24,
    tempHp: 0,
    passivePerception: 13,
    spellcasting: null,
    spellSlotsMax: {},
    resources: { second_wind: { current: 1, max: 1, recovery: 'short_rest' } }
  };

  mockFetchSuccess(backendResponse);

  try {
    const result = await projectCharacter(createBaseCharacter());

    assert.equal(result.ruleset, '5.5e-2024');
    assert.equal(result.level, 3);
    assert.equal(result.proficiencyBonus, 2);
    assert.equal(result.abilityScores.str, 16);
    assert.equal(result.abilityModifiers.str, 3);
    assert.equal(result.savingThrows.str, 5);
    assert.equal(result.armorClass, 15);
    assert.equal(result.initiative, 2);
    assert.equal(result.maxHp, 24);
    assert.equal(result.currentHp, 24);
    assert.equal(result.passivePerception, 13);
  } finally {
    restoreFetch();
  }
});
