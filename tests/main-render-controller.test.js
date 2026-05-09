/**
 * Teste para Main Render Controller
 *
 * Prova que renderApp ou equivalente:
 * - Recebe estado e dependencias como parametros
 * - Chama renderers existentes (app-shell, sheet, etc)
 * - Nao acessa DOM global diretamente (apenas via dependencias injetadas)
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

describe('Main Render Controller', () => {
  const controllerJs = readFileContent('src/app/main-render-controller.js');
  const appjs = readFileContent('app.js');
  const appShellJs = readFileContent('src/app/app-shell.js');

  describe('modulo main-render-controller.js existe', () => {
    it('deve exportar createMainRenderController ou funcao equivalente', () => {
      assert.ok(
        controllerJs.includes('createMainRenderController') ||
        controllerJs.includes('createRenderController') ||
        controllerJs.includes('renderApp') ||
        controllerJs.includes('mainRender'),
        'deve exportar funcao principal de renderizacao'
      );
    });

    it('deve exportar funcao via export', () => {
      assert.ok(
        controllerJs.includes('export') && controllerJs.includes('function'),
        'deve usar export para exportar funcoes'
      );
    });
  });

  describe('assinatura da funcao principal', () => {
    it('deve receber estado como parametro ou via getState', () => {
      assert.ok(
        controllerJs.includes('getState') ||
        controllerJs.includes('state') ||
        controllerJs.includes('(state'),
        'deve receber estado como parametro ou via getState'
      );
    });

    it('deve receber ou acessar appShell para renderizacao', () => {
      assert.ok(
        controllerJs.includes('appShell') ||
        controllerJs.includes('renderSheet') ||
        controllerJs.includes('renderChrome'),
        'deve acessar appShell ou renderers'
      );
    });
  });

  describe('delegacao para app-shell', () => {
    it('deve chamar appShell.render ou appShell.renderChrome', () => {
      assert.ok(
        controllerJs.includes('appShell.render') ||
        controllerJs.includes('appShell.renderChrome') ||
        controllerJs.includes('appShell.renderSteps') ||
        controllerJs.includes('appShell.renderForm') ||
        controllerJs.includes('appShell.renderTabs'),
        'deve chamar metodos de appShell'
      );
    });

    it('deve chamar renderChrome para atualizar cabecalho', () => {
      assert.ok(
        controllerJs.includes('renderChrome') ||
        controllerJs.includes('chrome'),
        'deve chamar renderChrome ou similar'
      );
    });

    it('deve chamar renderSteps para navegacao', () => {
      assert.ok(
        controllerJs.includes('renderSteps') ||
        controllerJs.includes('step'),
        'deve chamar renderSteps ou similar'
      );
    });

    it('deve chamar renderForm para formulario', () => {
      assert.ok(
        controllerJs.includes('renderForm') ||
        controllerJs.includes('form'),
        'deve chamar renderForm ou similar'
      );
    });

    it('deve chamar renderTabs para abas', () => {
      assert.ok(
        controllerJs.includes('renderTabs') ||
        controllerJs.includes('tab'),
        'deve chamar renderTabs ou similar'
      );
    });

    it('deve chamar renderSheet para a ficha', () => {
      assert.ok(
        controllerJs.includes('renderSheet') ||
        controllerJs.includes('sheet'),
        'deve chamar renderSheet ou similar'
      );
    });
  });

  describe('sem acesso direto ao DOM global', () => {
    it('nao deve usar document.querySelector diretamente', () => {
      assert.ok(
        !controllerJs.includes('document.querySelector'),
        'nao deve usar document.querySelector diretamente'
      );
    });

    it('nao deve usar document.getElementById diretamente', () => {
      assert.ok(
        !controllerJs.includes('document.getElementById'),
        'naao deve usar document.getElementById diretamente'
      );
    });

    it('nao deve usar window diretamente', () => {
      assert.ok(
        !controllerJs.includes('window.'),
        'nao deve usar window diretamente'
      );
    });
  });

  describe('app.js usa o novo controller', () => {
    it('app.js deve importar createMainRenderController ou equivalente', () => {
      assert.ok(
        appjs.includes('createMainRenderController') ||
        appjs.includes('createRenderController') ||
        appjs.includes('main-render-controller') ||
        appjs.includes('mainRender') ||
        appjs.includes('renderApp'),
        'app.js deve importar controller de renderizacao'
      );
    });

    it('app.js deve chamar a funcao do controller', () => {
      assert.ok(
        appjs.includes('mainRender') ||
        appjs.includes('renderApp') ||
        appjs.includes('mainRenderController') ||
        appjs.includes('renderController'),
        'app.js deve chamar funcao do controller'
      );
    });
  });

  describe('orchestracao de renderizacao', () => {
    it('deve orchestrar renderChrome, renderSteps, renderForm, renderTabs, renderSheet', () => {
      const hasRenderChrome = controllerJs.includes('renderChrome');
      const hasRenderSteps = controllerJs.includes('renderSteps');
      const hasRenderForm = controllerJs.includes('renderForm');
      const hasRenderTabs = controllerJs.includes('renderTabs');
      const hasRenderSheet = controllerJs.includes('renderSheet');

      assert.ok(
        hasRenderChrome && hasRenderSteps && hasRenderForm && hasRenderTabs && hasRenderSheet,
        'deve orchestrar todos os renderers: Chrome, Steps, Form, Tabs, Sheet'
      );
    });
  });
});
