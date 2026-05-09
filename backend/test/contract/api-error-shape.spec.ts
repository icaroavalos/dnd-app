import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../../src/main.js';

/**
 * Testes de contrato para o shape padrão de erros da API.
 *
 * Todos os erros da API devem seguir o formato:
 * {
 *   statusCode: number,
 *   error: { code: string, message: string },
 *   path: string,
 *   requestId: string
 * }
 */

test('API error shape: POST /resources/use with invalid resource returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: {
          id: 'char-test',
          ruleset: 'ld-2024',
          name: 'Test',
          lineageId: 'human',
          backgroundId: 'soldier',
          alignment: 'Neutral',
          experience: 0,
          classes: [{ classId: 'fighter', level: 1 }],
          abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          skillProficiencies: [],
          savingThrowProficiencies: [],
          inventory: [],
          spellChoices: [],
          resources: {},
          state: {
            hp: 10,
            maxHpOverride: null,
            tempHp: 0,
            hitDiceUsed: 0,
            spellSlotsUsed: {},
            activeConditions: []
          }
        },
        resourceId: 'nonexistent_resource'
      }
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 404);
    assert.equal(body.statusCode, 404);

    // Error object structure
    assert.ok(body.error, 'Should have error object');
    assert.ok(typeof body.error.code === 'string', 'error.code should be a string');
    assert.ok(typeof body.error.message === 'string', 'error.message should be a string');
    assert.ok(body.error.code.includes('RESOURCE'), 'error.code should reference resource');

    // Path
    assert.equal(body.path, '/resources/use');

    // Request ID (for tracing)
    assert.ok(body.requestId, 'Should have requestId for tracing');
    assert.match(body.requestId, /^req-/);
  } finally {
    await app.close();
  }
});

test('API error shape: POST /inventory/spend-ammo with insufficient ammo returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: {
        character: {
          id: 'char-test',
          ruleset: 'ld-2024',
          name: 'Test',
          lineageId: 'human',
          backgroundId: 'soldier',
          alignment: 'Neutral',
          experience: 0,
          classes: [{ classId: 'fighter', level: 1 }],
          abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 },
          skillProficiencies: [],
          savingThrowProficiencies: [],
          inventory: [
            { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' }
          ],
          spellChoices: [],
          resources: {},
          state: {
            hp: 10,
            maxHpOverride: null,
            tempHp: 0,
            hitDiceUsed: 0,
            spellSlotsUsed: {},
            activeConditions: []
          }
        },
        weaponItemId: 'item-inst-longbow',
        amount: 100 // More than available
      }
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 409);
    assert.equal(body.statusCode, 409);

    // Error object structure
    assert.ok(body.error, 'Should have error object');
    assert.equal(body.error.code, 'AMMO_UNAVAILABLE');
    assert.ok(typeof body.error.message === 'string');
    assert.ok(body.error.message.toLowerCase().includes('not enough'));

    // Path
    assert.equal(body.path, '/inventory/spend-ammo');

    // Request ID
    assert.ok(body.requestId, 'Should have requestId');
    assert.match(body.requestId, /^req-/);
  } finally {
    await app.close();
  }
});

test('API error shape: POST /resources/use with zero resources returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: {
          id: 'char-test',
          ruleset: 'ld-2024',
          name: 'Test',
          lineageId: 'human',
          backgroundId: 'soldier',
          alignment: 'Neutral',
          experience: 0,
          classes: [{ classId: 'fighter', level: 1 }],
          abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          skillProficiencies: [],
          savingThrowProficiencies: [],
          inventory: [],
          spellChoices: [],
          resources: {
            second_wind: { current: 0, max: 1, recovery: 'short_rest' }
          },
          state: {
            hp: 10,
            maxHpOverride: null,
            tempHp: 0,
            hitDiceUsed: 0,
            spellSlotsUsed: {},
            activeConditions: []
          }
        },
        resourceId: 'second_wind'
      }
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 409);
    assert.equal(body.statusCode, 409);

    // Error object structure
    assert.ok(body.error, 'Should have error object');
    assert.equal(body.error.code, 'RESOURCE_UNAVAILABLE');
    assert.ok(typeof body.error.message === 'string');
    assert.ok(body.error.message.toLowerCase().includes('does not have enough'));

    // Path
    assert.equal(body.path, '/resources/use');

    // Request ID
    assert.ok(body.requestId, 'Should have requestId');
    assert.match(body.requestId, /^req-/);
  } finally {
    await app.close();
  }
});

test('API error shape: All error responses have consistent structure', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Test multiple error scenarios
    const errorResponses = [
      await app.inject({
        method: 'POST',
        url: '/resources/use',
        payload: { character: createEmptyCharacter(), resourceId: 'fake' }
      }),
      await app.inject({
        method: 'POST',
        url: '/inventory/spend-ammo',
        payload: {
          character: { ...createEmptyCharacter(), inventory: [{ instanceId: 'bow', baseItemId: 'longbow', status: 'equipped_main_hand' }] },
          weaponItemId: 'bow',
          amount: 999
        }
      })
    ];

    for (const response of errorResponses) {
      const body = response.json();

      // Consistent structure across all errors
      assert.ok('statusCode' in body, 'Should have statusCode');
      assert.ok('error' in body, 'Should have error object');
      assert.ok('code' in body.error, 'error should have code');
      assert.ok('message' in body.error, 'error should have message');
      assert.ok('path' in body, 'Should have path');
      assert.ok('requestId' in body, 'Should have requestId');

      // Types
      assert.equal(typeof body.statusCode, 'number');
      assert.equal(typeof body.error.code, 'string');
      assert.equal(typeof body.error.message, 'string');
      assert.equal(typeof body.path, 'string');
      assert.equal(typeof body.requestId, 'string');
    }
  } finally {
    await app.close();
  }
});

function createEmptyCharacter() {
  return {
    id: 'char-test',
    ruleset: 'ld-2024',
    name: 'Test',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: [],
    savingThrowProficiencies: [],
    inventory: [],
    spellChoices: [],
    resources: {},
    state: {
      hp: 10,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: []
    }
  };
}
