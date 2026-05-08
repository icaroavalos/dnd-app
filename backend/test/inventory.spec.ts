import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '../src/domain/contracts/index.js';

function createBaseCharacter(): CharacterRecord {
  return {
    id: 'char-inventory-001',
    ruleset: RULESET_ID,
    name: 'Iria',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral Good',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 10,
      dex: 16,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Perception'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-longbow',
        baseItemId: 'longbow',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-arrow',
        baseItemId: 'arrow',
        status: 'backpack',
        quantity: 2
      },
      {
        instanceId: 'item-inst-arrows',
        baseItemId: 'arrows-20',
        status: 'backpack',
        quantity: 5
      }
    ],
    spellChoices: [],
    resources: {},
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: []
    }
  };
}

test('POST /inventory/spend-ammo spends ammunition for an equipped weapon across matching inventory entries', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: {
        character: createBaseCharacter(),
        weaponItemId: 'item-inst-longbow',
        amount: 3
      }
    });

    assert.equal(response.statusCode, 200);

    const updatedCharacter = response.json();
    const remainingAmmo = updatedCharacter.inventory
      .filter((item: any) => ['arrow', 'arrows-20'].includes(item.baseItemId))
      .reduce((sum: number, item: any) => sum + Number(item.quantity ?? 1), 0);

    assert.equal(remainingAmmo, 4);
  } finally {
    await app.close();
  }
});

test('POST /inventory/recover-ammo creates a backpack ammo stack when the inventory has no matching ammo entry yet', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character = createBaseCharacter();
    character.inventory = character.inventory.filter((item) => item.baseItemId === 'longbow');

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: {
        character,
        weaponItemId: 'item-inst-longbow',
        amount: 6
      }
    });

    assert.equal(response.statusCode, 200);

    const updatedCharacter = response.json();
    const recoveredAmmo = updatedCharacter.inventory.find((item: any) => item.baseItemId === 'arrows-20');

    assert.equal(recoveredAmmo?.status, 'backpack');
    assert.equal(recoveredAmmo?.quantity, 6);
  } finally {
    await app.close();
  }
});

test('POST /inventory/spend-ammo rejects ammo spending when the character does not have enough matching ammunition', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: {
        character: createBaseCharacter(),
        weaponItemId: 'item-inst-longbow',
        amount: 8
      }
    });

    assert.equal(response.statusCode, 409);
    const payload = response.json();
    assert.equal(payload.statusCode, 409);
    assert.equal(payload.error.code, 'AMMO_UNAVAILABLE');
    assert.match(payload.error.message, /Not enough ammunition/i);
    assert.equal(payload.path, '/inventory/spend-ammo');
    assert.match(payload.requestId, /^req-/);
  } finally {
    await app.close();
  }
});
