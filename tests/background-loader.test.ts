/**
 * Background Loader Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { loadBackgroundData, getAllBackgrounds, getBackground, getBackgroundsBySource, clearBackgroundCache } from '../src/core/character/background-loader.js';

describe('Background Loader', () => {
  beforeEach(() => {
    clearBackgroundCache();
  });

  it('should load background data from file', async () => {
    const backgrounds = await loadBackgroundData();

    assert.ok(Array.isArray(backgrounds), 'Should return an array');
    assert.ok(backgrounds.length > 0, 'Should have backgrounds');
  });

  it('should return cached data on subsequent calls', async () => {
    await loadBackgroundData();
    const second = getAllBackgrounds();

    assert.ok(second.length > 0, 'Should return data from cache');
  });

  it('should find Acolyte from XPHB', async () => {
    await loadBackgroundData();
    const acolyte = getBackground('Acolyte', 'XPHB');

    assert.ok(acolyte, 'Acolyte should exist in XPHB');
    assert.strictEqual(acolyte.name, 'Acolyte');
    assert.strictEqual(acolyte.source, 'XPHB');
  });

  it('should return undefined for non-existent background', async () => {
    await loadBackgroundData();
    const nonExistent = getBackground('NonExistent', 'XPHB');

    assert.strictEqual(nonExistent, undefined);
  });

  it('should filter by source', async () => {
    await loadBackgroundData();
    const xphbBackgrounds = getBackgroundsBySource('XPHB');

    assert.ok(xphbBackgrounds.length > 0, 'Should have XPHB backgrounds');
    xphbBackgrounds.forEach((bg) => {
      assert.strictEqual(bg.source, 'XPHB', `${bg.name} should be XPHB`);
    });
  });
});