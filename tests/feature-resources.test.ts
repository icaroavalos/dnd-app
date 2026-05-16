import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deriveResourcesFromFeatures } from '../frontend/src/lib/feature-resources.ts';

describe('feature resource projection', () => {
  it('normaliza recursos de features para o contrato usado por Actions', () => {
    const resources = deriveResourcesFromFeatures([
      {
        id: 'second-wind|xphb',
        name: 'Second Wind',
        resource: {
          id: 'second-wind|xphb',
          remaining: 2,
          max: 2,
          recovery: 'inc',
          recoveryLabel: 'Long Rest (+1 Short)',
          recoveryAmount: 1,
        },
      },
      {
        id: 'adrenaline-rush-species-xphb',
        name: 'Adrenaline Rush',
        resource: {
          id: 'adrenaline-rush-species-xphb',
          remaining: 2,
          max: 2,
          recovery: 'full',
          recoveryLabel: 'Short Rest',
        },
      },
    ]);

    assert.deepEqual(resources.second_wind, {
      current: 2,
      max: 2,
      recovery: 'short_rest',
      recoveryAmount: 1,
    });
    assert.deepEqual(resources.adrenaline_rush, {
      current: 2,
      max: 2,
      recovery: 'short_rest',
    });
  });
});
