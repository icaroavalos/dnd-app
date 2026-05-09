import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

test('POST /characters/project derives a fighter sheet with background-based spellcasting', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-001',
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

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);

    const sheet = response.json();
    assert.equal(sheet.ruleset, RULESET_ID);
    assert.equal(sheet.level, 1);
    assert.equal(sheet.proficiencyBonus, 2);
    assert.equal(sheet.abilityScores.wis, 14);
    assert.equal(sheet.abilityScores.int, 11);
    assert.equal(sheet.abilityModifiers.wis, 2);
    assert.equal(sheet.savingThrows.str, 4);
    assert.equal(sheet.savingThrows.con, 4);
    assert.equal(sheet.skillBonuses.Athletics, 4);
    assert.equal(sheet.skillBonuses.Perception, 4);
    assert.equal(sheet.passivePerception, 14);
    assert.equal(sheet.initiative, 2);
    assert.equal(sheet.maxHp, 12);
    assert.equal(sheet.currentHp, 12);
    assert.equal(sheet.spellcasting.ability, 'wis');
    assert.equal(sheet.spellcasting.attackBonus, 4);
    assert.equal(sheet.spellcasting.saveDc, 12);
    assert.equal(sheet.resources.second_wind.current, 1);
  } finally {
    await app.close();
  }
});

test('POST /characters/project keeps spellcasting null for a non-caster without spell-grant choices', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-002',
    ruleset: RULESET_ID,
    name: 'Bran',
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
      cha: 8
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: {
        str: 1,
        dex: 0,
        con: 1,
        int: 0,
        wis: 1,
        cha: 0
      },
      equipmentSelection: []
    },
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
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);

    const sheet = response.json();
    assert.equal(sheet.spellcasting, null);
    assert.equal(sheet.abilityScores.str, 17);
    assert.equal(sheet.abilityScores.con, 15);
    assert.equal(sheet.abilityScores.wis, 11);
  } finally {
    await app.close();
  }
});

