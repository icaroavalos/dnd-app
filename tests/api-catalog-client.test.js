/**
 * Testes de contrato para o cliente de catálogo da API.
 *
 * Valida:
 * - Sucesso: backend retorna dados
 * - Falha: backend indisponível lança BackendError
 * - Sem fallback local: não carrega dados locais
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// Mock do fetch para simular backend
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
  });
}

function restoreFetch() {
  global.fetch = originalFetch;
}

test('api-catalog-client: getCatalog returns backend data on success', async () => {
  const { getCatalog } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: '1', name: 'Test Class' }],
  });

  try {
    const result = await getCatalog('classes');
    assert.ok(result.results, 'Should return results array');
    assert.equal(result.results[0].name, 'Test Class');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getCatalog throws BackendError when backend fails', async () => {
  const { getCatalog, BackendError } = await import('../src/lib/api-catalog-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => getCatalog('backgrounds'),
      {
        name: 'BackendError',
        message: /Backend indisponível para backgrounds/,
      },
      'Should throw BackendError when backend is unavailable',
    );
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getCatalog throws BackendError on 404', async () => {
  const { getCatalog, BackendError } = await import('../src/lib/api-catalog-client.ts');

  mockFetch404();

  try {
    await assert.rejects(
      async () => getCatalog('classes'),
      {
        name: 'BackendError',
      },
      'Should throw BackendError on HTTP 404',
    );
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getBackgrounds returns catalog response', async () => {
  const { getBackgrounds } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'bg-1', name: 'Acolyte' }],
  });

  try {
    const result = await getBackgrounds();
    assert.ok(result.results, 'Should return results');
    assert.ok(Array.isArray(result.results), 'Results should be array');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getClasses returns catalog response', async () => {
  const { getClasses } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'class-1', name: 'Barbarian' }],
  });

  try {
    const result = await getClasses();
    assert.ok(result.results, 'Should return results');
    assert.ok(Array.isArray(result.results), 'Results should be array');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getSpells returns catalog response', async () => {
  const { getSpells } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'spell-1', name: 'Fireball' }],
  });

  try {
    const result = await getSpells();
    assert.ok(result.results, 'Should return results');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getClassSpells returns catalog response', async () => {
  const { getClassSpells } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'class-spell-1', name: 'Magic Missile' }],
  });

  try {
    const result = await getClassSpells();
    assert.ok(result.results, 'Should return results');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getSpecies returns catalog response', async () => {
  const { getSpecies } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'species-1', name: 'Human' }],
  });

  try {
    const result = await getSpecies();
    assert.ok(result.results, 'Should return results');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getItems returns catalog response', async () => {
  const { getItems } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'item-1', name: 'Longsword' }],
  });

  try {
    const result = await getItems();
    assert.ok(result.results, 'Should return results');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getFeatures returns catalog response', async () => {
  const { getFeatures } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'feat-1', name: 'Extra Attack' }],
  });

  try {
    const result = await getFeatures();
    assert.ok(result.results, 'Should return results');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: getFeats returns catalog response', async () => {
  const { getFeats } = await import('../src/lib/api-catalog-client.ts');

  mockFetchSuccess({
    ruleset: '5.5e-2024',
    results: [{ id: 'feat-1', name: 'War Caster' }],
  });

  try {
    const result = await getFeats();
    assert.ok(result.results, 'Should return results');
  } finally {
    restoreFetch();
  }
});

test('api-catalog-client: filterCatalogByName filters case-insensitive', async () => {
  const { filterCatalogByName } = await import('../src/lib/api-catalog-client.ts');

  const catalog = {
    results: [
      { id: '1', name: 'Fireball' },
      { id: '2', name: 'Water Breath' },
      { id: '3', name: 'fire bolt' },
    ],
  };

  const filtered = filterCatalogByName(catalog, 'fire');
  assert.equal(filtered.length, 2, 'Should match Fireball and fire bolt');
});

test('api-catalog-client: getCatalogEntry finds entry by id', async () => {
  const { getCatalogEntry } = await import('../src/lib/api-catalog-client.ts');

  const catalog = {
    results: [
      { id: 'spell-1', name: 'Fireball' },
      { id: 'spell-2', name: 'Magic Missile' },
    ],
  };

  const entry = getCatalogEntry(catalog, 'spell-1');
  assert.ok(entry, 'Should find entry');
  assert.equal(entry.name, 'Fireball');
});

test('api-catalog-client: no local fallback - throws on backend failure', async () => {
  const { getCatalog, BackendError } = await import('../src/lib/api-catalog-client.ts');

  mockFetchFailure();

  try {
    await assert.rejects(
      async () => getCatalog('classes'),
      {
        name: 'BackendError',
      },
      'Should throw BackendError instead of using local fallback',
    );
  } finally {
    restoreFetch();
  }
});
