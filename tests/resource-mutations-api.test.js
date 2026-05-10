/**
 * Testes de contrato para mutações de recursos via API.
 * Valida:
 * - Gasto de recurso (useResource)
 * - Recuperação de recursos (shortRest, longRest)
 * - Fallback local quando backend falha
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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

function restoreFetch() {
  global.fetch = originalFetch;
}

function createBaseCharacter(overrides = {}) {
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test Character',
    class: 'fighter',
    level: 1,
    resources: {
      second_wind: { used: 0, max: 1, recovery: 'short_rest' },
      ki: { used: 0, max: 2, recovery: 'short_rest' },
    },
    hp: 12,
    tempHp: 0,
    hitDiceUsed: 0,
    spellSlots: {},
    inventory: [],
    equippedItems: [],
    ...overrides,
  };
}

function createMockState(character) {
  return {
    character,
    api: { classes: { fighter: { hit_die: 8 } } },
    restModalHitDice: {},
    restModalType: 'short',
    validationMessage: '',
    restModalOpen: false,
    restModalContent: null,
  };
}

describe('resource-mutations-api', () => {
  it('useResource spends resource on success', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { useResource: apiUseResource } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchSuccess({
      resources: { second_wind: { used: 1, max: 1, recovery: 'short_rest' } },
    });

    const character = createBaseCharacter();
    const state = createMockState(character);

    const { useResource } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [
    { id: 'second_wind', name: 'Second Wind', max: 1, recovery: 'short_rest' }
  ],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { useResource: apiUseResource },
    });

    await useResource('second_wind');

    assert.equal(state.character.resources.second_wind.used, 1, 'Should spend resource');
    restoreFetch();
  });

  it('useResource falls back to local on failure', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { useResource: apiUseResource } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchFailure();

    const character = createBaseCharacter();
    const state = createMockState(character);

    const { useResource } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [
    { id: 'second_wind', name: 'Second Wind', max: 1, recovery: 'short_rest' }
  ],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { useResource: apiUseResource },
    });

    await useResource('second_wind');

    assert.equal(state.character.resources.second_wind.used, 1, 'Should fallback to local');
    restoreFetch();
  });

  it('recoverShortRestResources recovers resources', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { shortRest: apiShortRest } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchSuccess({
      resources: { second_wind: { used: 0, max: 1, recovery: 'short_rest' } },
    });

    const character = createBaseCharacter({ resources: { second_wind: { used: 1, max: 1, recovery: 'short_rest' } } });
    const state = createMockState(character);

    const { recoverShortRestResources } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [
    { id: 'second_wind', name: 'Second Wind', max: 1, recovery: 'short_rest' }
  ],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { shortRest: apiShortRest },
    });

    await recoverShortRestResources();

    assert.equal(state.character.resources.second_wind.used, 0, 'Should recover resource');
    restoreFetch();
  });

  it('recoverShortRestResources falls back to local on failure', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { shortRest: apiShortRest } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchFailure();

    const character = createBaseCharacter({ resources: { second_wind: { used: 1, max: 1, recovery: 'short_rest' } } });
    const state = createMockState(character);

    const { recoverShortRestResources } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [
    { id: 'second_wind', name: 'Second Wind', max: 1, recovery: 'short_rest' }
  ],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { shortRest: apiShortRest },
    });

    await recoverShortRestResources();

    assert.equal(state.character.resources.second_wind.used, 0, 'Should fallback to local recovery');
    restoreFetch();
  });

  it('recoverLongRestResources recovers all resources', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { longRest: apiLongRest } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchSuccess({
      resources: { second_wind: { used: 0, max: 1, recovery: 'short_rest' } },
    });

    const character = createBaseCharacter({ resources: { second_wind: { used: 1, max: 1, recovery: 'short_rest' } } });
    const state = createMockState(character);

    const { recoverLongRestResources } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [
    { id: 'second_wind', name: 'Second Wind', max: 1, recovery: 'short_rest' }
  ],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { longRest: apiLongRest },
    });

    await recoverLongRestResources();

    assert.equal(state.character.resources.second_wind.used, 0, 'Should recover all resources');
    restoreFetch();
  });

  it('spendAmmo spends ammo on success', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { spendAmmo: apiSpendAmmo } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchSuccess({});

    const character = createBaseCharacter({ inventory: [{ id: 'arrows', name: 'Arrows', quantity: 20 }] });
    const state = createMockState(character);

    const { spendAmmo } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { spendAmmo: apiSpendAmmo },
    });

    await spendAmmo('arrows', 1);

    assert.ok(true, 'Should call spendAmmo API');
    restoreFetch();
  });

  it('spendAmmo falls back to local on failure', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { spendAmmo: apiSpendAmmo } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchFailure();

    const character = createBaseCharacter({ inventory: [{ id: 'arrows', name: 'Arrows', quantity: 20 }] });
    const state = createMockState(character);

    const { spendAmmo } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { spendAmmo: apiSpendAmmo },
    });

    await spendAmmo('arrows', 1);

    assert.equal(state.character.inventory[0].quantity, 19, 'Should decrement ammo quantity');
    restoreFetch();
  });

  it('recoverAmmo recovers ammo on success', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { recoverAmmo: apiRecoverAmmo } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchSuccess({});

    const character = createBaseCharacter({ inventory: [{ id: 'arrows', name: 'Arrows', quantity: 10 }] });
    const state = createMockState(character);

    const { recoverAmmo } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { recoverAmmo: apiRecoverAmmo },
    });

    await recoverAmmo('arrows', 5);

    assert.ok(true, 'Should call recoverAmmo API');
    restoreFetch();
  });

  it('recoverAmmo falls back to local on failure', async () => {
    const { createResourceHelpers } = await import('../src/app/resource-helpers.js');
    const { recoverAmmo: apiRecoverAmmo } = await import('../dist/src/lib/api-resource-mutations.js');

    mockFetchFailure();

    const character = createBaseCharacter({ inventory: [{ id: 'arrows', name: 'Arrows', quantity: 10 }] });
    const state = createMockState(character);

    const { recoverAmmo } = createResourceHelpers({
      getState: () => state,
      currentResourceDefinitions: () => [],
      clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
      currentActionItems: () => [],
      castSpell: () => {},
      maxHitPoints: () => 12,
      resetSpellSlots: () => {},
      persist: () => {},
      render: () => {},
      renderSheet: () => {},
      renderRestModal: () => {},
      deriveProjectedAbilityModifier: () => 0,
      apiClient: { recoverAmmo: apiRecoverAmmo },
    });

    await recoverAmmo('arrows', 5);

    assert.equal(state.character.inventory[0].quantity, 15, 'Should increment ammo quantity');
    restoreFetch();
  });
});
