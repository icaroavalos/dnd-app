/**
 * Contract tests for POST /actions/derive endpoint
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

test('actions/derive: POST response shape on success', async () => {
  const { deriveActions } = await import('../../src/lib/api-actions-client.ts');

  mockFetchSuccess({
    actions: [
      {
        id: 'attack-1',
        name: 'Unarmed Strike',
        kind: 'attack',
        icon: 'ATK',
        subtitle: 'Weapon Attack',
        range: '5 ft',
        rangeLabel: 'Melee',
        hit: '+3',
        damage: ['1d4+2'],
        notes: 'Finesse',
        detail: 'Melee weapon attack',
        cost: { economy: 'action' },
      },
      {
        id: 'dash',
        name: 'Dash',
        kind: 'action',
        icon: 'A',
        subtitle: 'Combat Action',
        range: 'Self',
        rangeLabel: 'Move',
        hit: '--',
        damage: [],
        notes: 'Extra movement',
        detail: 'Gain extra movement',
        cost: { economy: 'action' },
      },
    ],
  });

  try {
    const character = {
      id: 'test-char',
      name: 'Test Character',
      class: 'fighter',
      level: 1,
      abilities: { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
      attacks: [],
      spells: [],
      resources: {},
    };

    const result = await deriveActions(character);

    assert.ok(Array.isArray(result.actions), 'Should return actions array');
    assert.equal(result.actions.length, 2, 'Should return correct count');

    // Validate first action shape
    const action = result.actions[0];
    assert.ok(action.id, 'Action should have id');
    assert.ok(action.name, 'Action should have name');
    assert.ok(action.kind, 'Action should have kind');
    assert.ok(action.icon, 'Action should have icon');
    assert.ok(action.subtitle, 'Action should have subtitle');
    assert.ok(action.range, 'Action should have range');
    assert.ok(action.rangeLabel, 'Action should have rangeLabel');
    assert.ok(action.hit, 'Action should have hit');
    assert.ok(Array.isArray(action.damage), 'Action should have damage array');
    assert.ok(action.notes, 'Action should have notes');
    assert.ok(action.detail, 'Action should have detail');
  } finally {
    restoreFetch();
  }
});

test('actions/derive: throws ActionDerivationError on network failure', async () => {
  const { deriveActions, ActionDerivationError } = await import('../../src/lib/api-actions-client.ts');

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
      'Should throw ActionDerivationError on network failure'
    );
  } finally {
    restoreFetch();
  }
});

test('actions/derive: throws ActionDerivationError on HTTP 404', async () => {
  const { deriveActions, ActionDerivationError } = await import('../../src/lib/api-actions-client.ts');

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

test('actions/derive: no local fallback on backend failure', async () => {
  const { deriveActions, ActionDerivationError } = await import('../../src/lib/api-actions-client.ts');

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
        message: /Backend indisponível/,
      },
      'Should throw ActionDerivationError instead of using local fallback'
    );
  } finally {
    restoreFetch();
  }
});
