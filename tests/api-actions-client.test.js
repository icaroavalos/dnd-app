/**
 * Testes para api-actions-client.ts
 *
 * Valida:
 * - Sucesso: backend retorna actions derivadas
 * - Falha: backend indisponível lança ActionDerivationError (sem fallback local)
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

test('api-actions-client: deriveActions returns backend data on success', async () => {
  const { deriveActions } = await import('../dist/src/lib/api-actions-client.js');

  mockFetchSuccess({
    actions: [
      { id: 'attack-1', name: 'Unarmed Strike', kind: 'attack' },
      { id: 'dash', name: 'Dash', kind: 'action' },
    ],
  });

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
      attacks: [{ name: 'Unarmed Strike', range: '5 feet', damage: '1d4', type: 'bludgeoning' }],
      spells: [],
      resources: {},
    };
    const result = await deriveActions(character);
    assert.ok(result, 'Should return actions array');
  } finally {
    restoreFetch();
  }
});

test('api-actions-client: deriveActions throws ActionDerivationError when backend fails', async () => {
  const { deriveActions } = await import('../dist/src/lib/api-actions-client.js');

  mockFetchFailure();

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
    };
    await assert.rejects(
      async () => deriveActions(character),
      {
        name: 'ActionDerivationError',
      },
      'Should throw ActionDerivationError when backend is unavailable'
    );
  } finally {
    restoreFetch();
  }
});

test('api-actions-client: deriveActions throws ActionDerivationError on 404', async () => {
  const { deriveActions } = await import('../dist/src/lib/api-actions-client.js');

  mockFetch404();

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
    };
    await assert.rejects(
      async () => deriveActions(character),
      {
        name: 'ActionDerivationError',
      },
      'Should throw ActionDerivationError on HTTP 404'
    );
  } finally {
    restoreFetch();
  }
});

test('api-actions-client: no local fallback - throws on backend failure', async () => {
  const { deriveActions } = await import('../dist/src/lib/api-actions-client.js');

  mockFetchFailure();

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
    };
    await assert.rejects(
      async () => deriveActions(character),
      {
        name: 'ActionDerivationError',
      },
      'Should throw ActionDerivationError instead of using local fallback'
    );
  } finally {
    restoreFetch();
  }
});
