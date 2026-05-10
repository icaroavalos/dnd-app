/**
 * Contract tests for character storage API endpoints
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

function mockFetch404() {
  global.fetch = async () => ({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: async () => 'Not found',
  });
}

function restoreFetch() {
  global.fetch = originalFetch;
}

test('characters/list: GET response shape on success', async () => {
  const { listCharacters } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchSuccess([
    { id: 'char-1', name: 'Heroes Name', level: 1, primaryClass: 'fighter' },
    { id: 'char-2', name: 'Wizards Name', level: 3, primaryClass: 'wizard' },
  ]);

  try {
    const result = await listCharacters();

    assert.ok(Array.isArray(result), 'Should return array');
    assert.equal(result.length, 2, 'Should return correct count');
    assert.ok(result[0].id, 'Character should have id');
    assert.ok(result[0].name, 'Character should have name');
    assert.ok(result[0].level, 'Character should have level');
    assert.ok(result[0].primaryClass, 'Character should have primaryClass');
  } finally {
    restoreFetch();
  }
});

test('characters/list: throws CharacterStorageError on network failure', async () => {
  const { listCharacters, CharacterStorageError } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => listCharacters(),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('characters/get: GET response shape on success', async () => {
  const { getCharacter } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({
    id: 'char-1',
    name: 'Heroes Name',
    ruleset: '5.5e-2024',
    lineageId: 'human',
    backgroundId: 'soldier',
    level: 1,
    class: 'fighter',
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    hp: 12,
    inventory: [],
    resources: {},
  });

  try {
    const result = await getCharacter('char-1');

    assert.ok(result.id, 'Character should have id');
    assert.ok(result.name, 'Character should have name');
    assert.ok(result.ruleset, 'Character should have ruleset');
    assert.ok(result.level, 'Character should have level');
    assert.ok(result.abilities, 'Character should have abilities');
  } finally {
    restoreFetch();
  }
});

test('characters/get: returns null on 404', async () => {
  const { getCharacter } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetch404();

  try {
    const result = await getCharacter('nonexistent');
    assert.equal(result, null, 'Should return null for 404');
  } finally {
    restoreFetch();
  }
});

test('characters/get: throws CharacterStorageError on network failure', async () => {
  const { getCharacter, CharacterStorageError } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => getCharacter('char-1'),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('characters/save (create): POST response shape on success', async () => {
  const { createCharacter } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({
    id: 'char-new',
    name: 'New Character',
    ruleset: '5.5e-2024',
    level: 1,
  });

  try {
    const result = await createCharacter({ name: 'New Character' });

    assert.ok(result.id, 'Created character should have id');
    assert.ok(result.name, 'Created character should have name');
    assert.equal(result.name, 'New Character', 'Should return correct name');
  } finally {
    restoreFetch();
  }
});

test('characters/save (create): throws CharacterStorageError on network failure', async () => {
  const { createCharacter, CharacterStorageError } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => createCharacter({ name: 'New Character' }),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('characters/save (update): PUT response shape on success', async () => {
  const { updateCharacter } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({
    id: 'char-1',
    name: 'Updated Name',
    level: 2,
  });

  try {
    const result = await updateCharacter('char-1', { name: 'Updated Name', level: 2 });

    assert.equal(result.name, 'Updated Name', 'Should return updated name');
    assert.equal(result.level, 2, 'Should return updated level');
  } finally {
    restoreFetch();
  }
});

test('characters/delete: DELETE response on success', async () => {
  const { deleteCharacter } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({ deleted: true });

  try {
    await deleteCharacter('char-1');
    // Should not throw
  } finally {
    restoreFetch();
  }
});

test('characters/delete: throws CharacterStorageError on network failure', async () => {
  const { deleteCharacter, CharacterStorageError } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => deleteCharacter('char-1'),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('characters/storage: no localStorage fallback on backend failure', async () => {
  const { listCharacters, CharacterStorageError } = await import('../../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => listCharacters(),
      {
        name: 'CharacterStorageError',
        message: /Backend indisponível/,
      },
      'Should throw CharacterStorageError instead of using localStorage fallback'
    );
  } finally {
    restoreFetch();
  }
});