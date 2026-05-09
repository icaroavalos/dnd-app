import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

function createBaseCharacter(): CharacterRecord {
  return {
    id: 'char-action-001',
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
    spellChoices: [
      {
        sourceId: 'magic-initiate-cleric',
        spellcastingAbility: 'wis',
        selectedCantrips: ['Guidance', 'Sacred Flame'],
        selectedLevel1Spells: ['Cure Wounds']
      }
    ],
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
      equipmentSelection: ['holy-symbol'],
      featChoiceId: 'magic-initiate-cleric'
    },
    resources: {
      second_wind: {
        current: 1,
        max: 1,
        recovery: 'short_rest'
      },
      'bgSpell:cure-wounds': {
        current: 1,
        max: 1,
        recovery: 'long_rest'
      }
    },
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

test('POST /actions/derive returns basic, spell, and limited-use actions', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createBaseCharacter()
    });

    assert.equal(response.statusCode, 200);

    const actions = response.json();
    const attack = actions.find((action: any) => action.id === 'rule:attack');
    const sacredFlame = actions.find((action: any) => action.id === 'spell-action:sacred-flame');
    const guidance = actions.find((action: any) => action.id === 'spell-action:guidance');
    const cureWounds = actions.find((action: any) => action.id === 'spell-action:cure-wounds');
    const secondWind = actions.find((action: any) => action.id === 'feature:second_wind');
    const secondWindUses = actions.find((action: any) => action.id === 'limited:second_wind');

    assert.equal(attack?.name, 'Attack');
    assert.equal(sacredFlame?.kind, 'attack');
    assert.equal(sacredFlame?.hit, '12');
    assert.deepEqual(sacredFlame?.damage, ['1d8']);
    assert.equal(guidance?.kind, 'action');
    assert.equal(guidance?.resource, undefined);
    assert.equal(cureWounds?.kind, 'action');
    assert.equal(cureWounds?.resource, 'bgSpell:cure-wounds');
    assert.equal(cureWounds?.disabled, false);
    assert.equal(secondWind?.kind, 'bonus');
    assert.equal(secondWindUses?.subtitle, 'Short Rest Resource');
  } finally {
    await app.close();
  }
});

