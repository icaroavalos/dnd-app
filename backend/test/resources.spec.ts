import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '../src/domain/contracts/index.js';

function createBaseCharacter(): CharacterRecord {
  return {
    id: 'char-resource-001',
    ruleset: RULESET_ID,
    name: 'Kael',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral Good',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 15,
      dex: 14,
      con: 14,
      int: 10,
      wis: 12,
      cha: 8
    },
    skillProficiencies: ['Athletics', 'Perception'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'acolyte',
      abilityMode: 'plus2_plus1',
      abilityAssignments: {
        str: 0,
        dex: 0,
        con: 0,
        int: 1,
        wis: 2,
        cha: 0
      },
      equipmentSelection: ['holy-symbol']
    },
    resources: {
      second_wind: {
        current: 1,
        max: 1,
        recovery: 'short_rest'
      },
      divine_favor: {
        current: 0,
        max: 1,
        recovery: 'long_rest'
      }
    },
    state: {
      hp: 9,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 1,
      spellSlotsUsed: {
        '1': 1
      },
      activeConditions: []
    }
  };
}

test('POST /resources/use spends one limited-use resource', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character: createBaseCharacter(),
        resourceId: 'second_wind'
      }
    });

    assert.equal(response.statusCode, 200);

    const updatedCharacter = response.json();
    assert.equal(updatedCharacter.resources.second_wind.current, 0);
    assert.equal(updatedCharacter.resources.divine_favor.current, 0);
  } finally {
    await app.close();
  }
});

test('POST /resources/use rejects spending an unavailable resource', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character = createBaseCharacter();
    character.resources.second_wind.current = 0;

    const response = await app.inject({
      method: 'POST',
      url: '/resources/use',
      payload: {
        character,
        resourceId: 'second_wind'
      }
    });

    assert.equal(response.statusCode, 409);
    const payload = response.json();
    assert.equal(payload.statusCode, 409);
    assert.equal(payload.error.code, 'RESOURCE_UNAVAILABLE');
    assert.match(payload.error.message, /does not have enough uses remaining/i);
    assert.equal(payload.path, '/resources/use');
    assert.match(payload.requestId, /^req-/);
  } finally {
    await app.close();
  }
});

test('POST /resources/recover applies short rest recovery only to short-rest resources', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character = createBaseCharacter();
    character.resources.second_wind.current = 0;

    const response = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character,
        recovery: 'short_rest'
      }
    });

    assert.equal(response.statusCode, 200);

    const updatedCharacter = response.json();
    assert.equal(updatedCharacter.resources.second_wind.current, 1);
    assert.equal(updatedCharacter.resources.divine_favor.current, 0);
    assert.equal(updatedCharacter.state.hitDiceUsed, 1);
    assert.equal(updatedCharacter.state.spellSlotsUsed['1'], 1);
  } finally {
    await app.close();
  }
});

test('POST /resources/recover applies long rest recovery to limited uses and spell slots', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character = createBaseCharacter();
    character.resources.second_wind.current = 0;

    const response = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character,
        recovery: 'long_rest'
      }
    });

    assert.equal(response.statusCode, 200);

    const updatedCharacter = response.json();
    assert.equal(updatedCharacter.resources.second_wind.current, 1);
    assert.equal(updatedCharacter.resources.divine_favor.current, 1);
    assert.deepEqual(updatedCharacter.state.spellSlotsUsed, {});
    assert.equal(updatedCharacter.state.hitDiceUsed, 0);
  } finally {
    await app.close();
  }
});

test('POST /resources/recover with short_rest does not recover long_rest resources', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      resources: {
        short_rest_resource: {
          current: 0,
          max: 3,
          recovery: 'short_rest'
        },
        long_rest_resource: {
          current: 0,
          max: 2,
          recovery: 'long_rest'
        },
        none_resource: {
          current: 0,
          max: 1,
          recovery: 'none'
        }
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character,
        recovery: 'short_rest'
      }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    assert.equal(updated.resources.short_rest_resource.current, 3);
    assert.equal(updated.resources.long_rest_resource.current, 0);
    assert.equal(updated.resources.none_resource.current, 0);
  } finally {
    await app.close();
  }
});

test('POST /resources/recover with long_rest recovers all recoverable resources', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character: CharacterRecord = {
      ...createBaseCharacter(),
      resources: {
        short_rest_resource: {
          current: 0,
          max: 3,
          recovery: 'short_rest'
        },
        long_rest_resource: {
          current: 0,
          max: 2,
          recovery: 'long_rest'
        },
        none_resource: {
          current: 0,
          max: 1,
          recovery: 'none'
        }
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character,
        recovery: 'long_rest'
      }
    });

    assert.equal(response.statusCode, 200);

    const updated = response.json();
    assert.equal(updated.resources.short_rest_resource.current, 3);
    assert.equal(updated.resources.long_rest_resource.current, 2);
    assert.equal(updated.resources.none_resource.current, 0);
  } finally {
    await app.close();
  }
});

test('POST /resources/recover resets hit dice only on long_rest', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const shortRestChar = createBaseCharacter();
    shortRestChar.state.hitDiceUsed = 3;

    const shortRestResponse = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character: shortRestChar,
        recovery: 'short_rest'
      }
    });

    assert.equal(shortRestResponse.statusCode, 200);
    assert.equal(shortRestResponse.json().state.hitDiceUsed, 3);

    const longRestChar = createBaseCharacter();
    longRestChar.state.hitDiceUsed = 3;

    const longRestResponse = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character: longRestChar,
        recovery: 'long_rest'
      }
    });

    assert.equal(longRestResponse.statusCode, 200);
    assert.equal(longRestResponse.json().state.hitDiceUsed, 0);
  } finally {
    await app.close();
  }
});

test('POST /resources/recover resets spell slots only on long_rest', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const shortRestChar: CharacterRecord = {
      ...createBaseCharacter(),
      resources: {
        spell_resource: {
          current: 0,
          max: 2,
          recovery: 'short_rest'
        }
      },
      state: {
        hp: 10,
        maxHpOverride: null,
        tempHp: 0,
        hitDiceUsed: 0,
        spellSlotsUsed: { '1': 2, '2': 1 },
        activeConditions: []
      }
    };

    const shortRestResponse = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character: shortRestChar,
        recovery: 'short_rest'
      }
    });

    assert.equal(shortRestResponse.statusCode, 200);
    assert.deepEqual(shortRestResponse.json().state.spellSlotsUsed, { '1': 2, '2': 1 });

    const longRestChar: CharacterRecord = {
      ...createBaseCharacter(),
      resources: {
        spell_resource: {
          current: 0,
          max: 2,
          recovery: 'long_rest'
        }
      },
      state: {
        hp: 10,
        maxHpOverride: null,
        tempHp: 0,
        hitDiceUsed: 0,
        spellSlotsUsed: { '1': 2, '2': 1 },
        activeConditions: []
      }
    };

    const longRestResponse = await app.inject({
      method: 'POST',
      url: '/resources/recover',
      payload: {
        character: longRestChar,
        recovery: 'long_rest'
      }
    });

    assert.equal(longRestResponse.statusCode, 200);
    assert.deepEqual(longRestResponse.json().state.spellSlotsUsed, {});
  } finally {
    await app.close();
  }
});
