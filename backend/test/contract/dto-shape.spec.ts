import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../../src/main.js';
import { RULESET_ID } from '@shared/contracts';

/**
 * Testes de contrato para o shape dos DTOs da API.
 *
 * Estes testes validam que os endpoints aceitam e retornam
 * os formatos esperados, garantindo estabilidade da API.
 */

// ============================================================================
// CharacterRecord DTO
// ============================================================================

function createBaseCharacter(overrides: any = {}) {
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
// UseResourceRequestDto
// ============================================================================

test('DTO shape: POST /resources/use accepts UseResourceRequestDto', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const characterWithResources = createBaseCharacter({
      resources: {
        second_wind: { current: 1, max: 1, recovery: 'short_rest' }
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: characterWithResources,
        resourceId: 'second_wind',
        amount: 1
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.ok(body.id, 'Should return character with id');
    assert.ok(body.resources, 'Should return character with resources');
  } finally {
    await app.close();
  }
});

test('DTO shape: POST /resources/use accepts amount as optional (defaults to 1)', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const characterWithResources = createBaseCharacter({
      resources: {
        second_wind: { current: 1, max: 1, recovery: 'short_rest' }
      }
    });

    // Without amount
    const response1 = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: characterWithResources,
        resourceId: 'second_wind'
      }
    });

    assert.equal(response1.statusCode, 200);
    const body1 = response1.json();
    assert.equal(body1.resources.second_wind?.current, 0);

    // With amount = 0 (should use 1 as minimum)
    const response2 = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: characterWithResources,
        resourceId: 'second_wind',
        amount: 0
      }
    });

    assert.equal(response2.statusCode, 200);
  } finally {
    await app.close();
  }
});

// ============================================================================
// RecoverResourcesRequestDto
// ============================================================================

test('DTO shape: POST /resources/recover accepts RecoverResourcesRequestDto', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const characterWithUsedResources = createBaseCharacter({
      resources: {
        second_wind: { current: 0, max: 1, recovery: 'short_rest' }
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character: characterWithUsedResources,
        recovery: 'short_rest'
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.ok(body.resources, 'Should return character with resources');
    assert.equal(body.resources.second_wind?.current, 1, 'Should recover short_rest resources');
  } finally {
    await app.close();
  }
});

test('DTO shape: POST /resources/recover validates recovery enum (short_rest | long_rest)', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Invalid recovery type
    const response = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character: createBaseCharacter(),
        recovery: 'invalid_type'
      }
    });

    // Should either fail validation or treat as no-op
    assert.ok([200, 400].includes(response.statusCode));
  } finally {
    await app.close();
  }
});

// ============================================================================
// SpendAmmoRequestDto
// ============================================================================

test('DTO shape: POST /inventory/spend-ammo accepts SpendAmmoRequestDto', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: {
        character: createCharacterWithBow(),
        weaponItemId: 'item-inst-longbow',
        amount: 1
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.ok(body.inventory, 'Should return character with inventory');
  } finally {
    await app.close();
  }
});

test('DTO shape: POST /inventory/spend-ammo accepts amount as optional (defaults to 1)', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Without amount
    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: {
        character: createCharacterWithBow(),
        weaponItemId: 'item-inst-longbow'
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    const arrowStack = body.inventory.find((item: any) => item.baseItemId === 'arrows-20');
    assert.equal(arrowStack?.quantity, 4); // Started with 5, spent 1
  } finally {
    await app.close();
  }
});

// ============================================================================
// RecoverAmmoRequestDto
// ============================================================================

test('DTO shape: POST /inventory/recover-ammo accepts RecoverAmmoRequestDto', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: {
        character: createCharacterWithBow(),
        weaponItemId: 'item-inst-longbow',
        amount: 10
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    const arrowStack = body.inventory.find((item: any) => item.baseItemId === 'arrows-20');
    assert.equal(arrowStack?.quantity, 15); // Started with 5, recovered 10
  } finally {
    await app.close();
  }
});

test('DTO shape: POST /inventory/recover-ammo accepts amount as optional (defaults to 1)', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: {
        character: {
          ...createCharacterWithBow(),
          inventory: [{ instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' }]
        },
        weaponItemId: 'item-inst-longbow'
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    const arrowStack = body.inventory.find((item: any) => item.baseItemId === 'arrows-20');
    assert.equal(arrowStack?.quantity, 1); // Default amount
  } finally {
    await app.close();
  }
});

// ============================================================================
// DeriveActionsRequestDto
// ============================================================================

test('DTO shape: POST /actions/derive accepts DeriveActionsRequestDto', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: {
        character: createBaseCharacter()
      }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.ok(Array.isArray(body), 'Should return array of actions');
    assert.ok(body.length > 0, 'Should have at least one action');

    // Validate action shape
    const firstAction = body[0];
    assert.ok(firstAction.id, 'Action should have id');
    assert.ok(firstAction.kind, 'Action should have kind');
    assert.ok(firstAction.name, 'Action should have name');
    assert.ok(firstAction.hit !== undefined, 'Action should have hit');
    assert.ok(Array.isArray(firstAction.damage), 'Action should have damage array');
  } finally {
    await app.close();
  }
});