test('POST /actions/derive disables resource-based spell actions when the resource is exhausted', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const character = createBaseCharacter();
    character.resources['bgSpell:cure-wounds'].current = 0;

    const response = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: character
    });

    assert.equal(response.statusCode, 200);

    const actions = response.json();
    const cureWounds = actions.find((action: any) => action.id === 'spell-action:cure-wounds');

    assert.equal(cureWounds?.disabled, true);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive returns attack actions and class spell actions for a caster using the canonical backend contract', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-002',
    ruleset: RULESET_ID,
    name: 'Mira',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral Good',
    experience: 0,
    classes: [{ classId: 'cleric', level: 1 }],
    abilities: {
      str: 10,
      dex: 14,
      con: 13,
      int: 10,
      wis: 16,
      cha: 8
    },
    skillProficiencies: ['Insight', 'Perception'],
    savingThrowProficiencies: ['wis', 'cha'],
    inventory: [
      {
        instanceId: 'item-inst-mace',
        baseItemId: 'mace',
        status: 'equipped_main_hand'
      }
    ],
    attacks: [
      {
        name: 'Mace',
        range: '5 feet',
        type: 'Bludgeoning',
        damage: '1d6',
        itemId: 'item-inst-mace'
      }
    ],
    spells: ['Guidance', 'Sacred Flame', 'Cure Wounds'],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'acolyte',
      abilityMode: 'plus2_plus1',
      abilityAssignments: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 2,
        cha: 1
      },
      equipmentSelection: ['holy-symbol']
    },
    resources: {},
    state: {
      hp: 9,
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
    const mace = actions.find((action: any) => action.id === 'attack:0:mace');
    const cureWounds = actions.find((action: any) => action.id === 'spell-action:cure-wounds');

    assert.equal(mace?.kind, 'attack');
    assert.equal(mace?.hit, '+2');
    assert.deepEqual(mace?.damage, ['1d6+0']);
    assert.equal(cureWounds?.slotLevel, 1);
    assert.equal(cureWounds?.resource, undefined);
    assert.equal(cureWounds?.disabled, false);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive builds weapon attacks from equipped inventory items when explicit attacks are not provided', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-003',
    ruleset: RULESET_ID,
    name: 'Selise',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Good',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 14,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics', 'Perception'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-longsword',
        baseItemId: 'longsword',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-longbow',
        baseItemId: 'longbow',
        status: 'equipped_off_hand'
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
    const longbow = actions.find((action: any) => action.id === 'attack:item-inst-longbow');

    assert.equal(longsword?.kind, 'attack');
    assert.equal(longsword?.hit, '+5');
    assert.deepEqual(longsword?.damage, ['1d8+3']);
    assert.equal(longsword?.rangeLabel, 'Melee');
    assert.match(longsword?.notes ?? '', /Slashing/i);

    assert.equal(longbow?.kind, 'attack');
    assert.equal(longbow?.hit, '+4');
    assert.deepEqual(longbow?.damage, ['1d8+2']);
    assert.equal(longbow?.range, '150/600');
    assert.equal(longbow?.rangeLabel, 'Ranged');
    assert.match(longbow?.notes ?? '', /Piercing/i);
    assert.match(longbow?.notes ?? '', /Ammunition/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive uses versatile damage when a versatile weapon is free to be wielded with two hands, but not while a shield is equipped', async () => {
  const app = await createApp();

  const createCharacter = (withShield: boolean): CharacterRecord => ({
    id: withShield ? 'char-action-004b' : 'char-action-004a',
    ruleset: RULESET_ID,
    name: withShield ? 'Toren Guard' : 'Toren',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-quarterstaff',
        baseItemId: 'quarterstaff',
        status: 'equipped_main_hand'
      },
      ...(withShield
        ? [{
            instanceId: 'item-inst-shield',
            baseItemId: 'shield',
            status: 'equipped_shield' as const
          }]
        : [])
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
  });

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const freeHandsResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(false)
    });
    const shieldResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(true)
    });

    assert.equal(freeHandsResponse.statusCode, 200);
    assert.equal(shieldResponse.statusCode, 200);

    const freeHandsAttack = freeHandsResponse
      .json()
      .find((action: any) => action.id === 'attack:item-inst-quarterstaff');
    const shieldAttack = shieldResponse
      .json()
      .find((action: any) => action.id === 'attack:item-inst-quarterstaff');

    assert.deepEqual(freeHandsAttack?.damage, ['1d8+3']);
    assert.match(freeHandsAttack?.notes ?? '', /Versatile/i);
    assert.deepEqual(shieldAttack?.damage, ['1d6+3']);
    assert.match(shieldAttack?.notes ?? '', /Versatile/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive disables ammunition weapons when no matching ammo is in the inventory and shows remaining ammo when present', async () => {
  const app = await createApp();

  const createCharacter = (arrowCount: number): CharacterRecord => ({
    id: arrowCount > 0 ? 'char-action-005a' : 'char-action-005b',
    ruleset: RULESET_ID,
    name: 'Rhea',
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
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-longbow',
        baseItemId: 'longbow',
        status: 'equipped_main_hand'
      },
      ...(arrowCount > 0
        ? [{
            instanceId: 'item-inst-arrows',
            baseItemId: 'arrows-20',
            status: 'backpack' as const,
            quantity: arrowCount
          }]
        : [])
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
  });

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const availableResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(7)
    });
    const unavailableResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(0)
    });

    assert.equal(availableResponse.statusCode, 200);
    assert.equal(unavailableResponse.statusCode, 200);

    const availableAttack = availableResponse
      .json()
      .find((action: any) => action.id === 'attack:item-inst-longbow');
    const unavailableAttack = unavailableResponse
      .json()
      .find((action: any) => action.id === 'attack:item-inst-longbow');

    assert.equal(availableAttack?.disabled, false);
    assert.match(availableAttack?.notes ?? '', /Ammo: 7/i);

    assert.equal(unavailableAttack?.disabled, true);
    assert.match(unavailableAttack?.notes ?? '', /Ammo: 0/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive counts matching ammunition across stack and single-item inventory entries', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-006',
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

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: character
    });

    assert.equal(response.statusCode, 200);

    const attack = response
      .json()
      .find((action: any) => action.id === 'attack:item-inst-longbow');

    assert.equal(attack?.disabled, false);
    assert.match(attack?.notes ?? '', /Ammo: 7/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive uses the equipped weapon reach for opportunity attacks', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-007',
    ruleset: RULESET_ID,
    name: 'Vara',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-whip',
        baseItemId: 'whip',
        status: 'equipped_main_hand'
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

    const opportunity = response
      .json()
      .find((action: any) => action.id === 'rule:opportunity');

    assert.equal(opportunity?.range, '10 feet');
    assert.match(opportunity?.notes ?? '', /10 feet/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive disables Two-Weapon Fighting unless two equipped Light weapons are available', async () => {
  const app = await createApp();

  const createCharacter = (eligible: boolean): CharacterRecord => ({
    id: eligible ? 'char-action-008a' : 'char-action-008b',
    ruleset: RULESET_ID,
    name: eligible ? 'Nim' : 'Brom',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 14,
      dex: 16,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Acrobatics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: eligible
      ? [
          {
            instanceId: 'item-inst-shortsword',
            baseItemId: 'shortsword',
            status: 'equipped_main_hand'
          },
          {
            instanceId: 'item-inst-dagger',
            baseItemId: 'dagger',
            status: 'equipped_off_hand'
          }
        ]
      : [
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
  });

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const eligibleResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(true)
    });
    const ineligibleResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(false)
    });

    assert.equal(eligibleResponse.statusCode, 200);
    assert.equal(ineligibleResponse.statusCode, 200);

    const eligibleAction = eligibleResponse
      .json()
      .find((action: any) => action.id === 'rule:two-weapon');
    const ineligibleAction = ineligibleResponse
      .json()
      .find((action: any) => action.id === 'rule:two-weapon');

    assert.equal(eligibleAction?.disabled, false);
    assert.match(eligibleAction?.notes ?? '', /Light weapons/i);

    assert.equal(ineligibleAction?.disabled, true);
    assert.match(ineligibleAction?.detail ?? '', /two equipped Light weapons/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive disables Two-Handed weapon attacks when a shield or occupied off hand prevents wielding them', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-009',
    ruleset: RULESET_ID,
    name: 'Brakka',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-halberd',
        baseItemId: 'halberd',
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

    const halberd = response
      .json()
      .find((action: any) => action.id === 'attack:item-inst-halberd');

    assert.equal(halberd?.disabled, true);
    assert.match(halberd?.detail ?? '', /two hands/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive disables one-handed ammunition weapons when no free hand is available to load them', async () => {
  const app = await createApp();

  const createCharacter = (withShield: boolean): CharacterRecord => ({
    id: withShield ? 'char-action-010a' : 'char-action-010b',
    ruleset: RULESET_ID,
    name: 'Nyra',
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
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-hand-crossbow',
        baseItemId: 'hand-crossbow',
        status: 'equipped_main_hand'
      },
      ...(withShield
        ? [{
            instanceId: 'item-inst-shield',
            baseItemId: 'shield',
            status: 'equipped_shield' as const
          }]
        : []),
      {
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
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
  });

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const blockedResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(true)
    });
    const freeHandResponse = await app.inject({
      method: 'POST',
      url: '/actions/derive',
      payload: createCharacter(false)
    });

    assert.equal(blockedResponse.statusCode, 200);
    assert.equal(freeHandResponse.statusCode, 200);

    const blocked = blockedResponse
      .json()
      .find((action: any) => action.id === 'attack:item-inst-hand-crossbow');
    const freeHand = freeHandResponse
      .json()
      .find((action: any) => action.id === 'attack:item-inst-hand-crossbow');

    assert.equal(blocked?.disabled, true);
    assert.match(blocked?.detail ?? '', /free hand/i);

    assert.equal(freeHand?.disabled, false);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive adds a separate thrown attack action for equipped thrown weapons', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-011',
    ruleset: RULESET_ID,
    name: 'Kest',
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
    skillProficiencies: ['Acrobatics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-dagger',
        baseItemId: 'dagger',
        status: 'equipped_main_hand'
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

    const melee = response
      .json()
      .find((action: any) => action.id === 'attack:item-inst-dagger');
    const thrown = response
      .json()
      .find((action: any) => action.id === 'attack:item-inst-dagger:thrown');

    assert.equal(melee?.range, '5 feet');
    assert.equal(melee?.rangeLabel, 'Melee');
    assert.equal(thrown?.range, '20/60');
    assert.equal(thrown?.rangeLabel, 'Thrown');
    assert.equal(thrown?.subtitle, 'Weapon / Thrown Attack');
    assert.equal(thrown?.hit, '+5');
    assert.deepEqual(thrown?.damage, ['1d4+3']);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive returns only Attack action when no weapons are equipped', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-011',
    ruleset: RULESET_ID,
    name: 'Unarmed',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
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
    const attack = actions.find((action: any) => action.id === 'rule:attack');
    const noWeaponAttack = actions.find((action: any) => action.id.startsWith('attack:item-'));

    assert.equal(attack?.kind, 'action');
    assert.equal(noWeaponAttack, undefined);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles finesse weapon using dex modifier correctly', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-012',
    ruleset: RULESET_ID,
    name: 'Dex Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral Good',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 10,
      dex: 18,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Acrobatics'],
    savingThrowProficiencies: ['dex', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-rapier',
        baseItemId: 'rapier',
        status: 'equipped_main_hand'
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
    const rapier = actions.find((action: any) => action.id === 'attack:item-inst-rapier');

    assert.equal(rapier?.kind, 'attack');
    assert.equal(rapier?.hit, '+6');
    assert.deepEqual(rapier?.damage, ['1d8+4']);
    assert.equal(rapier?.rangeLabel, 'Melee');
    assert.match(rapier?.notes ?? '', /Finesse/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive ignores ammo from non-matching ammo item types', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-013',
    ruleset: RULESET_ID,
    name: 'Crossbow Expert',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 14,
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
        instanceId: 'item-inst-hand-crossbow',
        baseItemId: 'hand-crossbow',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
        status: 'backpack',
        quantity: 5
      },
      {
        instanceId: 'item-inst-arrows',
        baseItemId: 'arrows-20',
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
    const crossbow = actions.find((action: any) => action.id === 'attack:item-inst-hand-crossbow');

    assert.equal(crossbow?.disabled, false);
    assert.match(crossbow?.notes ?? '', /Ammo: 5/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive disables ammunition weapons when ammo count is zero, even if other ammo types present', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-014',
    ruleset: RULESET_ID,
    name: 'Empty Quiver',
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
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-longbow',
        baseItemId: 'longbow',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-arrows',
        baseItemId: 'arrows-20',
        status: 'backpack',
        quantity: 0
      },
      {
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
        status: 'backpack',
        quantity: 10
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
    const longbow = actions.find((action: any) => action.id === 'attack:item-inst-longbow');

    assert.equal(longbow?.disabled, true);
    assert.match(longbow?.notes ?? '', /Ammo: 0/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive derives both melee and thrown attack for javelin (melee 15ft, thrown 30/120)', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-015',
    ruleset: RULESET_ID,
    name: 'Javelin Thrower',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-javelin',
        baseItemId: 'javelin',
        status: 'equipped_main_hand'
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
    const melee = actions.find((action: any) => action.id === 'attack:item-inst-javelin');
    const thrown = actions.find((action: any) => action.id === 'attack:item-inst-javelin:thrown');

    assert.equal(melee?.range, '5 feet');
    assert.equal(melee?.rangeLabel, 'Melee');
    assert.equal(melee?.hit, '+5');
    assert.deepEqual(melee?.damage, ['1d6+3']);

    assert.equal(thrown?.range, '30/120');
    assert.equal(thrown?.rangeLabel, 'Thrown');
    assert.equal(thrown?.hit, '+5');
    assert.deepEqual(thrown?.damage, ['1d6+3']);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive uses strength for melee weapon attacks without finesse', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-016',
    ruleset: RULESET_ID,
    name: 'Strong Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral Good',
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
        instanceId: 'item-inst-longsword',
        baseItemId: 'longsword',
        status: 'equipped_main_hand'
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

    assert.equal(longsword?.kind, 'attack');
    assert.equal(longsword?.hit, '+6');
    // Longsword is versatile, hand is free (no shield/off-hand item), so uses versatile damage d10
    assert.deepEqual(longsword?.damage, ['1d10+4']);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive derives spell attack action from character spells', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-017',
    ruleset: RULESET_ID,
    name: 'Cleric Caster',
    lineageId: 'human',
    backgroundId: 'acolyte',
    alignment: 'Neutral Good',
    experience: 0,
    classes: [{ classId: 'cleric', level: 1 }],
    abilities: {
      str: 10,
      dex: 12,
      con: 14,
      int: 10,
      wis: 18,
      cha: 8
    },
    skillProficiencies: ['Insight', 'Religion'],
    savingThrowProficiencies: ['wis', 'cha'],
    inventory: [],
    spellChoices: [],
    spells: ['Sacred Flame', 'Guidance'],
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
    resources: {},
    state: {
      hp: 9,
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
    const sacredFlame = actions.find((action: any) => action.id === 'spell-action:sacred-flame');
    const guidance = actions.find((action: any) => action.id === 'spell-action:guidance');

    assert.ok(sacredFlame, 'Sacred Flame action should exist');
    assert.ok(guidance, 'Guidance action should exist');
    assert.equal(guidance.kind, 'action');
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles Heavy weapon (greatsword) with strength-based attack', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-018',
    ruleset: RULESET_ID,
    name: 'Barbarian',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Chaotic Neutral',
    experience: 0,
    classes: [{ classId: 'barbarian', level: 1 }],
    abilities: {
      str: 18,
      dex: 10,
      con: 16,
      int: 8,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics', 'Intimidation'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-greatsword',
        baseItemId: 'greatsword',
        status: 'equipped_main_hand'
      }
    ],
    spellChoices: [],
    resources: {},
    state: {
      hp: 13,
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
    assert.equal(greatsword.kind, 'attack');
    // STR 18 => +4 mod, prof +2 => +6 hit
    assert.equal(greatsword.hit, '+6');
    // Greatsword: 2d6 slashing, Heavy property
    assert.deepEqual(greatsword.damage, ['2d6+4']);
    assert.match(greatsword.notes ?? '', /Heavy/i);
    assert.match(greatsword.notes ?? '', /Slashing/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles Loading property (hand crossbow) correctly', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-019',
    ruleset: RULESET_ID,
    name: 'Rogue',
    lineageId: 'human',
    backgroundId: 'criminal',
    alignment: 'Chaotic Neutral',
    experience: 0,
    classes: [{ classId: 'rogue', level: 1 }],
    abilities: {
      str: 10,
      dex: 16,
      con: 12,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Stealth', 'Sleight of Hand'],
    savingThrowProficiencies: ['dex', 'int'],
    inventory: [
      {
        instanceId: 'item-inst-hand-crossbow',
        baseItemId: 'hand-crossbow',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
        status: 'backpack',
        quantity: 10
      }
    ],
    spellChoices: [],
    resources: {},
    state: {
      hp: 10,
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
    const handCrossbow = actions.find((action: any) => action.id === 'attack:item-inst-hand-crossbow');

    assert.ok(handCrossbow, 'Hand crossbow attack should exist');
    assert.equal(handCrossbow.kind, 'attack');
    // DEX 16 => +3 mod, prof +2 => +5 hit
    assert.equal(handCrossbow.hit, '+5');
    assert.deepEqual(handCrossbow.damage, ['1d6+3']);
    assert.match(handCrossbow.notes ?? '', /Loading/i);
    assert.match(handCrossbow.notes ?? '', /Ammunition/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles Two-Weapon Fighting with only one Light weapon (should be disabled)', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-020',
    ruleset: RULESET_ID,
    name: 'Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 14,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-shortsword',
        baseItemId: 'shortsword',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-dagger',
        baseItemId: 'dagger',
        status: 'backpack'
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
    const twoWeapon = actions.find((action: any) => action.id === 'rule:two-weapon');

    assert.ok(twoWeapon, 'Two-Weapon Fighting action should exist');
    assert.equal(twoWeapon.disabled, true);
    assert.match(twoWeapon.detail ?? '', /two equipped Light weapons/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles Reach weapon for opportunity attack range', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-021',
    ruleset: RULESET_ID,
    name: 'Pike Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-pike',
        baseItemId: 'pike',
        status: 'equipped_main_hand'
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
    const opportunity = actions.find((action: any) => action.id === 'rule:opportunity');

    // Pike has Reach (10 feet)
    assert.equal(opportunity?.range, '10 feet');
    assert.match(opportunity?.notes ?? '', /10 feet/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive blocks Loading weapon (hand crossbow) when off-hand is occupied by another weapon', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-022',
    ruleset: RULESET_ID,
    name: 'Rogue with Off-Hand',
    lineageId: 'human',
    backgroundId: 'criminal',
    alignment: 'Chaotic Neutral',
    experience: 0,
    classes: [{ classId: 'rogue', level: 1 }],
    abilities: {
      str: 10,
      dex: 16,
      con: 12,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Stealth', 'Sleight of Hand'],
    savingThrowProficiencies: ['dex', 'int'],
    inventory: [
      {
        instanceId: 'item-inst-hand-crossbow',
        baseItemId: 'hand-crossbow',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-dagger',
        baseItemId: 'dagger',
        status: 'equipped_off_hand'
      },
      {
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
        status: 'backpack',
        quantity: 5
      }
    ],
    spellChoices: [],
    resources: {},
    state: {
      hp: 10,
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
    const handCrossbow = actions.find((action: any) => action.id === 'attack:item-inst-hand-crossbow');

    assert.ok(handCrossbow, 'Hand crossbow attack should exist');
    assert.equal(handCrossbow.disabled, true);
    assert.match(handCrossbow.detail ?? '', /free hand/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive displays Heavy property on heavy crossbow correctly', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-023',
    ruleset: RULESET_ID,
    name: 'Heavy Crossbow Guy',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 14,
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
        instanceId: 'item-inst-heavy-crossbow',
        baseItemId: 'heavy-crossbow',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
        status: 'backpack',
        quantity: 10
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
    const heavyCrossbow = actions.find((action: any) => action.id === 'attack:item-inst-heavy-crossbow');

    assert.ok(heavyCrossbow, 'Heavy crossbow attack should exist');
    assert.equal(heavyCrossbow.kind, 'attack');
    // DEX 16 => +3 mod, prof +2 => +5 hit. Heavy crossbow damage 1d10
    assert.equal(heavyCrossbow.hit, '+5');
    assert.deepEqual(heavyCrossbow.damage, ['1d10+3']);
    // Heavy crossbow has Heavy, Loading, Ammunition, Two-Handed properties
    assert.match(heavyCrossbow.notes ?? '', /Heavy/i);
    assert.match(heavyCrossbow.notes ?? '', /Loading/i);
    assert.match(heavyCrossbow.notes ?? '', /Ammunition/i);
    assert.match(heavyCrossbow.notes ?? '', /Two-Handed/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive blocks Two-Handed heavy crossbow when shield is equipped', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-024',
    ruleset: RULESET_ID,
    name: 'Blocked Heavy Crossbow',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 14,
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
        instanceId: 'item-inst-heavy-crossbow',
        baseItemId: 'heavy-crossbow',
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
    const heavyCrossbow = actions.find((action: any) => action.id === 'attack:item-inst-heavy-crossbow');

    assert.ok(heavyCrossbow, 'Heavy crossbow attack should exist');
    assert.equal(heavyCrossbow.disabled, true);
    assert.match(heavyCrossbow.detail ?? '', /two hands/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles glaive (Heavy, Reach, Two-Handed) correctly', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-025',
    ruleset: RULESET_ID,
    name: 'Glaive Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-glaive',
        baseItemId: 'glaive',
        status: 'equipped_main_hand'
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
    const glaive = actions.find((action: any) => action.id === 'attack:item-inst-glaive');
    const opportunity = actions.find((action: any) => action.id === 'rule:opportunity');

    assert.ok(glaive, 'Glaive attack should exist');
    assert.equal(glaive.kind, 'attack');
    // STR 16 => +3 mod, prof +2 => +5 hit. Glaive damage 1d10 slashing
    assert.equal(glaive.hit, '+5');
    assert.deepEqual(glaive.damage, ['1d10+3']);
    // Glaive has Heavy, Reach, Two-Handed properties
    assert.match(glaive.notes ?? '', /Heavy/i);
    assert.match(glaive.notes ?? '', /Reach/i);
    assert.match(glaive.notes ?? '', /Two-Handed/i);
    assert.match(glaive.notes ?? '', /Slashing/i);

    // Opportunity attack should use Reach (10 feet)
    assert.equal(opportunity?.range, '10 feet');
  } finally {
    await app.close();
  }
});

test('POST /actions/derive handles whip (Finesse, Reach) correctly with DEX', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-026',
    ruleset: RULESET_ID,
    name: 'Whip Rogue',
    lineageId: 'human',
    backgroundId: 'criminal',
    alignment: 'Chaotic Neutral',
    experience: 0,
    classes: [{ classId: 'rogue', level: 1 }],
    abilities: {
      str: 10,
      dex: 16,
      con: 12,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Stealth', 'Sleight of Hand'],
    savingThrowProficiencies: ['dex', 'int'],
    inventory: [
      {
        instanceId: 'item-inst-whip',
        baseItemId: 'whip',
        status: 'equipped_main_hand'
      }
    ],
    spellChoices: [],
    resources: {},
    state: {
      hp: 10,
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
    const whip = actions.find((action: any) => action.id === 'attack:item-inst-whip');
    const opportunity = actions.find((action: any) => action.id === 'rule:opportunity');

    assert.ok(whip, 'Whip attack should exist');
    assert.equal(whip.kind, 'attack');
    // Whip is Finesse, uses DEX. DEX 16 => +3 mod, prof +2 => +5 hit
    assert.equal(whip.hit, '+5');
    // Whip damage 1d4 slashing
    assert.deepEqual(whip.damage, ['1d4+3']);
    // Whip has Finesse, Reach properties
    assert.match(whip.notes ?? '', /Finesse/i);
    assert.match(whip.notes ?? '', /Reach/i);

    // Opportunity attack should use Reach (10 feet)
    assert.equal(opportunity?.range, '10 feet');
  } finally {
    await app.close();
  }
});

test('POST /actions/derive marks Loading weapons (light crossbow) with Loading note and source.loading flag', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-027',
    ruleset: RULESET_ID,
    name: 'Crossbow Fighter',
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
        instanceId: 'item-inst-bolts',
        baseItemId: 'bolts-20',
        status: 'backpack',
        quantity: 10
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
    assert.equal(lightCrossbow.kind, 'attack');
    // DEX 16 => +3 mod, prof +2 => +5 hit
    assert.equal(lightCrossbow.hit, '+5');
    assert.deepEqual(lightCrossbow.damage, ['1d8+3']);
    // Light crossbow has Loading, Ammunition, Two-Handed properties
    assert.match(lightCrossbow.notes ?? '', /Loading/i);
    assert.match(lightCrossbow.notes ?? '', /Ammunition/i);
    assert.match(lightCrossbow.notes ?? '', /Two-Handed/i);
    // source.loading flag for canonical Loading property rule
    assert.equal(lightCrossbow.source?.loading, true);
    assert.ok(!lightCrossbow.source?.reload, 'reload should be falsy for Loading weapon');
  } finally {
    await app.close();
  }
});

test('POST /actions/derive marks Reload weapons (revolver) with Reload note and source.reload flag', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-028',
    ruleset: RULESET_ID,
    name: 'Gunslinger',
    lineageId: 'human',
    backgroundId: 'criminal',
    alignment: 'Chaotic Neutral',
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
    skillProficiencies: ['Stealth'],
    savingThrowProficiencies: ['str', 'dex'],
    inventory: [
      {
        instanceId: 'item-inst-revolver',
        baseItemId: 'revolver',
        status: 'equipped_main_hand'
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
    const revolver = actions.find((action: any) => action.id === 'attack:item-inst-revolver');

    assert.ok(revolver, 'Revolver attack should exist');
    assert.equal(revolver.kind, 'attack');
    // DEX 16 => +3 mod, prof +2 => +5 hit
    assert.equal(revolver.hit, '+5');
    // Revolver has Reload, Automatic Fire properties
    assert.match(revolver.notes ?? '', /Reload/i);
    assert.match(revolver.notes ?? '', /Automatic Fire/i);
    // source.reload flag for canonical Reload property rule
    assert.equal(revolver.source?.reload, true);
    assert.ok(!revolver.source?.loading, 'loading should be falsy for Reload weapon');
  } finally {
    await app.close();
  }
});

test('POST /actions/derive uses melee weapon reach for opportunity attack, ignoring equipped ranged weapons', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-029',
    ruleset: RULESET_ID,
    name: 'Melee+Ranged Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 14,
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
        instanceId: 'item-inst-longbow',
        baseItemId: 'longbow',
        status: 'equipped_off_hand'
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
    const opportunity = actions.find((action: any) => action.id === 'rule:opportunity');

    // Should use melee weapon (longsword, no reach) for opportunity attack range
    // Longsword is melee with 5 feet reach, so opportunity attack range is 5 feet
    assert.ok(opportunity, 'Opportunity attack should exist');
    assert.equal(opportunity.range, '5 feet');
    assert.match(opportunity.notes ?? '', /5 feet/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive uses 10 feet reach for opportunity attack when character has reach melee weapon', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-030',
    ruleset: RULESET_ID,
    name: 'Reach Fighter',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-glaive',
        baseItemId: 'glaive',
        status: 'equipped_main_hand'
      },
      {
        instanceId: 'item-inst-hand-crossbow',
        baseItemId: 'hand-crossbow',
        status: 'equipped_off_hand'
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
    const opportunity = actions.find((action: any) => action.id === 'rule:opportunity');

    // Glaive has Reach (10 feet), so opportunity attack range should be 10 feet
    assert.ok(opportunity, 'Opportunity attack should exist');
    assert.equal(opportunity.range, '10 feet');
    assert.match(opportunity.notes ?? '', /10 feet/i);
  } finally {
    await app.close();
  }
});

test('POST /actions/derive uses 5 feet reach for opportunity attack when only ranged weapon is equipped', async () => {
  const app = await createApp();

  const character: CharacterRecord = {
    id: 'char-action-031',
    ruleset: RULESET_ID,
    name: 'Ranged Only Fighter',
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
        instanceId: 'item-inst-longbow',
        baseItemId: 'longbow',
        status: 'equipped_main_hand'
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
    const opportunity = actions.find((action: any) => action.id === 'rule:opportunity');

    // No melee weapon equipped, so opportunity attack uses unarmed strike range (5 feet)
    assert.ok(opportunity, 'Opportunity attack should exist');
    assert.equal(opportunity.range, '5 feet');
  } finally {
    await app.close();
  }
});
