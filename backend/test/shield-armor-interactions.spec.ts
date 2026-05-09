import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

test('POST /actions/derive blocks Two-Handed greatsword when shield is equipped', async () => {
const app = await createApp();

const character: CharacterRecord = {
  id: 'char-action-greatsword-shield',
  ruleset: RULESET_ID,
  name: 'Shield Bearer',
  lineageId: 'human',
  backgroundId: 'soldier',
  alignment: 'Lawful Good',
  experience: 0,
  classes: [{ classId: 'fighter', level: 1 }],
  abilities: {
    str: 18,
    dex: 10,
    con: 14,
    int: 10,
    wis: 10,
    cha: 10
  },
  skillProficiencies: ['Athletics'],
  savingThrowProficiencies: ['str', 'con'],
  inventory: [
    {
      instanceId: 'item-inst-greatsword',
      baseItemId: 'greatsword',
      status: 'equipped_main_hand'
    },
    {
      instanceId: 'item-inst-shield',
      baseItemId: 'shield',
      status: 'equipped_shield'
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

try {
await app.init();
await app.getHttpAdapter().getInstance().ready();

const response = await app.inject({
  method: 'POST',
  url: '/actions/derive',
  payload: character
});

assert.equal(response.statusCode, 200);

const actions = response.json();
const greatsword = actions.find((action: any) => action.id === 'attack:item-inst-greatsword');

assert.ok(greatsword, 'Greatsword attack should exist');
assert.equal(greatsword.disabled, true);
assert.match(greatsword.detail ?? '', /two hands/i);
assert.match(greatsword.notes ?? '', /Heavy/i);
assert.match(greatsword.notes ?? '', /Two-Handed/i);
} finally {
await app.close();
}
});

test('POST /actions/derive blocks Two-Handed light crossbow when shield is equipped', async () => {
const app = await createApp();

const character: CharacterRecord = {
  id: 'char-action-lcrossbow-shield',
  ruleset: RULESET_ID,
  name: 'Crossbow Guard',
  lineageId: 'human',
  backgroundId: 'soldier',
  alignment: 'Neutral',
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
  savingThrowProficiencies: ['str', 'dex'],
  inventory: [
    {
      instanceId: 'item-inst-light-crossbow',
      baseItemId: 'light-crossbow',
      status: 'equipped_main_hand'
    },
    {
      instanceId: 'item-inst-shield',
      baseItemId: 'shield',
      status: 'equipped_shield'
    },
    {
      instanceId: 'item-inst-bolts',
      baseItemId: 'bolts-20',
      status: 'backpack',
      quantity: 20
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

try {
await app.init();
await app.getHttpAdapter().getInstance().ready();

const response = await app.inject({
  method: 'POST',
  url: '/actions/derive',
  payload: character
});

assert.equal(response.statusCode, 200);

const actions = response.json();
const lightCrossbow = actions.find((action: any) => action.id === 'attack:item-inst-light-crossbow');

assert.ok(lightCrossbow, 'Light crossbow attack should exist');
assert.equal(lightCrossbow.disabled, true);
assert.match(lightCrossbow.detail ?? '', /two hands/i);
} finally {
await app.close();
}
});

test('POST /actions/derive allows versatile longsword with shield but uses normal damage die', async () => {
const app = await createApp();

const character: CharacterRecord = {
  id: 'char-action-longsword-shield',
  ruleset: RULESET_ID,
  name: 'Sword Guardian',
  lineageId: 'human',
  backgroundId: 'soldier',
  alignment: 'Lawful Good',
  experience: 0,
  classes: [{ classId: 'fighter', level: 1 }],
  abilities: {
    str: 16,
    dex: 10,
    con: 14,
    int: 10,
    wis: 10,
    cha: 10
  },
  skillProficiencies: ['Athletics'],
  savingThrowProficiencies: ['str', 'con'],
  inventory: [
    {
      instanceId: 'item-inst-longsword',
      baseItemId: 'longsword',
      status: 'equipped_main_hand'
    },
    {
      instanceId: 'item-inst-shield',
      baseItemId: 'shield',
      status: 'equipped_shield'
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

try {
await app.init();
await app.getHttpAdapter().getInstance().ready();

const response = await app.inject({
  method: 'POST',
  url: '/actions/derive',
  payload: character
});

assert.equal(response.statusCode, 200);

const actions = response.json();
const longsword = actions.find((action: any) => action.id === 'attack:item-inst-longsword');

assert.ok(longsword, 'Longsword attack should exist');
assert.equal(longsword.disabled, false);
// With shield, versatile weapon uses normal damage (1d8) not versatile (1d10)
assert.deepEqual(longsword.damage, ['1d8+3']);
assert.match(longsword.notes ?? '', /Versatile/i);
} finally {
await app.close();
}
});
