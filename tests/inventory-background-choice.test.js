import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryHelpers } from '../src/app/inventory-helpers.js';
import {
  itemDetail,
  itemKey,
  itemTypeLabel,
  normalizeInventoryItem,
  parseItemRef,
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
