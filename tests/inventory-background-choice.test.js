import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryHelpers } from '../src/app/inventory-helpers.js';
import {
  itemDetail,
  itemKey,
  itemTypeLabel,
  normalizeInventoryItem,
  parseItemRef,
  consolidateInventory,
} from '../dist/src/core/character/inventory-engine.js';

function createHelpers(state) {
  return createInventoryHelpers({
    getState: () => state,
    titleCase: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1),
    entriesToText: () => 'Choose starting equipment.',
    damageTypeLabel: (value) => value,
    propertyLabel: (value) => value,
    itemDetail,
    itemKey,
    itemTypeLabel,
    normalizeInventoryItem,
    parseItemRef,
    consolidateInventory,
  });
}

describe('background equipment inventory sync', () => {
  it('derives background inventory from guided background equipment choice', () => {
    const state = {
      character: {
        class: 'fighter',
        background: 'Acolyte',
        bgChoices: {
          background: 'Acolyte',
          equipmentChoice: 'A',
        },
        equipmentChoices: {},
        inventory: [],
        equippedItems: [],
      },
      api: {
        classes: {},
        source: {
          backgroundDetails: {
            acolyte: {
              name: 'Acolyte',
              source: 'XPHB',
              startingEquipment: [
                {
                  A: [
                    { item: 'book|xphb' },
                    { item: 'parchment|xphb', quantity: 10 },
                    { value: 800 },
                  ],
                  B: [{ value: 5000 }],
                },
              ],
              entries: [],
            },
          },
          itemDetails: {
            'book|xphb': { name: 'Book', source: 'XPHB', type: 'G', value: 2500, weight: 5 },
            'parchment|xphb': { name: 'Parchment', source: 'XPHB', type: 'G', value: 10, weight: 0 },
          },
        },
      },
    };

    const helpers = createHelpers(state);

    helpers.rebuildInventoryFromChoices();

    assert.deepEqual(
      state.character.inventory.map((item) => [item.name, item.quantity, item.kind ?? 'item', item.gp ?? null]),
      [
        ['Book', 1, 'item', null],
        ['Parchment', 10, 'item', null],
        ['Gold', 1, 'currency', 8],
      ],
    );
  });
});

describe('inventory merging and consolidation', () => {
  it('preserves manual items across inventory rebuild', () => {
    const state = {
      character: {
        class: 'fighter',
        background: 'Acolyte',
        bgChoices: {
          equipmentChoice: 'A',
        },
        equipmentChoices: {},
        // Manual item already present
        inventory: [
          {
            id: 'manual-1',
            name: 'Potion of Healing',
            source: 'XPHB',
            quantity: 2,
            kind: 'item',
            type: 'P',
            weight: 0.5,
            valueGp: 5,
            origin: 'manual',
          },
        ],
        equippedItems: [],
      },
      api: {
        classes: {},
        source: {
          backgroundDetails: {
            acolyte: {
              name: 'Acolyte',
              source: 'XPHB',
              startingEquipment: [
                {
                  A: [
                    { item: 'book|xphb' },
                    { item: 'parchment|xphb', quantity: 10 },
                    { value: 800 },
                  ],
                  B: [{ value: 5000 }],
                },
              ],
              entries: [],
            },
          },
          itemDetails: {
            'book|xphb': { name: 'Book', source: 'XPHB', type: 'G', value: 2500, weight: 5 },
            'parchment|xphb': { name: 'Parchment', source: 'XPHB', type: 'G', value: 10, weight: 0 },
          },
        },
      },
    };

    const helpers = createHelpers(state);
    helpers.rebuildInventoryFromChoices();

    const names = state.character.inventory.map((i) => i.name);
    assert.ok(names.includes('Book'));
    assert.ok(names.includes('Parchment'));
    assert.ok(names.includes('Potion of Healing'));

    const potion = state.character.inventory.find((i) => i.name === 'Potion of Healing');
    assert.equal(potion.quantity, 2);
    assert.equal(potion.origin, 'manual');
  });

  it('consolidates duplicate item stacks', () => {
    const inventory = [
      {
        id: '1',
        name: 'Arrow',
        source: 'XPHB',
        quantity: 5,
        kind: 'item',
        type: 'A',
        weight: 0.1,
        valueGp: 0.01,
        property: [],
      },
      {
        id: '2',
        name: 'Arrow',
        source: 'XPHB',
        quantity: 3,
        kind: 'item',
        type: 'A',
        weight: 0.1,
        valueGp: 0.01,
        property: [],
      },
    ];
    const result = consolidateInventory(inventory);
    assert.equal(result.length, 1);
    assert.equal(result[0].quantity, 8);
    // First item's id persists
    assert.equal(result[0].id, '1');
  });

  it('removes empty stacks after consolidation', () => {
    const inventory = [
      {
        id: '1',
        name: 'Arrow',
        source: 'XPHB',
        quantity: 2,
        kind: 'item',
        type: 'A',
        weight: 0.1,
        valueGp: 0.01,
        property: [],
      },
      {
        id: '2',
        name: 'Arrow',
        source: 'XPHB',
        quantity: 0,
        kind: 'item',
        type: 'A',
        weight: 0.1,
        valueGp: 0.01,
        property: [],
      },
    ];
    const result = consolidateInventory(inventory);
    assert.equal(result.length, 1);
    assert.equal(result[0].quantity, 2);
  });

  it('remaps equippedItems after inventory consolidation, preserving valid and dropping invalid', () => {
    const state = {
      character: {
        class: 'fighter',
        background: 'Acolyte',
        bgChoices: {
          equipmentChoice: 'A',
        },
        equipmentChoices: {},
        inventory: [
          {
            id: 'manual-book',
            name: 'Book',
            source: 'XPHB',
            quantity: 1,
            kind: 'item',
            type: 'G',
            weight: 5,
            valueGp: 2.5,
            origin: 'manual',
          },
        ],
        equippedItems: ['manual-book', 'ghost-id'],
      },
      api: {
        classes: {},
        source: {
          backgroundDetails: {
            acolyte: {
              name: 'Acolyte',
              source: 'XPHB',
              startingEquipment: [
                {
                  A: [{ item: 'book|xphb' }],
                  B: [{ value: 5000 }],
                },
              ],
              entries: [],
            },
          },
          itemDetails: {
            'book|xphb': { name: 'Book', source: 'XPHB', type: 'G', value: 2500, weight: 5 },
          },
        },
      },
    };

    const helpers = createHelpers(state);
    helpers.rebuildInventoryFromChoices();

    // After rebuild, background Book (choice) and manual Book merge.
    // The new ID should be from choice (since it appears first in merge list).
    const bookInInventory = state.character.inventory.find(i => i.name === 'Book');
    assert.ok(bookInInventory, 'Book should be in inventory');
    const newId = bookInInventory.id;

    // EquippedItems should now contain the new ID and not the old manual-book id.
    assert.ok(state.character.equippedItems.includes(newId), 'Equipped should reference new ID');
    assert.equal(state.character.equippedItems.find(id => id === 'manual-book'), undefined, 'Old manual-book ID should be gone');
    // Invalid 'ghost-id' should be filtered out
    assert.equal(state.character.equippedItems.find(id => id === 'ghost-id'), undefined, 'Ghost ID should be gone');
  });
});
