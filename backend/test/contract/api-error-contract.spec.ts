import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

/**
 * Testes de contrato para o shape padrao de erros da API.
 *
 * Todos os erros da API devem seguir o formato:
 * {
 * statusCode: number,
 * error: { code: string, message: string },
 * path: string,
 * requestId: string,
 * timestamp: string
 * }
 */

/**
 * Valida o contrato de erro padrao do backend.
 */
function validateErrorShape(body: any, expectedPath: string): void {
  // Top-level fields
  assert.ok('statusCode' in body, 'Should have statusCode');
  assert.ok('error' in body, 'Should have error object');
  assert.ok('path' in body, 'Should have path');
  assert.ok('requestId' in body, 'Should have requestId');

  // Error object structure
  assert.ok('code' in body.error, 'error should have code');
  assert.ok('message' in body.error, 'error should have message');

  // Types
  assert.equal(typeof body.statusCode, 'number', 'statusCode should be number');
  assert.equal(typeof body.error.code, 'string', 'error.code should be string');
  assert.equal(typeof body.error.message, 'string', 'error.message should be string');
  assert.equal(typeof body.path, 'string', 'path should be string');
  assert.equal(typeof body.requestId, 'string', 'requestId should be string');

  // Path matches request
  assert.equal(body.path, expectedPath, `path should match request path`);
}

function createBaseCharacter(overrides: Partial<CharacterRecord> = {}): CharacterRecord {
  return {
    id: `char-test-${Date.now()}`,
    ruleset: RULESET_ID,
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
    backgroundChoices: null,
    attacks: [],
    resources: {},
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
    ...overrides,
  };
}

// ============================================================================
// /resources endpoints
// ============================================================================

test('API error contract: POST /resources/use with invalid resource returns 404 with standardized shape', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: createBaseCharacter(),
        resourceId: 'nonexistent_resource',
      },
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 404);
    assert.equal(body.statusCode, 404);

    // Error structure
    validateErrorShape(body, '/resources/use');

    // Specific error code
    assert.ok(body.error.code.includes('RESOURCE'), 'error.code should reference resource');
  } finally {
    await app.close();
  }
});

test('API error contract: POST /resources/use with zero resources returns 409 with standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const characterWithNoResources = createBaseCharacter({
      resources: {
        second_wind: { current: 0, max: 1, recovery: 'short_rest' }
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: characterWithNoResources,
        resourceId: 'second_wind',
      },
    });

    const body = response.json();

    // Should return 409 Conflict when resource is unavailable
    assert.equal(response.statusCode, 409, `Expected 409, got ${response.statusCode}: ${JSON.stringify(body)}`);

    // Error structure
    validateErrorShape(body, '/resources/use');

    // Specific error code
    assert.equal(body.error.code, 'RESOURCE_UNAVAILABLE');
    assert.ok(body.error.message.toLowerCase().includes('does not have enough'), 'Message should mention insufficient resources');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /inventory endpoints
// ============================================================================

test('API error contract: POST /inventory/spend-ammo with insufficient ammo returns 409 with standardized shape', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const characterWithBow: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
      ],
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: {
        character: characterWithBow,
        weaponItemId: 'item-inst-longbow',
        amount: 100, // More than available
      },
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 409);
    assert.equal(body.statusCode, 409);

    // Error structure
    validateErrorShape(body, '/inventory/spend-ammo');

    // Specific error code
    assert.equal(body.error.code, 'AMMO_UNAVAILABLE');
    assert.ok(body.error.message.toLowerCase().includes('not enough'), 'Message should mention shortage');
  } finally {
    await app.close();
  }
});

test('API error contract: POST /inventory/recover-ammo returns standardized error for invalid weapon', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: {
        character: createBaseCharacter(),
        weaponItemId: 'nonexistent-weapon',
        amount: 1,
      },
    });

    const body = response.json();

    // Should return error
    assert.ok(response.statusCode >= 400, 'Should return error status');

    // Error structure
    validateErrorShape(body, '/inventory/recover-ammo');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /actions/derive endpoint
// ============================================================================

test('API error contract: POST /actions/derive with invalid character returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: {
        character: {
          ...createBaseCharacter(),
          classes: undefined as any, // Invalid
        },
      },
    });

    const body = response.json();

    // Should return error (400 for validation)
    assert.ok(response.statusCode >= 400, 'Should return error status');

    // Error structure
    validateErrorShape(body, '/actions/derive');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /characters/project endpoint
// ============================================================================

test('API error contract: POST /characters/project with invalid character returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload: {
        ...createBaseCharacter(),
        classes: undefined as any, // Invalid
      },
    });

    const body = response.json();

    // Should return error
    assert.ok(response.statusCode >= 400, 'Should return error status');

    // Error structure
    validateErrorShape(body, '/characters/project');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /characters CRUD endpoints
