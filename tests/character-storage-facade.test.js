/**
 * Testes para Character Storage Facade.
 *
 * O facade usa o backend como fonte obrigatoria para dados canonicos.
 * localStorage fica restrito a preferencias/ultimo personagem ativo.
 */

import { strict as assert } from 'node:assert';
import { describe, it, afterEach } from 'node:test';
import { CharacterStorageError } from '../dist/src/lib/api-character-storage-client.js';

const originalFetch = global.fetch;

const localStorageData = {};
global.localStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, value) => {
    localStorageData[key] = value;
  },
  removeItem: (key) => {
    delete localStorageData[key];
  },
  clear: () => {
    Object.keys(localStorageData).forEach((key) => delete localStorageData[key]);
  },
};

function mockFetchFailure() {
  global.fetch = async () => {
    throw new Error('Network error');
  };
}

function mockFetchSuccess(handler) {
  global.fetch = async (url, options = {}) => {
    const payload = typeof handler === 'function' ? handler(String(url), options) : handler;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
      text: async () => JSON.stringify(payload),
      url,
    };
  };
}

afterEach(() => {
  global.fetch = originalFetch;
  global.localStorage.clear();
});

describe('Character Storage Facade - backend-only contract', () => {
  it('loads full character records through the backend', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess((url) => {
      if (url.endsWith('/characters')) {
        return [{ id: 'char-1', name: 'API Char', level: 1, primaryClass: 'fighter' }];
      }
      return { id: 'char-1', name: 'API Char', ruleset: '5.5e-2024' };
    });

    const facade = createCharacterStorageFacade();
    const characters = await facade.loadAll();

    assert.deepEqual(characters, [{ id: 'char-1', name: 'API Char', ruleset: '5.5e-2024' }]);
  });

  it('saves through the backend without writing canonical character data to localStorage', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess({ id: 'char-1', name: 'Saved Char', ruleset: '5.5e-2024' });

    const facade = createCharacterStorageFacade();
    const saved = await facade.save({ id: 'char-1', name: 'Saved Char', ruleset: '5.5e-2024' });

    assert.equal(saved.name, 'Saved Char');
    assert.equal(global.localStorage.getItem('dnd5e-characters'), null);
  });

  it('throws CharacterStorageError when backend save fails', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchFailure();

    const facade = createCharacterStorageFacade();

    await assert.rejects(
      () => facade.save({ id: 'char-2', name: 'No Fallback', ruleset: '5.5e-2024' }),
      CharacterStorageError
    );
    assert.equal(global.localStorage.getItem('dnd5e-characters'), null);
  });

  it('throws CharacterStorageError when backend list fails', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchFailure();
    global.localStorage.setItem('dnd5e-characters', JSON.stringify([{ id: 'local', name: 'Local Char' }]));

    const facade = createCharacterStorageFacade();

    await assert.rejects(() => facade.loadAll(), CharacterStorageError);
  });

  it('deletes through the backend and clears only active-character preference', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess({});
    global.localStorage.setItem('dnd5e-active-character-id', 'char-delete');

    const facade = createCharacterStorageFacade({
      getActiveCharacterId: () => 'char-delete',
    });

    await facade.delete('char-delete');

    assert.equal(global.localStorage.getItem('dnd5e-active-character-id'), null);
    assert.equal(global.localStorage.getItem('dnd5e-characters'), null);
  });

  it('list is an alias for backend loadAll', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess((url) => {
      if (url.endsWith('/characters')) return [{ id: 'char-list', name: 'List Char' }];
      return { id: 'char-list', name: 'List Char', ruleset: '5.5e-2024' };
    });

    const facade = createCharacterStorageFacade();

    assert.deepEqual(await facade.list(), await facade.loadAll());
  });

  it('loadById uses backend get by id', async () => {
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess({ id: 'char-id', name: 'By ID', ruleset: '5.5e-2024' });

    const facade = createCharacterStorageFacade();
    const character = await facade.loadById('char-id');

    assert.equal(character.id, 'char-id');
  });
});
