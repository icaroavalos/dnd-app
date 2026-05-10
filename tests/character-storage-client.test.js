/**
 * Testes para api-character-storage-client.ts
 *
 * Valida:
 * - Sucesso: CRUD de personagens via backend
 * - Falha: backend indisponivel lanca CharacterStorageError (sem fallback local)
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

function mockFetch500() {
  global.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    text: async () => 'Server error',
  });
}

function restoreFetch() {
  global.fetch = originalFetch;
}

test('character-storage: listCharacters returns backend data on success', async () => {
  const { listCharacters } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchSuccess([
    { id: 'char-1', name: 'Test Character', level: 1, primaryClass: 'fighter' },
    { id: 'char-2', name: 'Test Character 2', level: 3, primaryClass: 'wizard' },
  ]);

  try {
    const result = await listCharacters();
    assert.ok(Array.isArray(result), 'Should return array');
    assert.strictEqual(result.length, 2, 'Should return correct count');
    assert.strictEqual(result[0].id, 'char-1', 'Should return correct data');
  } finally {
    restoreFetch();
  }
});

test('character-storage: getCharacter returns backend data on success', async () => {
  const { getCharacter } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({
    id: 'char-1',
    name: 'Test Character',
    level: 1,
    class: 'fighter',
  });

  try {
    const result = await getCharacter('char-1');
    assert.ok(result, 'Should return character');
    assert.strictEqual(result.id, 'char-1', 'Should return correct ID');
    assert.strictEqual(result.name, 'Test Character', 'Should return correct name');
  } finally {
    restoreFetch();
  }
});

test('character-storage: createCharacter returns backend data on success', async () => {
  const { createCharacter } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({
    id: 'char-1',
    name: 'New Character',
    level: 1,
  });

  try {
    const result = await createCharacter({ name: 'New Character' });
    assert.ok(result, 'Should return created character');
    assert.strictEqual(result.id, 'char-1', 'Should return correct ID');
  } finally {
    restoreFetch();
  }
});

test('character-storage: updateCharacter returns backend data on success', async () => {
  const { updateCharacter } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({
    id: 'char-1',
    name: 'Updated Character',
    level: 2,
  });

  try {
    const result = await updateCharacter('char-1', { name: 'Updated Character', level: 2 });
    assert.ok(result, 'Should return updated character');
    assert.strictEqual(result.name, 'Updated Character', 'Should return correct name');
  } finally {
    restoreFetch();
  }
});

test('character-storage: deleteCharacter succeeds on backend response', async () => {
  const { deleteCharacter } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchSuccess({});

  try {
    await deleteCharacter('char-1');
    // Should not throw
  } finally {
    restoreFetch();
  }
});

test('character-storage: listCharacters throws CharacterStorageError when backend fails', async () => {
  const { listCharacters, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => listCharacters(),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError when backend is unavailable'
    );
  } finally {
    restoreFetch();
  }
});

test('character-storage: getCharacter throws CharacterStorageError when backend fails', async () => {
  const { getCharacter, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => getCharacter('char-1'),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('character-storage: createCharacter throws CharacterStorageError when backend fails', async () => {
  const { createCharacter, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => createCharacter({ name: 'Test' }),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('character-storage: updateCharacter throws CharacterStorageError on backend failure', async () => {
  const { updateCharacter, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => updateCharacter('char-1', { name: 'Updated' }),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('character-storage: deleteCharacter throws CharacterStorageError on backend failure', async () => {
  const { deleteCharacter, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => deleteCharacter('char-1'),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('character-storage: getCharacter returns null on 404', async () => {
  const { getCharacter } = await import('../src/lib/api-character-storage-client.ts');

  mockFetch404();

  try {
    const result = await getCharacter('nonexistent');
    assert.strictEqual(result, null, 'Should return null for 404');
  } finally {
    restoreFetch();
  }
});

test('character-storage: listCharacters throws on 500 error', async () => {
  const { listCharacters, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetch500();

  try {
    await assert.rejects(
      async () => listCharacters(),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError on HTTP 500'
    );
  } finally {
    restoreFetch();
  }
});

test('character-storage: no localStorage fallback - throws on backend failure', async () => {
  const { listCharacters, CharacterStorageError } = await import('../src/lib/api-character-storage-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => listCharacters(),
      {
        name: 'CharacterStorageError',
      },
      'Should throw CharacterStorageError instead of using localStorage fallback'
    );
  } finally {
    restoreFetch();
  }
});
