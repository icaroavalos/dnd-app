import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

function createBaseCharacter(overrides: Partial<CharacterRecord> = {}): CharacterRecord {
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ruleset: RULESET_ID,
    name: 'Storage Test',
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
  } as CharacterRecord;
}

test('POST /characters creates a new character', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const payload = createBaseCharacter();

    const response = await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
    });

    assert.equal(response.statusCode, 201);
    const created = response.json();
    assert.ok(created.id);
    assert.equal(created.name, payload.name);
    assert.equal(created.ruleset, RULESET_ID);
  } finally {
    await app.close();
  }
});

test('GET /characters lists characters', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const payload = createBaseCharacter({ name: 'List Test' });
    await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
    });

    const listResponse = await app.inject({
      method: 'GET',
      url: '/characters',
    });

    assert.equal(listResponse.statusCode, 200);
    const list = listResponse.json();
    assert.ok(Array.isArray(list));
    const found = list.find((c: any) => c.name === 'List Test');
    assert.ok(found, 'Should find created character');
  } finally {
    await app.close();
  }
});

test('GET /characters/:id returns character by ID', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const payload = createBaseCharacter({ name: 'Find Test' });
    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
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
  } finally {
    await app.close();
  }
});

test('PUT /characters/:id updates an existing character', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const payload = createBaseCharacter({ name: 'Original Name' });
    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
    });
    const created = createResponse.json();

    const updatePayload = { name: 'Updated Name' };
    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/characters/${created.id}`,
      payload: updatePayload,
    });

    assert.equal(updateResponse.statusCode, 200);
    const updated = updateResponse.json();
    assert.equal(updated.name, 'Updated Name');

    const getResponse = await app.inject({
      method: 'GET',
      url: `/characters/${created.id}`,
    });
    const found = getResponse.json();
    assert.equal(found.name, 'Updated Name');
  } finally {
    await app.close();
  }
});

test('DELETE /characters/:id removes a character', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const payload = createBaseCharacter({ name: 'To Delete' });
    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
    });
    const created = createResponse.json();

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/characters/${created.id}`,
    });

    assert.equal(deleteResponse.statusCode, 204);

    const getResponse = await app.inject({
      method: 'GET',
      url: `/characters/${created.id}`,
    });
    assert.equal(getResponse.statusCode, 404);
  } finally {
    await app.close();
  }
});

test('GET /characters/:id returns 404 for non-existent character', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/characters/non-existent-id',
    });

    assert.equal(response.statusCode, 404);
  } finally {
    await app.close();
  }
});

test('POST /characters creates character with full CharacterRecord', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const payload = createBaseCharacter({
      name: 'Full Record Test',
      skillProficiencies: ['Athletics', 'Perception'],
      savingThrowProficiencies: ['str', 'dex'],
      resources: {
        second_wind: { current: 1, max: 1, recovery: 'short_rest' },
      },
      state: {
        hp: 20,
        maxHpOverride: null,
        tempHp: 5,
        hitDiceUsed: 1,
        spellSlotsUsed: { '1': 4 },
        activeConditions: [],
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/characters',
      payload,
    });

    assert.equal(response.statusCode, 201);
    const created = response.json();
    assert.equal(created.name, 'Full Record Test');
    assert.deepEqual(created.resources, payload.resources);
    assert.equal(created.state.hp, 20);
    assert.equal(created.state.tempHp, 5);
  } finally {
    await app.close();
  }
});
