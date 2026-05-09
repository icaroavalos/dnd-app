import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaCharacterRepository } from '../src/modules/characters/persistence/prisma-character-repository.js';
import { PrismaClient } from '../generated/prisma/index.js';

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

function createBaseCharacterData(userId: string, overrides: Partial<any> = {}) {
  return {
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: userId,
    name: 'Test Character',
    ruleset: '5e',
    lineageId: 'human',
    backgroundId: 'soldier',
    alignment: 'Neutral',
    experience: 0,
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
    classes: [{ classId: 'fighter', level: 1 }],
    inventory: [],
    spellChoices: [],
    backgroundChoices: [],
    runtimeState: {
      hp: 12,
      maxHpOverride: null,
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
    ...overrides,
  };
}

test('PrismaCharacterRepository - create and findById', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacterData(userId);
    const created = await repo.create(data);

    assert.ok(created.id, 'Should have ID');
    assert.equal(created.name, data.name);
    assert.equal(created.abilities.str, 16);

    const found = await repo.findById(created.id);
    assert.equal(found.id, created.id);
    assert.equal(found.name, data.name);
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - list returns characters', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacterData(userId, { name: 'List Test' });
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
    const data = createBaseCharacterData(userId, { name: 'Original Name' });
    const created = await repo.create(data);

    const updated = await repo.update(created.id, {
      name: 'Updated Name',
      abilities: { ...created.abilities, str: 18 },
    });

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
    const data = createBaseCharacterData(userId, { name: 'To Delete' });
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
    const data = createBaseCharacterData(userId, { name: 'Exists Test' });
    const created = await repo.create(data);

    assert.ok(await repo.exists(created.id), 'Should exist');

    await repo.delete(created.id);
    assert.ok(!(await repo.exists(created.id)), 'Should not exist after delete');
  } finally {
    await repo.onModuleDestroy();
  }
});

test('PrismaCharacterRepository - create with full data', async () => {
  const userId = await getTestUserId();
  const repo = new PrismaCharacterRepository();
  await repo.onModuleInit();

  try {
    const data = createBaseCharacterData(userId, {
      name: 'Full Data Test',
      classes: [
        { classId: 'wizard', level: 3 },
        { classId: 'cleric', level: 2 },
      ],
      inventory: [
        { baseItemId: 'staff', quantity: 1, status: 'equipped_weapon' },
        { baseItemId: 'spellbook', quantity: 1, status: 'carried' },
      ],
      spellChoices: [{ spellId: 'magic-missile', spellcastingAbility: 'int' }],
      backgroundChoices: [
        { choiceType: 'skill', value: 'Arcana' },
        { choiceType: 'skill', value: 'History' },
      ],
      runtimeState: {
        hp: 18,
        maxHpOverride: null,
        tempHp: 3,
        hitDiceUsed: 1,
        spellSlotsUsed: { 1: 4, 2: 2 },
        activeConditions: ['blessed'],
      },
    });

    const created = await repo.create(data);

    assert.equal(created.name, 'Full Data Test');
    assert.equal(created.classes.length, 2);
    assert.equal(created.inventory.length, 2);
    assert.equal(created.spellChoices.length, 1);
    assert.equal(created.backgroundChoices.length, 2);
    assert.equal(created.runtimeState.hp, 18);
    assert.equal(created.runtimeState.tempHp, 3);
  } finally {
    await repo.onModuleDestroy();
  }
});
