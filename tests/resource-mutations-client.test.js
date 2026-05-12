/**
 * Testes para api-resource-mutations.ts
 *
 * Valida:
 * - Sucesso: mutações de recursos via backend
 * - Falha: backend indisponível lança ResourceMutationError (sem fallback local)
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

test('resource-mutations: useResource returns backend result on success', async () => {
  const { useResource } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchSuccess({
    event: { type: 'use_resource', resourceType: 'ki', amount: 1 },
    resources: { ki: { name: 'Ki', used: 1, max: 4 } },
  });

  try {
    const result = await useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' });
    assert.ok(result.event, 'Should return event from backend');
    assert.ok(result.resources, 'Should return updated resources');
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: useResource throws ResourceMutationError when backend fails', async () => {
  const { useResource } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError when backend is unavailable'
    );
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: spendAmmo throws ResourceMutationError on backend failure', async () => {
  const { spendAmmo } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => spendAmmo('char-1', { itemId: 'arrow', quantity: 1, source: 'attack' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: recoverAmmo throws ResourceMutationError on backend failure', async () => {
  const { recoverAmmo } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => recoverAmmo('char-1', { itemId: 'arrow', quantity: 1, source: 'recovery' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: shortRest throws ResourceMutationError on backend failure', async () => {
  const { shortRest } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => shortRest('char-1', { hitDiceSpent: 1, hpRegained: 5 }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: longRest throws ResourceMutationError on backend failure', async () => {
  const { longRest } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => longRest('char-1', { hpRegained: 10 }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError when backend fails'
    );
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: useResource throws ResourceMutationError on 404', async () => {
  const { useResource } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetch404();

  try {
    await assert.rejects(
      async () => useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError on HTTP 404'
    );
  } finally {
    restoreFetch();
  }
});

test('resource-mutations: no local fallback - throws on backend failure', async () => {
  const { useResource } = await import('../dist/src/lib/api-resource-mutations.js');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError instead of using local fallback'
    );
  } finally {
    restoreFetch();
  }
});
