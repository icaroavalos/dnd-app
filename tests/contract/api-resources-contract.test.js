/**
 * Contract tests for resource mutations API endpoints
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

test('resources/use-resource: POST response shape on success', async () => {
  const { useResource } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchSuccess({
    event: { type: 'use_resource', resourceType: 'ki', amount: 1 },
    resources: {
      ki: { name: 'Ki', used: 1, max: 4, recovery: 'short_rest' },
      second_wind: { name: 'Second Wind', used: 0, max: 1, recovery: 'short_rest' },
    },
  });

  try {
    const result = await useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' });

    assert.ok(result.event, 'Should return event');
    assert.ok(result.resources, 'Should return resources');
    assert.ok(result.resources.ki, 'Should return ki resource');
    assert.equal(result.resources.ki.used, 1, 'Should return updated used count');
  } finally {
    restoreFetch();
  }
});

test('resources/use-resource: throws ResourceMutationError on network failure', async () => {
  const { useResource, ResourceMutationError } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('resources/short-rest: POST response shape on success', async () => {
  const { shortRest } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchSuccess({
    event: { type: 'short_rest', hitDiceSpent: 1 },
    resources: { second_wind: { name: 'Second Wind', used: 0, max: 1, recovery: 'short_rest' } },
  });

  try {
    const result = await shortRest('char-1', { hitDiceSpent: 1, hpRegained: 5 });

    assert.ok(result.event, 'Should return event');
    assert.ok(result.resources, 'Should return resources');
  } finally {
    restoreFetch();
  }
});

test('resources/short-rest: throws ResourceMutationError on network failure', async () => {
  const { shortRest, ResourceMutationError } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => shortRest('char-1', { hitDiceSpent: 1, hpRegained: 5 }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('resources/long-rest: POST response shape on success', async () => {
  const { longRest } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchSuccess({
    event: { type: 'long_rest' },
    resources: { second_wind: { name: 'Second Wind', used: 0, max: 1, recovery: 'short_rest' } },
  });

  try {
    const result = await longRest('char-1', { hpRegained: 12 });

    assert.ok(result.event, 'Should return event');
    assert.ok(result.resources, 'Should return resources');
  } finally {
    restoreFetch();
  }
});

test('resources/ammo/spend: POST response shape on success', async () => {
  const { spendAmmo } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchSuccess({
    event: { type: 'spend_ammo', itemId: 'arrow', quantity: 1 },
    inventory: [{ id: 'arrow', name: 'Arrow', quantity: 19 }],
  });

  try {
    const result = await spendAmmo('char-1', { itemId: 'arrow', quantity: 1, source: 'attack' });

    assert.ok(result.event, 'Should return event');
    assert.ok(result.inventory, 'Should return inventory');
  } finally {
    restoreFetch();
  }
});

test('resources/ammo/spend: throws ResourceMutationError on network failure', async () => {
  const { spendAmmo, ResourceMutationError } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => spendAmmo('char-1', { itemId: 'arrow', quantity: 1, source: 'attack' }),
      {
        name: 'ResourceMutationError',
      },
      'Should throw ResourceMutationError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('resources/ammo/recover: POST response shape on success', async () => {
  const { recoverAmmo } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchSuccess({
    event: { type: 'recover_ammo', itemId: 'arrow', quantity: 5 },
    inventory: [{ id: 'arrow', name: 'Arrow', quantity: 25 }],
  });

  try {
    const result = await recoverAmmo('char-1', { itemId: 'arrow', quantity: 5, source: 'loot' });

    assert.ok(result.event, 'Should return event');
    assert.ok(result.inventory, 'Should return inventory');
  } finally {
    restoreFetch();
  }
});

test('resources: no local fallback on backend failure', async () => {
  const { useResource, ResourceMutationError } = await import('../../src/lib/api-resource-mutations.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => useResource('char-1', { resourceType: 'ki', amount: 1, source: 'action' }),
      {
        name: 'ResourceMutationError',
        message: /Backend indisponível/,
      },
      'Should throw ResourceMutationError instead of using local fallback'
    );
  } finally {
    restoreFetch();
  }
});
