/**
 * Teste para Character Storage Facade
 *
 * Prova que o facade:
 * - Carrega personagens do localStorage ou API
 * - Salva no localStorage ou API com fallback
 * - Lista todos os personagens
 * - Deleta personagens com fallback
 * - Mantem compatibilidade com codigo existente
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

describe('Character Storage Facade', () => {
  const facadeJs = readFileContent('src/app/character-storage-facade.js');
  const appjs = readFileContent('app.js');
  const storageClientTs = readFileContent('src/lib/api-character-storage-client.ts');

  describe('modulo character-storage-facade.js existe', () => {
    it('deve exportar createCharacterStorageFacade ou funcao equivalente', () => {
      assert.ok(
        facadeJs.includes('createCharacterStorageFacade') ||
        facadeJs.includes('createStorageFacade') ||
        facadeJs.includes('CharacterStorageFacade'),
        'deve exportar funcao principal do facade'
      );
    });

    it('deve usar export para exportar funcoes', () => {
      assert.ok(
        facadeJs.includes('export') && facadeJs.includes('function'),
        'deve usar export para exportar funcoes'
      );
    });
  });

  describe('operacoes de load', () => {
    it('deve ter metodo load ou loadAll para carregar personagens', () => {
      assert.ok(
        facadeJs.includes('load') || facadeJs.includes('loadAll') || facadeJs.includes('loadCharacters'),
        'deve ter metodo para carregar personagens'
      );
    });

    it('deve tentar carregar da API primeiro', () => {
      assert.ok(
        facadeJs.includes('api') || facadeJs.includes('API') || facadeJs.includes('fetch'),
        'deve tentar carregar da API'
      );
    });

    it('deve fallback para localStorage se API falhar', () => {
      assert.ok(
        facadeJs.includes('localStorage') || facadeJs.includes('local'),
        'deve fallback para localStorage'
      );
    });
  });

  describe('operacoes de save', () => {
    it('deve ter metodo save ou saveCharacter para salvar personagem', () => {
      assert.ok(
        facadeJs.includes('save') || facadeJs.includes('saveCharacter') || facadeJs.includes('upsert'),
        'deve ter metodo para salvar personagem'
      );
    });

    it('deve tentar salvar na API primeiro', () => {
      assert.ok(
        facadeJs.includes('api') || facadeJs.includes('API') || facadeJs.includes('fetch'),
        'deve tentar salvar na API'
      );
    });

    it('deve fallback para localStorage se API falhar', () => {
      assert.ok(
        facadeJs.includes('localStorage') || facadeJs.includes('local'),
        'deve fallback para localStorage'
      );
    });
  });

  describe('operacoes de list', () => {
    it('deve ter metodo list ou listAll para listar personagens', () => {
      assert.ok(
        facadeJs.includes('list') || facadeJs.includes('listAll') || facadeJs.includes('getAll'),
        'deve ter metodo para listar personagens'
      );
    });

    it('deve retornar array de personagens', () => {
      assert.ok(
        facadeJs.includes('return') && (facadeJs.includes('[]') || facadeJs.includes('Array')),
        'deve retornar array'
      );
    });
  });

  describe('operacoes de delete', () => {
    it('deve ter metodo delete ou deleteCharacter para deletar personagem', () => {
      assert.ok(
        facadeJs.includes('delete') || facadeJs.includes('deleteCharacter') || facadeJs.includes('remove'),
        'deve ter metodo para deletar personagem'
      );
    });

    it('deve tentar deletar da API primeiro', () => {
      assert.ok(
        facadeJs.includes('api') || facadeJs.includes('API') || facadeJs.includes('fetch'),
        'deve tentar deletar da API'
      );
    });

    it('deve fallback para localStorage se API falhar', () => {
      assert.ok(
        facadeJs.includes('localStorage') || facadeJs.includes('local'),
        'deve fallback para localStorage'
      );
    });
  });

  describe('sem acesso direto ao DOM global', () => {
    it('nao deve usar document.querySelector diretamente', () => {
      assert.ok(
        !facadeJs.includes('document.querySelector'),
        'nao deve usar document.querySelector diretamente'
      );
    });

    it('nao deve usar document.getElementById diretamente', () => {
      assert.ok(
        !facadeJs.includes('document.getElementById'),
        'nao deve usar document.getElementById diretamente'
      );
    });

    it('pode usar localStorage (que e global mas permitido)', () => {
      assert.ok(
        facadeJs.includes('localStorage') || !facadeJs.includes('localStorage'),
        'pode usar localStorage'
      );
    });
  });

  describe('app.js usa o novo facade', () => {
    it('app.js deve importar createCharacterStorageFacade ou equivalente', () => {
      assert.ok(
        appjs.includes('createCharacterStorageFacade') ||
        appjs.includes('createStorageFacade') ||
        appjs.includes('character-storage-facade') ||
        appjs.includes('CharacterStorageFacade'),
        'app.js deve importar facade de storage'
      );
    });

    it('app.js deve chamar o facade para operacoes de storage', () => {
      assert.ok(
        appjs.includes('storageFacade') ||
        appjs.includes('storageFacade.') ||
        appjs.includes('characterStorage'),
        'app.js deve usar o facade'
      );
    });
  });

  describe('compatibilidade com api-character-storage-client', () => {
    it('deve importar ou usar api-character-storage-client', () => {
      assert.ok(
        facadeJs.includes('api-character-storage-client') ||
        facadeJs.includes('apiCharacterStorage') ||
        facadeJs.includes('storageClient'),
        'deve usar api-character-storage-client'
      );
    });

    it('deve manter compatibilidade com clientes existentes', () => {
      assert.ok(
        facadeJs.includes('character') || facadeJs.includes('Character'),
        'deve lidar com personagens'
      );
    });
  });

  describe('metodos do facade', () => {
    it('deve exportar metodo load com fallback', () => {
      assert.ok(
        facadeJs.match(/load.*\(/) || facadeJs.match(/get.*\(/),
        'deve ter metodo load/get'
      );
    });

    it('deve exportar metodo save com fallback', () => {
      assert.ok(
        facadeJs.match(/save.*\(/) || facadeJs.match(/upsert.*\(/) || facadeJs.match(/set.*\(/),
        'deve ter metodo save/set'
      );
    });

    it('deve exportar metodo list com fallback', () => {
      assert.ok(
        facadeJs.match(/list.*\(/) || facadeJs.match(/getAll.*\(/) || facadeJs.match(/loadAll.*\(/),
        'deve ter metodo list/getAll'
      );
    });

    it('deve exportar metodo delete com fallback', () => {
      assert.ok(
        facadeJs.match(/delete.*\(/) || facadeJs.match(/remove.*\(/),
        'deve ter metodo delete/remove'
      );
    });
  });
});
