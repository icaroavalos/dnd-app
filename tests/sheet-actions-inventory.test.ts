import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import React from '../frontend/node_modules/react/index.js';
import { act } from '../frontend/node_modules/react/index.js';
import { createRoot, type Root } from '../frontend/node_modules/react-dom/client.js';

import { apiClient } from '../frontend/src/api/api-client.ts';
import { AttacksTab } from '../frontend/src/components/sheet/AttacksTab.tsx';
import { InventoryTab } from '../frontend/src/components/sheet/InventoryTab.tsx';
import { useCharacterStore } from '../frontend/src/store/useCharacterStore.ts';

type TestRender = {
  container: HTMLDivElement;
  root: Root;
};

const defaultCharacter = {
  id: 'char-ui-test',
  name: 'Mira',
  class: 'Fighter',
  level: 2,
  race: 'Orc',
  subrace: '',
  background: 'Soldier',
  alignment: 'Neutral',
  experience: 0,
  abilityMethod: 'standard',
  classFeatureChoices: {},
  asiChoices: {},
  equipmentChoices: {},
  inventory: [],
  equippedItems: [],
  hitDiceUsed: 0,
  spellSlots: {},
  resources: {
    second_wind: { current: 1, max: 2, recovery: 'short_rest' },
  },
  tempHp: 0,
  creationComplete: true,
  hp: 20,
  maxHp: 20,
  armorClass: 16,
  speed: 30,
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  savingThrows: [],
  classSkillChoices: [],
  skillProficiencies: [],
  attacks: [],
  spells: [],
  features: [],
  pendingChoices: [],
  notes: '',
  bgChoices: {
    abilityIncrement: null,
    abilityScores: [],
    spellcastingAbility: null,
    equipmentChoice: null,
    skillChoices: [],
    skillCollisions: [],
  },
  backgroundChoices: { backgroundId: 'soldier', abilityAssignments: {} },
};

let rendered: TestRender | null = null;
let originalAdapter: typeof apiClient.defaults.adapter;

function text(): string {
  return rendered?.container.textContent ?? '';
}

