import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'fs';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

function createBaseCharacter(): Omit<CharacterRecord, 'id'> {
  return {
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
    resources: {},
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: []
    }
  };
}

test('POST /characters-persistence creates a new character', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character = createBaseCharacter();

    const response = await app.inject({
      method: 'POST',
      url: '/characters-persistence',
      payload: character
    });

    assert.equal(response.statusCode, 201);

    const created = response.json();
    assert.ok(created.id, 'Should have generated ID');
    assert.equal(created.name, character.name);
  } finally {
    await app.close();
  }
});

test('GET /characters-persistence lists all characters', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Create a character first
    await app.inject({
      method: 'POST',
      url: '/characters-persistence',
      payload: createBaseCharacter()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/characters-persistence'
    });

    assert.equal(response.statusCode, 200);

    const list = response.json();
    assert.ok(Array.isArray(list), 'Should return an array');
    assert.ok(list.length > 0, 'Should have at least one character');

    const first = list[0];
    assert.ok(first.id, 'Should have id');
    assert.ok(first.name, 'Should have name');
    assert.ok(typeof first.level === 'number', 'Should have level');
    assert.ok(first.primaryClass, 'Should have primaryClass');
  } finally {
    await app.close();
  }
});

test('GET /characters-persistence/:id returns a specific character', async () => {
  const app = await createApp();
  let createdId: string;

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Create a character
    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters-persistence',
      payload: { ...createBaseCharacter(), name: 'Specific Test' }
    });

    const created = createResponse.json();
    createdId = created.id;

    // Get the character
    const response = await app.inject({
      method: 'GET',
      url: `/characters-persistence/${createdId}`
    });

    assert.equal(response.statusCode, 200);

    const character = response.json();
    assert.equal(character.id, createdId);
    assert.equal(character.name, 'Specific Test');
  } finally {
    await app.close();
  }
});

test('GET /characters-persistence/:id returns 404 for non-existent character', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/characters-persistence/non-existent-id'
    });

    assert.equal(response.statusCode, 404);

    const body = response.json();
    assert.equal(body.error.code, 'CHARACTER_NOT_FOUND');
  } finally {
    await app.close();
  }
});

test('PUT /characters-persistence/:id updates an existing character', async () => {
  const app = await createApp();
  let createdId: string;

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Create a character
    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters-persistence',
      payload: createBaseCharacter()
    });

    const created = createResponse.json();
    createdId = created.id;

    // Update the character
    const updatedCharacter = {
      ...created,
      name: 'Updated Name',
      abilities: { ...created.abilities, str: 18 }
    };

    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/characters-persistence/${createdId}`,
      payload: { id: createdId, character: updatedCharacter }
    });

    assert.equal(updateResponse.statusCode, 200);

    const updated = updateResponse.json();
    assert.equal(updated.name, 'Updated Name');
    assert.equal(updated.abilities.str, 18);

    // Verify persistence
    const getResponse = await app.inject({
      method: 'GET',
      url: `/characters-persistence/${createdId}`
    });

    const persisted = getResponse.json();
    assert.equal(persisted.name, 'Updated Name');
  } finally {
    await app.close();
  }
});

test('DELETE /characters-persistence/:id removes a character', async () => {
  const app = await createApp();
  let createdId: string;

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Create a character
    const createResponse = await app.inject({
      method: 'POST',
      url: '/characters-persistence',
      payload: { ...createBaseCharacter(), name: 'To Delete' }
    });

    const created = createResponse.json();
    createdId = created.id;

    // Delete the character
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/characters-persistence/${createdId}`
    });

    assert.equal(deleteResponse.statusCode, 204);

    // Verify it's gone
    const getResponse = await app.inject({
      method: 'GET',
      url: `/characters-persistence/${createdId}`
    });

    assert.equal(getResponse.statusCode, 404);
  } finally {
    await app.close();
  }
});
