import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '../src/domain/contracts/index.js';

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
    assert.equal(rapier?.hit, '+4');
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