test('DTO shape: POST /actions/derive returns DerivedAction[] with consistent structure', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: {
        character: createBaseCharacter()
      }
    });

    assert.equal(response.statusCode, 200);

    const actions = response.json();
    assert.ok(Array.isArray(actions), 'Should return array');

    for (const action of actions) {
      // Required fields
      assert.ok(typeof action.id === 'string', 'id should be string');
      assert.ok(typeof action.kind === 'string', 'kind should be string');
      assert.ok(typeof action.icon === 'string', 'icon should be string');
      assert.ok(typeof action.name === 'string', 'name should be string');
      assert.ok(typeof action.subtitle === 'string', 'subtitle should be string');
      assert.ok(typeof action.range === 'string', 'range should be string');
      assert.ok(typeof action.rangeLabel === 'string', 'rangeLabel should be string');
      assert.ok(typeof action.hit === 'string', 'hit should be string');
      assert.ok(Array.isArray(action.damage), 'damage should be array');
      assert.ok(typeof action.notes === 'string', 'notes should be string');
      assert.ok(typeof action.detail === 'string', 'detail should be string');

      // Optional fields
      if (action.disabled !== undefined) {
        assert.ok(typeof action.disabled === 'boolean', 'disabled should be boolean');
      }
    }
  } finally {
    await app.close();
  }
});

// ============================================================================
// Characters CRUD DTOs
// ============================================================================

test('DTO shape: POST /characters accepts CreateCharacterDto and returns CharacterRecord', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const payload = createBaseCharacter({ name: 'Contract Test' });
    const response = await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
    });

    assert.equal(response.statusCode, 201);
    const created = response.json();
    assert.ok(created.id, 'Should return character with id');
    assert.equal(created.name, 'Contract Test');
    assert.ok(created.ruleset, 'Should return ruleset');
  } finally {
    await app.close();
  }
});

test('DTO shape: GET /characters returns array of character summaries', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/characters',
    });

    assert.equal(response.statusCode, 200);
    const list = response.json();
    assert.ok(Array.isArray(list), 'Should return array');
  } finally {
    await app.close();
  }
});

test('DTO shape: GET /characters/:id returns full CharacterRecord', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters',
      payload: createBaseCharacter({ name: 'Find Test' }),
    });
    const created = createResponse.json();

    const getResponse = await app.inject({
      method: 'GET',
      url: `/characters/${created.id}`,
    });

    assert.equal(getResponse.statusCode, 200);
    const found = getResponse.json();
    assert.equal(found.name, 'Find Test');
    assert.equal(found.id, created.id);
    assert.ok(found.abilities, 'Should return abilities');
    assert.ok(found.state, 'Should return state');
  } finally {
    await app.close();
  }
});

test('DTO shape: PUT /characters/:id accepts partial update and returns CharacterRecord', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters',
      payload: createBaseCharacter({ name: 'Original Name' }),
    });
    const created = createResponse.json();

    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/characters/${created.id}`,
      payload: { name: 'Updated Name' },
    });

    assert.equal(updateResponse.statusCode, 200);
    const updated = updateResponse.json();
    assert.equal(updated.name, 'Updated Name');
  } finally {
    await app.close();
  }
});

test('DTO shape: DELETE /characters/:id returns 204 No Content', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters',
      payload: createBaseCharacter({ name: 'To Delete' }),
    });
    const created = createResponse.json();

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/characters/${created.id}`,
    });

    assert.equal(deleteResponse.statusCode, 204);
  } finally {
    await app.close();
  }
});

// ============================================================================
// Rules DTOs
// ============================================================================

test('DTO shape: GET /rules/backgrounds returns catalog response with results array', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/backgrounds',
    });

    assert.equal(response.statusCode, 200);
    const result = response.json();
    assert.ok(result.ruleset, 'Should return ruleset');
    assert.ok(Array.isArray(result.results), 'Should return results array');
    if (result.results.length > 0) {
      const first = result.results[0];
      assert.ok(first.name, 'Should have name');
    }
  } finally {
    await app.close();
  }
});

test('DTO shape: GET /rules/classes returns catalog response with results array', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/classes',
    });

    assert.equal(response.statusCode, 200);
    const result = response.json();
    assert.ok(result.ruleset, 'Should return ruleset');
    assert.ok(Array.isArray(result.results), 'Should return results array');
  } finally {
    await app.close();
  }
});

test('DTO shape: GET /rules/spells returns catalog response with results array', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/spells',
    });

    assert.equal(response.statusCode, 200);
    const result = response.json();
    assert.ok(result.ruleset, 'Should return ruleset');
    assert.ok(Array.isArray(result.results), 'Should return results array');
  } finally {
    await app.close();
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function createCharacterWithBow() {
  return {
    ...createBaseCharacter(),
    inventory: [
      { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
      { instanceId: 'item-inst-arrows', baseItemId: 'arrows-20', status: 'backpack', quantity: 5 }
    ]
  };
}