function clickByText(label: string): void {
  const button = Array.from(rendered!.container.querySelectorAll('button')).find((node) =>
    node.textContent?.includes(label)
  );
  assert.ok(button, `Expected button containing "${label}"`);
  act(() => {
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
}

function inputByPlaceholder(placeholder: string): HTMLInputElement {
  const input = Array.from(rendered!.container.querySelectorAll('input')).find(
    (node) => node.placeholder === placeholder
  ) as HTMLInputElement | undefined;
  assert.ok(input, `Expected input with placeholder "${placeholder}"`);
  return input;
}

function changeInput(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

async function render(ui: React.ReactElement): Promise<void> {
  if (rendered) {
    await act(async () => {
      rendered?.root.unmount();
    });
    rendered.container.remove();
    rendered = null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  rendered = { container, root };
}

function setCharacter(overrides: Record<string, unknown> = {}): void {
  useCharacterStore.setState({
    character: {
      ...defaultCharacter,
      ...overrides,
    } as any,
    activeCharacterId: 'char-ui-test',
    pendingLevelUp: null,
    itemsCatalog: [],
  });
}

function mockApi(handler: (url: string, data: any) => any): void {
  apiClient.defaults.adapter = async (config) => {
    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const payload = await handler(String(config.url), data);
    return {
      data: payload,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
}

describe('sheet Actions tab', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost/',
    });
    global.window = dom.window as any;
    global.document = dom.window.document as any;
    global.HTMLElement = dom.window.HTMLElement as any;
    global.MouseEvent = dom.window.MouseEvent as any;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalAdapter = apiClient.defaults.adapter;
    setCharacter();
  });

  afterEach(() => {
    if (rendered) {
      act(() => {
        rendered?.root.unmount();
      });
    }
    rendered?.container.remove();
    rendered = null;
    apiClient.defaults.adapter = originalAdapter;
  });

  it('renderiza ações derivadas do backend, filtros e recurso limitado', async () => {
    mockApi((url, data) => {
      assert.equal(url, '/actions/derive');
      assert.deepEqual(data.classes, [{ classId: 'fighter', level: 2 }]);
      assert.deepEqual(data.resources, defaultCharacter.resources);
      return [
        {
          id: 'longsword-main',
          kind: 'attack',
          icon: 'sword',
          name: 'Longsword',
          subtitle: 'Weapon Attack',
          range: '5 ft',
          rangeLabel: 'Reach',
          hit: '+5',
          damage: ['1d8+3 slashing'],
          notes: 'Weapon Mastery: Sap',
          detail: 'Ataque com arma equipada.',
          source: { ammoRequired: false },
        },
        {
          id: 'second-wind',
          kind: 'limited',
          icon: 'heart',
          name: 'Second Wind',
          subtitle: 'Bonus Action',
          range: 'Self',
          rangeLabel: 'Self',
          hit: '',
          damage: [],
          notes: 'Recupera pontos de vida.',
          detail: 'Use uma carga de Second Wind.',
          cost: { resource: 'second_wind' },
          resource: 'second_wind',
        },
        {
          id: 'opportunity-attack',
          kind: 'reaction',
          icon: 'zap',
          name: 'Opportunity Attack',
          subtitle: 'Reaction',
          range: '5 ft',
          rangeLabel: 'Reach',
          hit: '+5',
          damage: ['1d8+3 slashing'],
          notes: '',
          detail: 'Quando uma criatura sai do seu alcance.',
        },
      ];
    });

    await render(React.createElement(AttacksTab));
    await act(async () => {});

    assert.match(text(), /Longsword/);
    assert.match(text(), /Second Wind/);
    assert.match(text(), /1\/2/);
    assert.match(text(), /Short Rest/);
    assert.match(text(), /Opportunity Attack/);

    clickByText('Uso Limitado');
    assert.doesNotMatch(text(), /Longsword/);
    assert.match(text(), /Second Wind/);

    clickByText('Ataques');
    assert.match(text(), /Longsword/);
    assert.doesNotMatch(text(), /Second Wind/);
  });

  it('mostra ação desabilitada com motivo e estado de backend indisponível', async () => {
    mockApi(() => [
      {
        id: 'hand-crossbow',
        kind: 'attack',
        icon: 'crosshair',
        name: 'Hand Crossbow',
        subtitle: 'Weapon Attack',
        range: '30/120',
        rangeLabel: 'Range',
        hit: '+5',
        damage: ['1d6+3 piercing'],
        notes: 'Sem munição disponível.',
        detail: 'Você precisa de bolts para usar este ataque.',
        disabled: true,
        source: { ammoRequired: true, ammoAvailable: 0 },
      },
    ]);

    await render(React.createElement(AttacksTab));
    await act(async () => {});

    assert.match(text(), /Hand Crossbow/);
    assert.match(text(), /Desabilitada/);
    clickByText('Hand Crossbow');
    assert.match(text(), /Você precisa de bolts/);

    mockApi(() => {
      throw new Error('offline');
    });
    await render(React.createElement(AttacksTab));
    await act(async () => {});
    assert.match(text(), /Backend indisponível|Falha ao carregar ações/);
  });
});

describe('sheet Inventory tab', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost/',
    });
    global.window = dom.window as any;
    global.document = dom.window.document as any;
    global.HTMLElement = dom.window.HTMLElement as any;
    global.MouseEvent = dom.window.MouseEvent as any;
    global.Event = dom.window.Event as any;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalAdapter = apiClient.defaults.adapter;
    mockApi((url) => {
      if (url === '/rules/items') {
        return {
          results: [
            { id: 'longsword', name: 'Longsword', source: 'PHB', weight: 3, value: 15, type: 'weapon', property: ['Versatile'] },
            { id: 'shield', name: 'Shield', source: 'PHB', weight: 6, value: 10, type: 'shield' },
            { id: 'ring-protection', name: 'Ring of Protection', source: 'DMG', weight: 0, value: 4000, type: 'wondrous item' },
          ],
          total: 3,
          source: 'test',
        };
      }
      return {};
    });
    setCharacter({
      inventory: [
        { instanceId: 'i1', baseItemId: 'longsword', status: 'equipped_main_hand', quantity: 1 },
        { instanceId: 'i2', baseItemId: 'shield', status: 'backpack', quantity: 1 },
        { instanceId: 'i3', baseItemId: 'ring-protection', status: 'attuned', quantity: 1 },
      ],
    });
  });

  afterEach(() => {
    if (rendered) {
      act(() => {
        rendered?.root.unmount();
      });
    }
    rendered?.container.remove();
    rendered = null;
    apiClient.defaults.adapter = originalAdapter;
  });

  it('filtra e busca itens, mostra resumo e expande detalhes', async () => {
    await render(React.createElement(InventoryTab));
    await act(async () => {});

    assert.match(text(), /Carga:/);
    assert.match(text(), /1\/3/);
    assert.match(text(), /Longsword/);
    assert.match(text(), /Mão principal/);
    assert.match(text(), /Ring of Protection/);

    const search = inputByPlaceholder('Buscar item');
    await act(async () => {
      changeInput(search, 'shield');
    });
    assert.match(text(), /Shield/);
    assert.doesNotMatch(text(), /Longsword/);

    clickByText('Tudo');
    await act(async () => {
      changeInput(search, '');
    });
    clickByText('Sintonização');
    assert.match(text(), /Ring of Protection/);
    assert.doesNotMatch(text(), /Shield/);

    clickByText('Ring of Protection');
    assert.match(text(), /Fonte/);
    assert.match(text(), /Status atual/);
  });

  it('equipar item altera status e attunement respeita limite 3', async () => {
    await render(React.createElement(InventoryTab));
    await act(async () => {});

    clickByText('Shield');
    clickByText('Escudo');

    let inventory = useCharacterStore.getState().character.inventory as any[];
    assert.equal(inventory.find((item) => item.instanceId === 'i2')?.status, 'equipped_shield');

    useCharacterStore.setState((state) => ({
      character: {
        ...state.character,
        inventory: [
          { instanceId: 'a1', baseItemId: 'amulet', status: 'attuned', quantity: 1, customName: 'Amulet' },
          { instanceId: 'a2', baseItemId: 'cloak', status: 'attuned', quantity: 1, customName: 'Cloak' },
          { instanceId: 'a3', baseItemId: 'ring-one', status: 'attuned', quantity: 1, customName: 'Ring One' },
          { instanceId: 'a4', baseItemId: 'ring-two', status: 'backpack', quantity: 1, customName: 'Ring Two' },
        ],
      } as any,
    }));

    await render(React.createElement(InventoryTab));
    await act(async () => {});
    clickByText('Ring Two');
    clickByText('Sintonizar');

    inventory = useCharacterStore.getState().character.inventory as any[];
    assert.equal(inventory.find((item) => item.instanceId === 'a4')?.status, 'backpack');
    assert.match(text(), /Limite de sintonização atingido/);
  });
});