test('POST /characters/project derives armor class from equipped armor and shield items', async () => {
  const app = await createApp();

  const createPayload = (
    id: string,
    inventory: CharacterRecord['inventory']
  ): CharacterRecord => ({
    id,
    ruleset: RULESET_ID,
    name: 'Armor Test',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 15,
      dex: 16,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory,
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: {
        str: 1,
        dex: 0,
        con: 1,
        int: 0,
        wis: 1,
        cha: 0
      },
      equipmentSelection: []
    },
    resources: {},
    state: {
      hp: 13,
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

    const studdedLeatherResponse = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload: createPayload('char-armor-001', [
        {
          instanceId: 'item-inst-studded-leather',
          baseItemId: 'studded-leather-armor',
          status: 'equipped_armor'
        },
        {
          instanceId: 'item-inst-shield',
          baseItemId: 'shield',
          status: 'equipped_shield'
        }
      ])
    });

    const breastplateResponse = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload: createPayload('char-armor-002', [
        {
          instanceId: 'item-inst-breastplate',
          baseItemId: 'breastplate',
          status: 'equipped_armor'
        },
        {
          instanceId: 'item-inst-shield',
          baseItemId: 'shield',
          status: 'equipped_shield'
        }
      ])
    });

    const chainMailResponse = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload: createPayload('char-armor-003', [
        {
          instanceId: 'item-inst-chain-mail',
          baseItemId: 'chain-mail',
          status: 'equipped_armor'
        },
        {
          instanceId: 'item-inst-shield',
          baseItemId: 'shield',
          status: 'equipped_shield'
        }
      ])
    });

    assert.equal(studdedLeatherResponse.statusCode, 200);
    assert.equal(breastplateResponse.statusCode, 200);
    assert.equal(chainMailResponse.statusCode, 200);

    assert.equal(studdedLeatherResponse.json().armorClass, 17);
    assert.equal(breastplateResponse.json().armorClass, 18);
    assert.equal(chainMailResponse.json().armorClass, 18);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class correctly for light armor with high dex', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-armor-004',
    ruleset: RULESET_ID,
    name: 'Shadow',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 14,
      dex: 18,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Stealth'],
    savingThrowProficiencies: ['str', 'dex'],
    inventory: [
      {
        instanceId: 'item-inst-studded-leather',
        baseItemId: 'studded-leather-armor',
        status: 'equipped_armor'
      }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: {
        str: 0,
        dex: 0,
        con: 1,
        int: 0,
        wis: 1,
        cha: 0
      },
      equipmentSelection: []
    },
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
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // Studded leather (AC 12) + Dex mod (+4) = 16
    assert.equal(response.json().armorClass, 16);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class correctly for medium armor with dex cap', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-armor-005',
    ruleset: RULESET_ID,
    name: 'Guard',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 18,
      con: 14,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-scale-mail',
        baseItemId: 'scale-mail',
        status: 'equipped_armor'
      }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: {
        str: 1,
        dex: 0,
        con: 1,
        int: 0,
        wis: 1,
        cha: 0
      },
      equipmentSelection: []
    },
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
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // Scale mail (AC 14) + Dex mod capped at +2 = 16
    assert.equal(response.json().armorClass, 16);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class correctly for heavy armor ignoring dex', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-armor-006',
    ruleset: RULESET_ID,
    name: 'Tank',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Lawful Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: {
      str: 16,
      dex: 8,
      con: 16,
      int: 10,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      {
        instanceId: 'item-inst-plate',
        baseItemId: 'plate-armor',
        status: 'equipped_armor'
      }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: {
        str: 1,
        dex: 0,
        con: 1,
        int: 0,
        wis: 1,
        cha: 0
      },
      equipmentSelection: []
    },
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
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // Plate armor (AC 18) + 0 (heavy armor ignores dex) = 18
    assert.equal(response.json().armorClass, 18);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class with no armor using default dex', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-armor-007',
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
      con: 14,
      int: 12,
      wis: 10,
      cha: 10
    },
    skillProficiencies: ['Stealth', 'Sleight of Hand'],
    savingThrowProficiencies: ['dex', 'int'],
    inventory: [],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'criminal',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: {
        str: 0,
        dex: 1,
        con: 0,
        int: 1,
        wis: 0,
        cha: 1
      },
      equipmentSelection: []
    },
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
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // No armor: 10 + Dex mod (+3) = 13
    assert.equal(response.json().armorClass, 13);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class with shield but no armor', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-ac-shield-only',
    ruleset: RULESET_ID,
    name: 'ShieldOnly',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 14, dex: 16, con: 14, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      { instanceId: 'item-inst-shield', baseItemId: 'shield', status: 'equipped_shield' }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: { str: 1, dex: 0, con: 1, int: 0, wis: 1, cha: 0 },
      equipmentSelection: []
    },
    resources: {},
    state: { hp: 13, maxHpOverride: null, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] }
  };

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // No armor (10 + 3 dex) + shield (+2) = 15
    assert.equal(response.json().armorClass, 15);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class with half-plate (medium armor) and high dex', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-ac-halfplate',
    ruleset: RULESET_ID,
    name: 'HalfPlate',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 14, dex: 18, con: 14, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Stealth'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      { instanceId: 'item-inst-half-plate', baseItemId: 'half-plate-armor', status: 'equipped_armor' }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: { str: 1, dex: 0, con: 1, int: 0, wis: 1, cha: 0 },
      equipmentSelection: []
    },
    resources: {},
    state: { hp: 13, maxHpOverride: null, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] }
  };

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // Half plate (AC 15) + Dex mod capped at +2 = 17
    assert.equal(response.json().armorClass, 17);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class with splint (heavy armor) and negative dex', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-ac-splint',
    ruleset: RULESET_ID,
    name: 'Splint',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 16, dex: 8, con: 16, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      { instanceId: 'item-inst-splint', baseItemId: 'splint-armor', status: 'equipped_armor' }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: { str: 1, dex: 0, con: 1, int: 0, wis: 1, cha: 0 },
      equipmentSelection: []
    },
    resources: {},
    state: { hp: 13, maxHpOverride: null, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] }
  };

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // Splint (AC 17) + 0 (heavy armor ignores dex) = 17
    assert.equal(response.json().armorClass, 17);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class with half-plate and shield (medium armor + shield)', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-ac-halfplate-shield',
    ruleset: RULESET_ID,
    name: 'HalfPlateShield',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 14, dex: 16, con: 14, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [
      { instanceId: 'item-inst-half-plate', baseItemId: 'half-plate-armor', status: 'equipped_armor' },
      { instanceId: 'item-inst-shield', baseItemId: 'shield', status: 'equipped_shield' }
    ],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: { str: 1, dex: 0, con: 1, int: 0, wis: 1, cha: 0 },
      equipmentSelection: []
    },
    resources: {},
    state: { hp: 13, maxHpOverride: null, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] }
  };

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // Half plate (AC 15) + Dex mod capped at +2 + shield (+2) = 19
    assert.equal(response.json().armorClass, 19);
  } finally {
    await app.close();
  }
});

test('POST /characters/project calculates armor class with no armor and negative dex modifier', async () => {
  const app = await createApp();

  const payload: CharacterRecord = {
    id: 'char-ac-no-armor-neg-dex',
    ruleset: RULESET_ID,
    name: 'LowDex',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 16, dex: 8, con: 14, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
    spellChoices: [],
    backgroundChoices: {
      backgroundId: 'soldier',
      abilityMode: 'plus1_plus1_plus1',
      abilityAssignments: { str: 1, dex: 0, con: 1, int: 0, wis: 1, cha: 0 },
      equipmentSelection: []
    },
    resources: {},
    state: { hp: 13, maxHpOverride: null, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] }
  };

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'POST',
      url: '/characters/project',
      payload
    });

    assert.equal(response.statusCode, 200);
    // No armor: 10 + Dex mod (-1) = 9
    assert.equal(response.json().armorClass, 9);
  } finally {
    await app.close();
  }
});
