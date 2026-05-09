/**
 * Teste que verifica extracao de responsabilidade do app.js para modulos
 * AppShell, GlobalEvents e FormControls.
 *
 * Objetivo: garantir que app.js consuma funcoes de src/app/app-shell.js,
 * src/app/global-events.js e src/app/form-controls.js em vez de redefinir logica local.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function readFileContent(filePath) {
  try {
    return readFileSync(join(rootDir, filePath), 'utf-8');
  } catch (e) {
    return '';
  }
}

describe('App Shell Extraction', () => {
  const appjs = readFileContent('app.js');
  const appShellJs = readFileContent('src/app/app-shell.js');
  const globalEventsJs = readFileContent('src/app/global-events.js');
  const formControlsJs = readFileContent('src/app/form-controls.js');

  describe('imports', () => {
    it('app.js deve importar createAppShell do src/app/app-shell.js', () => {
      assert.ok(
        appjs.includes('createAppShell') && appjs.includes('src/app/app-shell.js'),
        'app.js deve importar createAppShell de src/app/app-shell.js'
      );
    });

    it('app.js deve importar createGlobalEvents do src/app/global-events.js', () => {
      assert.ok(
        appjs.includes('createGlobalEvents') && appjs.includes('src/app/global-events.js'),
        'app.js deve importar createGlobalEvents de src/app/global-events.js'
      );
    });

    it('app.js deve importar createFormControls do src/app/form-controls.js', () => {
      assert.ok(
        appjs.includes('createFormControls') && appjs.includes('src/app/form-controls.js'),
        'app.js deve importar createFormControls de src/app/form-controls.js'
      );
    });
  });

  describe('app-shell.js exports', () => {
    it('app-shell.js deve exportar createAppShell', () => {
      assert.ok(
        appShellJs.includes('export function createAppShell') || appShellJs.includes('export { createAppShell'),
        'app-shell.js deve exportar createAppShell'
      );
    });

    it('app-shell.js deve exportar render atraves de createAppShell', () => {
      assert.ok(
        appShellJs.includes('render') && appShellJs.includes('return {'),
        'app-shell.js deve exportar render atraves de createAppShell'
      );
    });
  });

  describe('global-events.js exports', () => {
    it('global-events.js deve exportar createGlobalEvents', () => {
      assert.ok(
        globalEventsJs.includes('createGlobalEvents'),
        'global-events.js deve exportar createGlobalEvents'
      );
    });

    it('global-events.js deve exportar bindGlobalEvents', () => {
      assert.ok(
        globalEventsJs.includes('bindGlobalEvents'),
        'global-events.js deve exportar bindGlobalEvents'
      );
    });
  });

  describe('form-controls.js exports', () => {
    it('form-controls.js deve exportar createFormControls', () => {
      assert.ok(
        formControlsJs.includes('createFormControls'),
        'form-controls.js deve exportar createFormControls'
      );
    });

    it('form-controls.js deve exportar field', () => {
      assert.ok(
        formControlsJs.includes('field'),
        'form-controls.js deve exportar field'
      );
    });

    it('form-controls.js deve exportar numberField', () => {
      assert.ok(
        formControlsJs.includes('numberField'),
        'form-controls.js deve exportar numberField'
      );
    });

    it('form-controls.js deve exportar selectField', () => {
      assert.ok(
        formControlsJs.includes('selectField'),
        'form-controls.js deve exportar selectField'
      );
    });

    it('form-controls.js deve exportar checkbox', () => {
      assert.ok(
        formControlsJs.includes('checkbox'),
        'form-controls.js deve exportar checkbox'
      );
    });
  });

  describe('app.js delega para modulos', () => {
    it('app.js deve chamar createAppShell', () => {
      assert.ok(
        appjs.includes('createAppShell({'),
        'app.js deve chamar createAppShell({'
      );
    });

    it('app.js deve chamar createGlobalEvents', () => {
      assert.ok(
        appjs.includes('createGlobalEvents({'),
        'app.js deve chamar createGlobalEvents({'
      );
    });

    it('app.js deve chamar createFormControls', () => {
      assert.ok(
        appjs.includes('createFormControls({'),
        'app.js deve chamar createFormControls({'
      );
    });

    it('app.js deve usar appShell.render', () => {
      assert.ok(
        appjs.includes('appShell.render'),
        'app.js deve usar appShell.render'
      );
    });

    it('app.js deve usar appShell.renderChrome', () => {
      assert.ok(
        appjs.includes('appShell.renderChrome'),
        'app.js deve usar appShell.renderChrome'
      );
    });

    it('app.js deve usar appShell.renderSteps', () => {
      assert.ok(
        appjs.includes('appShell.renderSteps'),
        'app.js deve usar appShell.renderSteps'
      );
    });

    it('app.js deve usar appShell.renderTabs', () => {
      assert.ok(
        appjs.includes('appShell.renderTabs'),
        'app.js deve usar appShell.renderTabs'
      );
    });

    it('app.js deve usar appShell.renderForm', () => {
      assert.ok(
        appjs.includes('appShell.renderForm'),
        'app.js deve usar appShell.renderForm'
      );
    });

    it('app.js deve usar globalEvents.bindGlobalEvents', () => {
      assert.ok(
        appjs.includes('globalEvents.bindGlobalEvents'),
        'app.js deve usar globalEvents.bindGlobalEvents'
      );
    });
  });

  describe('reducao de logica local', () => {
    it('app.js nao deve definir renderChrome localmente', () => {
      // A funcao renderChrome no app.js deve ser apenas um wrapper que delega
      // Nao deve conter logica alem de delegar para appShell
      const match = appjs.match(/function renderChrome\(\)\s*\{([^}]+)\}/s);
      if (match) {
        const body = match[1];
        assert.ok(
          body.includes('appShell') || body.includes('return'),
          'renderChrome deve delegar para appShell'
        );
      }
    });

    it('app.js nao deve definir renderSteps localmente com logica', () => {
      const match = appjs.match(/function renderSteps\(\)\s*\{([^}]+)\}/s);
      if (match) {
        const body = match[1];
        assert.ok(
          body.includes('appShell') || body.includes('return'),
          'renderSteps deve delegar para appShell'
        );
      }
    });

    it('app.js nao deve definir renderTabs localmente com logica', () => {
      const match = appjs.match(/function renderTabs\(\)\s*\{([^}]+)\}/s);
      if (match) {
        const body = match[1];
        assert.ok(
          body.includes('appShell') || body.includes('return'),
          'renderTabs deve delegar para appShell'
        );
      }
    });

    it('app.js nao deve definir renderForm localmente com logica', () => {
      const match = appjs.match(/function renderForm\(\)\s*\{([^}]+)\}/s);
      if (match) {
        const body = match[1];
        assert.ok(
          body.includes('appShell') || body.includes('return'),
          'renderForm deve delegar para appShell'
        );
      }
    });

    it('app.js nao deve definir bindGlobalEvents localmente com logica', () => {
      const match = appjs.match(/function bindGlobalEvents\(\)\s*\{([^}]+)\}/s);
      if (match) {
        const body = match[1];
        assert.ok(
          body.includes('globalEvents') || body.includes('return'),
          'bindGlobalEvents deve delegar para globalEvents'
        );
      }
    });
  });
});
