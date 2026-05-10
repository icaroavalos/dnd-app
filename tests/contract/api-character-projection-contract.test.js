/**
 * Contract tests for character projection API endpoints
 * Validates shape compatibility between frontend client and backend
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

test('characters/project: POST response shape on success', async () => {
  const { projectCharacter } = await import('../../src/lib/api-character-project-client.ts');

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
    resources: { second_wind: { current: 1, max: 1, recovery: 'short_rest' } },
  });

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
      skillProficiencies: ['Athletics'],
      savingThrowProficiencies: ['str', 'con'],
    };

    const result = await projectCharacter(character);

    // Validate core fields
    assert.ok(result.ruleset, 'Should return ruleset');
    assert.ok(result.level, 'Should return level');
    assert.ok(result.proficiencyBonus, 'Should return proficiencyBonus');
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

    // Validate ability scores structure
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (const ability of abilities) {
      assert.ok(result.abilityScores[ability] !== undefined, `${ability} score is required`);
      assert.ok(result.abilityModifiers[ability] !== undefined, `${ability} modifier is required`);
      assert.ok(result.savingThrows[ability] !== undefined, `${ability} save is required`);
    }
  } finally {
    restoreFetch();
  }
});

test('characters/project: throws on network failure', async () => {
  const { projectCharacter } = await import('../../src/lib/api-character-project-client.ts');

  mockFetchFailure();

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    };

    await assert.rejects(
      async () => projectCharacter(character),
      /Network error|Failed/,
      'Should throw on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('characters/project: handles spellcasting correctly', async () => {
  const { projectCharacter } = await import('../../src/lib/api-character-project-client.ts');

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
      saveDc: 12,
    },
    spellSlotsMax: { '1': 2 },
    resources: {},
  });

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'cleric',
      level: 1,
      abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 14, cha: 10 },
    };

    const result = await projectCharacter(character);

    assert.ok(result.spellcasting, 'Should return spellcasting');
    assert.equal(result.spellcasting.ability, 'wis', 'Should return correct spellcasting ability');
    assert.equal(result.spellcasting.attackBonus, 4, 'Should return correct attack bonus');
    assert.equal(result.spellcasting.saveDc, 12, 'Should return correct save DC');
    assert.ok(result.spellSlotsMax, 'Should return spellSlotsMax');
    assert.equal(result.spellSlotsMax['1'], 2, 'Should return correct level 1 slots');
  } finally {
    restoreFetch();
  }
});