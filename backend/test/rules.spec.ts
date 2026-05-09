import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';

test('GET /rules/backgrounds returns local compacted backgrounds', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/backgrounds'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.equal(payload.results[0].name, 'Aberrant Heir');
  } finally {
    await app.close();
  }
});

test('GET /rules/classes returns local compacted classes', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/classes'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.equal(payload.results[0].name, 'Artificer');
  } finally {
    await app.close();
  }
});

test('GET /rules/spells returns local compacted spells', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/spells'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.equal(payload.results[0].name, 'Acid Splash');
  } finally {
    await app.close();
  }
});

test('GET /rules/class-spells returns local compacted class spell lists', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/class-spells'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.equal(payload.results[0].className, 'Bard');
    assert.ok(payload.results[0].spells.length > 0);
  } finally {
    await app.close();
  }
});

test('GET /rules/species returns local compacted species', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/species'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    const speciesResults = payload.results as Array<{ name?: string; source?: string }>;
    assert.ok(speciesResults.some((species) => species.name === 'Aarakocra' && species.source === 'MPMM'));
    assert.ok(speciesResults.some((species) => species.name === 'Human' && species.source === 'XPHB'));
  } finally {
    await app.close();
  }
});

test('GET /rules/items returns local compacted items', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/items'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.equal(payload.results[0].name, "Alchemist's Supplies");
  } finally {
    await app.close();
  }
});

test('GET /rules/features returns local compacted class and subclass features', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/features'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 300);
    assert.equal(payload.results[0].name, 'Spellcasting');
    assert.ok(payload.results.some((entry: { name: string }) => entry.name === 'Alchemist'));
  } finally {
    await app.close();
  }
});

test('GET /rules/feats returns local compacted feats', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/feats'
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.equal(payload.results[0].name, 'Ability Score Improvement');
  } finally {
    await app.close();
  }
});
