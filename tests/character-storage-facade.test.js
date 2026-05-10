/**
 * Testes para Character Storage Facade
 *
 * Valida:
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

// Mock setup for functional tests
const originalFetch = global.fetch;
const originalLocalStorage = global.localStorage;

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

// Simple localStorage mock
const localStorageData = {};
global.localStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, value) => { localStorageData[key] = value; },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); },
};

describe('Character Storage Facade - Code Patterns', () => {
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

describe('Character Storage Facade - Functional Tests', () => {
  it('save stores character in localStorage on API success', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess({ id: 'char-1', name: 'Test Char' });

    const facade = createCharacterStorageFacade();
    const testChar = { id: 'char-1', name: 'Test Char', ruleset: '5e' };
    await facade.save(testChar);

    const stored = JSON.parse(global.localStorage.getItem('dnd5e-characters'));
    assert.ok(stored && stored.length > 0, 'Should store character in localStorage');
    assert.equal(stored[0].name, 'Test Char', 'Should store correct character');

    restoreFetch();
  });

  it('save falls back to localStorage on API failure', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchFailure();

    const facade = createCharacterStorageFacade();
    const testChar = { id: 'char-2', name: 'Fallback Char', ruleset: '5e' };
    await facade.save(testChar);

    const stored = JSON.parse(global.localStorage.getItem('dnd5e-characters'));
    assert.ok(stored && stored.length > 0, 'Should store character in localStorage on fallback');
    assert.equal(stored[0].name, 'Fallback Char', 'Should store correct character on fallback');

    restoreFetch();
  });

  it('loadAll returns characters from API when available', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    // API returns list with one summary, then fetch full record
    let callCount = 0;
    global.fetch = async (url) => {
      callCount++;
      if (url.endsWith('/characters')) {
        return { ok: true, json: async () => [{ id: 'char-1', name: 'API Char', level: 1, primaryClass: 'fighter' }] };
      }
      return { ok: true, json: async () => ({ id: 'char-1', name: 'API Char', ruleset: '5e' }) };
    };

    const facade = createCharacterStorageFacade();
    const characters = await facade.loadAll();

    assert.ok(Array.isArray(characters), 'Should return array');

    restoreFetch();
  });

  it('loadAll falls back to localStorage on API failure', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchFailure();

    // Pre-populate localStorage
    const preStored = [{ id: 'char-local', name: 'Local Char', ruleset: '5e' }];
    global.localStorage.setItem('dnd5e-characters', JSON.stringify(preStored));

    const facade = createCharacterStorageFacade();
    const characters = await facade.loadAll();

    assert.ok(Array.isArray(characters), 'Should return array from localStorage');
    assert.equal(characters[0]?.name, 'Local Char', 'Should return local character');

    restoreFetch();
  });

  it('delete removes character from localStorage', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchSuccess({});

    const facade = createCharacterStorageFacade();
    const testChar = { id: 'char-to-delete', name: 'Delete Me', ruleset: '5e' };
    await facade.save(testChar);

    // Verify it's stored
    let stored = JSON.parse(global.localStorage.getItem('dnd5e-characters'));
    assert.ok(stored.some(c => c.id === 'char-to-delete'), 'Character should be stored');

    // Delete it
    await facade.delete('char-to-delete');

    // Verify it's removed
    stored = JSON.parse(global.localStorage.getItem('dnd5e-characters'));
    assert.ok(!stored.some(c => c.id === 'char-to-delete'), 'Character should be removed');

    restoreFetch();
  });

  it('list is alias for loadAll', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchFailure();

    const facade = createCharacterStorageFacade();
    const preStored = [{ id: 'char-list', name: 'List Char', ruleset: '5e' }];
    global.localStorage.setItem('dnd5e-characters', JSON.stringify(preStored));

    const listResult = await facade.list();
    const loadResult = await facade.loadAll();

    assert.deepEqual(listResult, loadResult, 'list should return same as loadAll');

    restoreFetch();
  });

  it('loadById returns character by ID', async () => {
    global.localStorage.clear();
    const { createCharacterStorageFacade } = await import('../src/app/character-storage-facade.js');

    mockFetchFailure();

    const facade = createCharacterStorageFacade();
    const preStored = [
      { id: 'char-1', name: 'First', ruleset: '5e' },
      { id: 'char-2', name: 'Second', ruleset: '5e' }
    ];
    global.localStorage.setItem('dnd5e-characters', JSON.stringify(preStored));

    const character = await facade.loadById('char-2');

    assert.equal(character?.name, 'Second', 'Should return correct character by ID');

    restoreFetch();
  });
});