// ============================================================================

test('API error contract: GET /characters/:id with nonexistent id returns 404 with standardized shape', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/characters/nonexistent-id',
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 404);
    assert.equal(body.statusCode, 404);

    // Error structure
    validateErrorShape(body, '/characters/nonexistent-id');

    // Specific error code
    assert.ok(body.error.code.includes('NOT_FOUND') || body.error.code.includes('CHARACTER'), 'Should reference not found or character');
  } finally {
    await app.close();
  }
});

test('API error contract: PUT /characters/:id with nonexistent id returns 404 with standardized shape', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'PUT',
      url: '/characters/nonexistent-id',
      payload: { name: 'Updated Name' },
    });

    const body = response.json();

    // Status code
    assert.equal(response.statusCode, 404);

    // Error structure
    validateErrorShape(body, '/characters/nonexistent-id');
  } finally {
    await app.close();
  }
});

test('API error contract: DELETE /characters/:id with nonexistent id returns error with standardized shape', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'DELETE',
      url: '/characters/nonexistent-id',
    });

    // DELETE may return 204 No Content if not found, or 404
    // The key is that if there's a body, it should follow the error contract
    if (response.statusCode >= 400) {
      const body = response.json();
      validateErrorShape(body, '/characters/nonexistent-id');
    }
    // If it returns 204 or 200, that's also acceptable for delete of nonexistent
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules endpoints - invalid catalog
// ============================================================================

test('API error contract: GET /rules/invalid-catalog returns 404 with standardized shape', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/invalid-catalog',
    });

    const body = response.json();

    // Should return 404 for unknown route (NestJS default)
    assert.equal(response.statusCode, 404);

    // Error structure
    validateErrorShape(body, '/rules/invalid-catalog');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /characters/:characterId/resources/projection endpoint
// ============================================================================

test('API error contract: GET /characters/:id/resources/projection with nonexistent character returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/characters/nonexistent-id/resources/projection',
    });

    const body = response.json();

    // Should return 404 or appropriate error
    assert.ok(response.statusCode >= 400, `Should return error status, got ${response.statusCode}`);

    // Error structure
    validateErrorShape(body, '/characters/nonexistent-id/resources/projection');
  } finally {
    await app.close();
  }
});

test('API error contract: POST /characters/:id/resources/projection/rebuild with nonexistent character returns standardized error', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/nonexistent-id/resources/projection/rebuild',
    });

    const body = response.json();

    // Should return error
    assert.ok(response.statusCode >= 400, `Should return error status, got ${response.statusCode}`);

    // Error structure
    validateErrorShape(body, '/characters/nonexistent-id/resources/projection/rebuild');
  } finally {
    await app.close();
  }
});

// ============================================================================
// Consistency across all error responses
// ============================================================================

test('API error contract: All error responses have consistent structure', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const errorScenarios = [
      {
        method: 'POST',
        url: '/resources/use',
        payload: { character: createBaseCharacter(), resourceId: 'fake' },
        path: '/resources/use',
      },
      {
        method: 'POST',
        url: '/inventory/spend-ammo',
        payload: {
          character: { ...createBaseCharacter(), inventory: [{ instanceId: 'bow', baseItemId: 'longbow', status: 'equipped_main_hand' }] },
          weaponItemId: 'bow',
          amount: 999,
        },
        path: '/inventory/spend-ammo',
      },
      {
        method: 'GET',
        url: '/characters/nonexistent',
        path: '/characters/nonexistent',
      },
    ];

    for (const scenario of errorScenarios) {
      const response = await app.inject({
        method: scenario.method as any,
        url: scenario.url,
        payload: scenario.payload ? scenario.payload : undefined,
      });

      const body = response.json();

      // Consistent structure across all errors
      assert.ok('statusCode' in body, `${scenario.url}: Should have statusCode`);
      assert.ok('error' in body, `${scenario.url}: Should have error object`);
      assert.ok('code' in body.error, `${scenario.url}: error should have code`);
      assert.ok('message' in body.error, `${scenario.url}: error should have message`);
      assert.ok('path' in body, `${scenario.url}: Should have path`);
      assert.ok('requestId' in body, `${scenario.url}: Should have requestId`);

      // Types
      assert.equal(typeof body.statusCode, 'number', `${scenario.url}: statusCode should be number`);
      assert.equal(typeof body.error.code, 'string', `${scenario.url}: error.code should be string`);
      assert.equal(typeof body.error.message, 'string', `${scenario.url}: error.message should be string`);
      assert.equal(typeof body.path, 'string', `${scenario.url}: path should be string`);
      assert.equal(typeof body.requestId, 'string', `${scenario.url}: requestId should be string`);
    }
  } finally {
    await app.close();
  }
});
