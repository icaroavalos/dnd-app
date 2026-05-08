import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAppConfig } from '../src/config/app-config.js';
import { createApp } from '../src/main.js';

test('GET /health returns backend status payload', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.equal(response.statusCode, 200);

    assert.deepEqual(response.json(), {
      status: 'ok',
      app: 'dnd-app-backend',
      transport: 'fastify',
      environment: 'development'
    });
  } finally {
    await app.close();
  }
});

test('GET /health/ready confirms the compacted rules dataset is available', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready'
    });

    assert.equal(response.statusCode, 200);

    assert.deepEqual(response.json(), {
      status: 'ready',
      app: 'dnd-app-backend',
      rulesData: 'ok',
      rulesDataDir: '/Users/icaro/codes/dnd-app/data/5etools/5e-2024'
    });
  } finally {
    await app.close();
  }
});

test('loadAppConfig validates explicit environment values', () => {
  assert.throws(
    () => loadAppConfig({ NODE_ENV: 'staging' }),
    /Invalid NODE_ENV/
  );

  assert.throws(
    () => loadAppConfig({ PORT: '99999' }),
    /Invalid PORT/
  );

  assert.deepEqual(loadAppConfig({ NODE_ENV: 'test', PORT: '3200', HOST: '127.0.0.1' }), {
    environment: 'test',
    port: 3200,
    host: '127.0.0.1',
    logLevel: 'silent',
    rulesDataDir: '/Users/icaro/codes/dnd-app/data/5etools/5e-2024'
  });

  assert.throws(
    () => loadAppConfig({ LOG_LEVEL: 'trace' }),
    /Invalid LOG_LEVEL/
  );
});
