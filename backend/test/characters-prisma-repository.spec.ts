import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaCharacterRepository } from '../src/modules/characters/persistence/prisma-character-repository.js';
import { PrismaClient } from '../generated/prisma/index.js';
import { RULESET_ID, type CharacterRecord } from '@shared/contracts';

async function getTestUserId(): Promise<string> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    let user = await prisma.user.findFirst({ where: { email: 'test-prisma@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test-prisma@example.com',
          username: 'test-prisma',
        },
      });
    }
    return user.id;
  } finally {
    await prisma.$disconnect();
  }
}

function createBaseCharacter(overrides: Partial<CharacterRecord> = {}): CharacterRecord {
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ruleset: RULESET_ID,
    name: 'Test Character',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    classes: [{ classId: 'fighter', level: 1 }],
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    skillProficiencies: ['Athletics'],
    savingThrowProficiencies: ['str', 'con'],
    inventory: [],
    spellChoices: [],
    backgroundChoices: null,
    attacks: [],
    resources: {},
    state: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
    ...overrides,
  } as CharacterRecord;
}

test('PrismaCharacterRepository - create and findById with full CharacterRecord', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacter();
    const created = await repo.create(data);

    assert.ok(created.id, 'Should have ID');
    assert.equal(created.name, data.name);
    assert.equal(created.abilities.str, 16);

    const found = await repo.findById(created.id);
    assert.equal(found.id, created.id);
    assert.equal(found.name, data.name);
    assert.deepEqual(found.abilities, data.abilities);
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - list returns characters', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacter({ name: 'List Test' });
    await repo.create(data);

    const list = await repo.list();
    assert.ok(Array.isArray(list), 'Should return array');
    assert.ok(list.length > 0, 'Should have at least one character');

    const found = list.find((c) => c.name === 'List Test');
    assert.ok(found, 'Should find created character');
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - findById throws for non-existent', async () => {
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    await repo.findById('non-existent-id');
    assert.fail('Should throw NotFoundException');
  } catch (err: any) {
    assert.equal(err.status, 404);
    assert.equal(err.response?.code, 'CHARACTER_NOT_FOUND');
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - update existing character', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacter({ name: 'Original Name' });
    const created = await repo.create(data);

    const updatedData = { ...created, name: 'Updated Name', abilities: { ...created.abilities, str: 18 } } as CharacterRecord;
    const updated = await repo.update(created.id, updatedData);

    assert.equal(updated.name, 'Updated Name');
    assert.equal(updated.abilities.str, 18);

    const found = await repo.findById(created.id);
    assert.equal(found.name, 'Updated Name');
    assert.equal(found.abilities.str, 18);
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - delete character', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacter({ name: 'To Delete' });
    const created = await repo.create(data);

    await repo.delete(created.id);

    await assert.rejects(async () => {
      await repo.findById(created.id);
    });
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - exists returns boolean', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacter({ name: 'Exists Test' });
    const created = await repo.create(data);

    assert.ok(await repo.exists(created.id), 'Should exist');

    await repo.delete(created.id);
    assert.ok(!(await repo.exists(created.id)), 'Should not exist after delete');
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - create with full CharacterRecord including resources, spellChoices, backgroundChoices', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacter({
      name: 'Full Data Test',
      classes: [
        { classId: 'wizard', level: 3 },
        { classId: 'cleric', level: 2 },
      ],
      inventory: [
        { instanceId: 'inst-staff', baseItemId: 'staff', status: 'backpack' },
        { instanceId: 'inst-spellbook', baseItemId: 'spellbook', status: 'backpack' },
      ],
      spellChoices: [{ sourceId: 'magic-initiate-wizard', spellcastingAbility: 'int', selectedCantrips: ['magic-missile'], selectedLevel1Spells: [] }],
      backgroundChoices: { backgroundId: 'sage', abilityMode: 'plus2_plus1', abilityAssignments: { str: 0, dex: 0, con: 0, int: 2, wis: 1, cha: 0 }, equipmentSelection: [] },
      resources: {
        second_wind: { current: 1, max: 1, recovery: 'short_rest' },
      },
      state: {
        hp: 18,
        maxHpOverride: null,
        tempHp: 3,
        hitDiceUsed: 1,
        spellSlotsUsed: { '1': 4, '2': 2 },
        activeConditions: [{ conditionId: 'blessed' }],
      },
    });

    const created = await repo.create(data);
    const found = await repo.findById(created.id);

    assert.equal(found.name, 'Full Data Test');
    assert.equal(found.classes.length, 2);
    assert.equal(found.spellChoices.length, 1);
    assert.deepEqual(found.resources, data.resources);
    assert.deepEqual(found.state.spellSlotsUsed, { '1': 4, '2': 2 });
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - findById returns exact CharacterRecord that was created', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const originalData = createBaseCharacter({
      name: 'Roundtrip Test',
      skillProficiencies: ['Athletics', 'Perception'],
      savingThrowProficiencies: ['str', 'dex'],
      resources: {
        rage: { current: 2, max: 2, recovery: 'long_rest' },
      },
      state: {
        hp: 20,
        maxHpOverride: null,
        tempHp: 0,
        hitDiceUsed: 0,
        spellSlotsUsed: {},
        activeConditions: [],
      },
    });

    await repo.create(originalData);
    const found = await repo.findById(originalData.id);

    // Verifica campos principais
    assert.equal(found.name, originalData.name);
    assert.equal(found.ruleset, originalData.ruleset);
    assert.deepEqual(found.abilities, originalData.abilities);
    assert.deepEqual(found.skillProficiencies, originalData.skillProficiencies);
    assert.deepEqual(found.savingThrowProficiencies, originalData.savingThrowProficiencies);

    // Verifica resources
    assert.deepEqual(found.resources, originalData.resources);

    // Verifica state
    assert.equal(found.state.hp, originalData.state.hp);
    assert.deepEqual(found.state.spellSlotsUsed, originalData.state.spellSlotsUsed);
    assert.deepEqual(found.state.activeConditions, originalData.state.activeConditions);
  } finally {
    await repo.onModuleDestroy();
  }
});
