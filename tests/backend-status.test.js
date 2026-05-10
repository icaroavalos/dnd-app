/**
 * Testes para backend-status.js
 *
 * Valida que:
 * - Selects ficam bloqueados quando backend está indisponível
 * - Mensagem clara é exibida
 * - Selects funcionam normalmente quando backend está disponível
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('backend-status: isApiReady returns false when api is empty', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { api: {} };
  const { isApiReady } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  assert.equal(isApiReady(), false, 'Should return false when api is empty');
});

test('backend-status: isApiReady returns false when classOptions is missing', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = {
    api: {
      source: {
        raceOptions: [['human', 'Human']],
        backgroundOptions: [['acolyte', 'Acolyte']],
      }
    }
  };
  const { isApiReady } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  assert.equal(isApiReady(), false, 'Should return false when classOptions is missing');
});

test('backend-status: isApiReady returns true when all catalogs are present', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = {
    api: {
      source: {
        classOptions: [['barbarian', 'Barbarian']],
        raceOptions: [['human', 'Human']],
        backgroundOptions: [['acolyte', 'Acolyte']],
      }
    }
  };
  const { isApiReady } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  assert.equal(isApiReady(), true, 'Should return true when all catalogs are present');
});

test('backend-status: hasApiError returns true when apiError is set', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { apiError: 'Backend indisponível' };
  const { hasApiError } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  assert.equal(hasApiError(), true, 'Should return true when apiError is set');
});

test('backend-status: hasApiError returns false when apiError is undefined', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { apiError: undefined };
  const { hasApiError } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  assert.equal(hasApiError(), false, 'Should return false when apiError is undefined');
});

test('backend-status: getErrorMessage returns error message', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { apiError: 'Erro de conexão com backend' };
  const { getErrorMessage } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  assert.equal(getErrorMessage(), 'Erro de conexão com backend', 'Should return error message');
});

test('backend-status: renderErrorBanner returns empty string when no error', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { apiError: undefined };
  const { renderErrorBanner } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  const banner = renderErrorBanner();
  assert.equal(banner, '', 'Should return empty string when no error');
});

test('backend-status: renderErrorBanner returns error banner HTML', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { apiError: 'Backend indisponível' };
  const { renderErrorBanner } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  const banner = renderErrorBanner();
  assert.ok(banner.includes('backend-error-banner'), 'Should include error banner class');
  assert.ok(banner.includes('Backend indisponível'), 'Should include error message');
  assert.ok(banner.includes('localhost:3100'), 'Should include backend URL hint');
});

test('backend-status: renderDisabledSelect renders disabled select with message', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { apiError: 'Backend offline' };
  const { renderDisabledSelect } = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  const html = renderDisabledSelect([], '', 'class', 'class-select');
  assert.ok(html.includes('select-disabled'), 'Should include disabled select class');
  assert.ok(html.includes('select-disabled-message'), 'Should include message class');
  assert.ok(html.includes('Aguardando backend'), 'Should include waiting message');
  assert.ok(html.includes('disabled'), 'Should be disabled');
});

test('backend-status: renderSelectOrDisabled renders disabled when API not ready', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = { api: {} };
  const backendStatus = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  const html = backendStatus.renderSelectOrDisabled([], '', 'class', 'class-select', false);
  assert.ok(html.includes('select-disabled'), 'Should render disabled select when API not ready');
});

test('backend-status: renderSelectOrDisabled renders normal select when API ready', async () => {
  const { createBackendStatus } = await import('../src/app/backend-status.js');

  const state = {
    api: {
      source: {
        classOptions: [['barbarian', 'Barbarian']],
        raceOptions: [['human', 'Human']],
        backgroundOptions: [['acolyte', 'Acolyte']],
      }
    }
  };
  const backendStatus = createBackendStatus({
    getState: () => state,
    setState: () => {},
  });

  const options = [['barbarian', 'Barbarian'], ['fighter', 'Fighter']];
  const html = backendStatus.renderSelectOrDisabled(options, 'barbarian', 'class', 'class-select', false);
  assert.ok(html.includes('<select'), 'Should include select element');
  assert.ok(html.includes('barbarian'), 'Should include option value');
  assert.ok(html.includes('selected'), 'Should have selected option');
  assert.ok(!html.includes('select-disabled'), 'Should not include disabled wrapper');
});
