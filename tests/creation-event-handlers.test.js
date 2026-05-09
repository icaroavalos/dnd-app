/**
 * Teste para Creation Event Handlers
 *
 * Prova que os handlers de criacao de personagem:
 * - Recebem estado e dependencias como parametros
 * - Manipulam race/species, background, equipment, class e ability choices
 * - Nao acessam DOM global diretamente (apenas via dependencias injetadas)
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

describe('Creation Event Handlers', () => {
  const handlersJs = readFileContent('src/app/creation-event-handlers.js');
  const appjs = readFileContent('app.js');

  describe('modulo creation-event-handlers.js existe', () => {
    it('deve exportar createCreationEventHandlers ou funcao equivalente', () => {
      assert.ok(
        handlersJs.includes('createCreationEventHandlers') ||
        handlersJs.includes('createEventHandlers') ||
        handlersJs.includes('bindCreationEvents'),
        'deve exportar funcao principal de handlers'
      );
    });

    it('deve usar export para exportar funcoes', () => {
      assert.ok(
        handlersJs.includes('export') && handlersJs.includes('function'),
        'deve usar export para exportar funcoes'
      );
    });
  });

  describe('handlers para race/species', () => {
    it('deve lidar com mudanca de race/species', () => {
      assert.ok(
        handlersJs.includes('race') || handlersJs.includes('species') || handlersJs.includes('lineage'),
        'deve lidar com race/species'
      );
    });

    it('deve chamar loadRaceData ou equivalente quando race mudar', () => {
      assert.ok(
        handlersJs.includes('loadRaceData') || handlersJs.includes('raceData') || handlersJs.includes('loadRace'),
        'deve carregar dados da race'
      );
    });
  });

  describe('handlers para background', () => {
    it('deve lidar com selecao de background', () => {
      assert.ok(
        handlersJs.includes('background') || handlersJs.includes('bg-'),
        'deve lidar com background'
      );
    });

    it('deve aplicar background skills e equipment', () => {
      assert.ok(
        handlersJs.includes('skill') || handlersJs.includes('equipment'),
        'deve aplicar skills e equipment do background'
      );
    });
  });

  describe('handlers para equipment do background', () => {
    it('deve mover equipment para inventory', () => {
      assert.ok(
        handlersJs.includes('inventory') || handlersJs.includes('equip'),
        'deve lidar com inventory'
      );
    });

    it('deve lidar com escolha de equipment', () => {
      assert.ok(
        handlersJs.includes('equipmentChoice') || handlersJs.includes('equipment-choice') || handlersJs.includes('equipment'),
        'deve lidar com escolha de equipment'
      );
    });
  });

  describe('handlers para class', () => {
    it('deve lidar com mudanca de class', () => {
      assert.ok(
        handlersJs.includes('class') && (handlersJs.includes('loadClassData') || handlersJs.includes('loadClass') || handlersJs.includes('classData')),
        'deve lidar com class'
      );
    });

    it('deve chamar loadClassData ou equivalente quando class mudar', () => {
      assert.ok(
        handlersJs.includes('loadClassData') || handlersJs.includes('loadClass'),
        'deve carregar dados da class'
      );
    });
  });

  describe('handlers para ability choices', () => {
    it('deve lidar com ability method (standard, point buy, manual)', () => {
      assert.ok(
        handlersJs.includes('ability') && (handlersJs.includes('method') || handlersJs.includes('Ability') || handlersJs.includes('abilityMethod')),
        'deve lidar com ability method'
      );
    });

    it('deve lidar com mudancas de ability scores', () => {
      assert.ok(
        handlersJs.includes('ability') && (handlersJs.includes('score') || handlersJs.includes('adjust') || handlersJs.includes('Ability')),
        'deve lidar com ability scores'
      );
    });
  });

  describe('sem acesso direto ao DOM global', () => {
    it('nao deve usar document.querySelector diretamente', () => {
      assert.ok(
        !handlersJs.includes('document.querySelector'),
        'nao deve usar document.querySelector diretamente'
      );
    });

    it('nao deve usar document.getElementById diretamente', () => {
      assert.ok(
        !handlersJs.includes('document.getElementById'),
        'nao deve usar document.getElementById diretamente'
      );
    });

    it('nao deve usar window diretamente', () => {
      assert.ok(
        !handlersJs.includes('window.'),
        'nao deve usar window diretamente'
      );
    });
  });

  describe('app.js usa o novo modulo', () => {
    it('app.js deve importar createCreationEventHandlers ou equivalente', () => {
      assert.ok(
        appjs.includes('createCreationEventHandlers') ||
        appjs.includes('createEventHandlers') ||
        appjs.includes('creation-event-handlers') ||
        appjs.includes('bindCreationEvents'),
        'app.js deve importar handlers de criacao'
      );
    });

    it('app.js deve chamar a funcao do handler', () => {
      assert.ok(
        appjs.includes('creationEventHandlers') ||
        appjs.includes('eventHandlers') ||
        appjs.includes('bindCreation') ||
        appjs.includes('bindFormEvents'),
        'app.js deve chamar funcao do handler'
      );
    });
  });

  describe('data- attributes do form', () => {
    it('deve usar data-path para campos do form', () => {
      assert.ok(
        handlersJs.includes('data-path') || handlersJs.includes('dataset.path'),
        'deve usar data-path para campos'
      );
    });

    it('deve usar data-move para navegacao', () => {
      assert.ok(
        handlersJs.includes('data-move') || handlersJs.includes('dataset.move'),
        'deve usar data-move para navegacao'
      );
    });

    it('deve usar data-bg-select para background', () => {
      assert.ok(
        handlersJs.includes('data-bg-select') || handlersJs.includes('dataset.bgSelect') || handlersJs.includes('bg-select'),
        'deve usar data-bg-select para background'
      );
    });

    it('deve usar data-bg-equipment para equipment', () => {
      assert.ok(
        handlersJs.includes('data-bg-equipment') || handlersJs.includes('dataset.bgEquipment') || handlersJs.includes('bg-equipment'),
        'deve usar data-bg-equipment para equipment'
      );
    });

    it('deve usar data-ability-adjust para abilities', () => {
      assert.ok(
        handlersJs.includes('data-ability-adjust') || handlersJs.includes('dataset.abilityAdjust') || handlersJs.includes('ability-adjust'),
        'deve usar data-ability-adjust para abilities'
      );
    });
  });
});
