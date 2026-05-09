import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/main.js';
import { PrismaClient } from '../generated/prisma/index.js';

async function getOrCreateUser(): Promise<string> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    let user = await prisma.user.findFirst({ where: { email: 'test-storage@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'test-storage@example.com', username: 'test-storage' },
      });
    }
    return user.id;
  } finally {
    await prisma.$disconnect();
  }
}

function createBaseCharacter(userId: string, overrides = {}) {
  return {
    userId,
    name: 'Storage Test',
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
      tempHp: 0,
      hitDiceUsed: 0,
      spellSlotsUsed: {},
      activeConditions: [],
    },
    ...overrides,
  };
}

test('POST /characters-storage creates a new character', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getOrCreateUser();
    const payload = createBaseCharacter(userId);

    const response = await app.inject({
      method: 'POST',
      url: '/characters-storage',
      payload,
    });

    assert.equal(response.statusCode, 201);
    const created = response.json();
    assert.ok(created.id);
    assert.equal(created.name, payload.name);
  } finally {
    await app.close();
  }
});

test('GET /characters-storage lists characters', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getOrCreateUser();
    await app.inject({
      method: 'POST',
      url: '/characters-storage',
      payload: createBaseCharacter(userId, { name: 'List Me' }),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/characters-storage',
    });

    assert.equal(response.statusCode, 200);
    const list = response.json();
    assert.ok(Array.isArray(list));
    assert.ok(list.some((c: any) => c.name === 'List Me'));
  } finally {
    await app.close();
  }
});

test('GET /characters-storage/:id returns character', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getOrCreateUser();
    const createRes = await app.inject({
      method: 'POST',
      url: '/characters-storage',
      payload: createBaseCharacter(userId, { name: 'Fetch Me' }),
    });
    const created = createRes.json();

    const response = await app.inject({
      method: 'GET',
      url: `/characters-storage/${created.id}`,
    });

    assert.equal(response.statusCode, 200);
    const character = response.json();
    assert.equal(character.id, created.id);
    assert.equal(character.name, 'Fetch Me');
  } finally {
    await app.close();
  }
});
