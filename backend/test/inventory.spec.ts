import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

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

test('POST /inventory/spend-ammo spends from single-arrow stacks first before multi-arrow stacks', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
        { instanceId: 'item-inst-arrow', baseItemId: 'arrow', status: 'backpack', quantity: 1 },
        { instanceId: 'item-inst-arrows', baseItemId: 'arrows-20', status: 'backpack', quantity: 5 }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: { character, weaponItemId: 'item-inst-longbow', amount: 2 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const arrowStack = updated.inventory.find((item: any) => item.baseItemId === 'arrow');
    const arrows20Stack = updated.inventory.find((item: any) => item.baseItemId === 'arrows-20');

    assert.equal(arrowStack, undefined);
    assert.equal(arrows20Stack?.quantity, 4);
  } finally {
    await app.close();
  }
});

test('POST /inventory/spend-ammo handles spending exact quantity from single stack', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
        { instanceId: 'item-inst-arrows', baseItemId: 'arrows-20', status: 'backpack', quantity: 10 }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: { character, weaponItemId: 'item-inst-longbow', amount: 5 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const arrowsStack = updated.inventory.find((item: any) => item.baseItemId === 'arrows-20');

    assert.equal(arrowsStack?.quantity, 5);
  } finally {
    await app.close();
  }
});

test('POST /inventory/recover-ammo adds to existing matching ammo stack', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
        { instanceId: 'item-inst-arrows', baseItemId: 'arrows-20', status: 'backpack', quantity: 3 }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: { character, weaponItemId: 'item-inst-longbow', amount: 10 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const arrowsStack = updated.inventory.find((item: any) => item.baseItemId === 'arrows-20');

    assert.equal(arrowsStack?.quantity, 13);
  } finally {
    await app.close();
  }
});

test('POST /inventory/spend-ammo rejects spending zero ammunition', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
        { instanceId: 'item-inst-arrows', baseItemId: 'arrows-20', status: 'backpack', quantity: 5 }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: { character, weaponItemId: 'item-inst-longbow', amount: 0 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const arrowsStack = updated.inventory.find((item: any) => item.baseItemId === 'arrows-20');

    assert.equal(arrowsStack?.quantity, 4);
  } finally {
    await app.close();
  }
});

test('POST /inventory/spend-ammo removes empty ammo stacks completely from inventory', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' },
        { instanceId: 'item-inst-arrow', baseItemId: 'arrow', status: 'backpack', quantity: 1 }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: { character, weaponItemId: 'item-inst-longbow', amount: 1 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const arrowItems = updated.inventory.filter((item: any) => item.baseItemId === 'arrow');

    assert.equal(arrowItems.length, 0);
  } finally {
    await app.close();
  }
});

test('POST /inventory/recover-ammo recovers ammunition to correct ammo group (bolts for crossbow)', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-hand-crossbow', baseItemId: 'hand-crossbow', status: 'equipped_main_hand' }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: { character, weaponItemId: 'item-inst-hand-crossbow', amount: 10 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const boltsStack = updated.inventory.find((item: any) => item.baseItemId === 'bolts-20');

    assert.equal(boltsStack?.status, 'backpack');
    assert.equal(boltsStack?.quantity, 10);
  } finally {
    await app.close();
  }
});

test('POST /inventory/spend-ammo handles crossbow bolt ammunition correctly', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-hand-crossbow', baseItemId: 'hand-crossbow', status: 'equipped_main_hand' },
        { instanceId: 'item-inst-bolts', baseItemId: 'bolts-20', status: 'backpack', quantity: 5 }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/spend-ammo',
      payload: { character, weaponItemId: 'item-inst-hand-crossbow', amount: 2 }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const boltsStack = updated.inventory.find((item: any) => item.baseItemId === 'bolts-20');

    assert.equal(boltsStack?.quantity, 3);
  } finally {
    await app.close();
  }
});

test('POST /inventory/recover-ammo creates ammo stack with default quantity of 1 when amount is undefined', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      inventory: [
        { instanceId: 'item-inst-longbow', baseItemId: 'longbow', status: 'equipped_main_hand' }
      ]
    };

    const response = await app.inject({
      method: 'POST',
      url: '/inventory/recover-ammo',
      payload: { character, weaponItemId: 'item-inst-longbow' }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    const arrowsStack = updated.inventory.find((item: any) => item.baseItemId === 'arrows-20');

    assert.equal(arrowsStack?.quantity, 1);
  } finally {
    await app.close();
  }
});
