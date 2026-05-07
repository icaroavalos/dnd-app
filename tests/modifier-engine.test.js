import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../dist/src/core/engine/modifier-engine.js');

describe('modifier engine', () => {
  it('derives active item and condition modifiers and totals them', () => {
    const modifiers = module.deriveActiveModifiers({
      inventory: [
        {
          id: 'ring-1',
          name: 'Ring of Protection',
          status: 'attuned',
        },
        {
          id: 'shield-1',
          name: 'Shield',
          type: 'S',
          ac: 2,
          status: 'equipped_off_hand',
        },
        {
          id: 'pack-1',
          name: 'Backpack',
          modifiers: [{ target: 'armor_class', value: 5 }],
          status: 'backpack',
        },
      ],
      state: {
        active_conditions: [
          {
            condition_id: 'cond-bless',
            name: 'Bless',
            modifiers: [{ target: 'saving_throws', value: 1 }],
          },
        ],
      },
    });

    assert.equal(modifiers.some((modifier) => modifier.id === 'ring-1:ring-protection-ac'), true);
    assert.equal(modifiers.some((modifier) => modifier.id === 'ring-1:ring-protection-saves'), true);
    assert.equal(modifiers.some((modifier) => modifier.id === 'shield-1:shield-ac'), true);
    assert.equal(modifiers.some((modifier) => modifier.sourceType === 'condition'), true);
    assert.equal(modifiers.some((modifier) => modifier.sourceId === 'pack-1'), false);
    assert.equal(module.modifierTotal(modifiers, 'armor_class'), 3);
    assert.equal(module.modifierTotal(modifiers, 'saving_throws'), 2);
  });

  it('normalizes object-style modifiers and carried weight', () => {
    const inventoryModifiers = module.deriveInventoryModifiers({
      inventory: [
        {
          id: 'cloak-1',
          name: 'Cloak',
          status: 'equipped_shoulders',
          modifiers: [{ AC: 1, saves: 2 }],
        },
        {
          id: 'rope-1',
          name: 'Rope',
          quantity: 2,
          weight: 10,
          status: 'backpack',
        },
      ],
      equippedItems: ['cloak-1'],
    });

    assert.deepEqual(
      inventoryModifiers.map((modifier) => [modifier.target, modifier.value]).sort(),
      [['armor_class', 1], ['saving_throws', 2]]
    );
    assert.equal(module.deriveCarriedWeight({ inventory: [{ weight: 10, quantity: 2 }, { weight: 1 }] }), 21);
  });
});
