import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/main.js';
import { PrismaClient } from '../generated/prisma/index.js';

async function getTestUserId(): Promise<string> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    let user = await prisma.user.findFirst({ where: { email: 'test-ledger-legacy@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'test-ledger-legacy@example.com', username: 'test-ledger-legacy' },
      });
    }
    return user.id;
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestCharacter(userId: string, app: any) {
  const res = await app.inject({
    method: 'POST',
    url: '/characters-storage',
    payload: {
      userId,
      name: 'Ledger Legacy Test',
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
      runtimeState: { hp: 12, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] },
    },
  });
  return res.json();
}

test('POST /characters/:id/resources/damage records damage event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/damage`,
      payload: { amount: 5, currentHp: 12, description: 'Goblin attack' },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.ok(body.event);
    assert.equal(body.event.eventType, 'HP_CHANGE');
    assert.equal(body.event.amount, -5);
    assert.equal(body.event.source, 'damage');
  } finally {
    await app.close();
  }
});

test('POST /characters/:id/resources/heal records healing event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/heal`,
      payload: { amount: 8, currentHp: 7, description: 'Cure Wounds' },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.ok(body.event);
    assert.equal(body.event.eventType, 'HP_CHANGE');
    assert.equal(body.event.amount, 8);
    assert.equal(body.event.source, 'healing');
  } finally {
    await app.close();
  }
});

test('POST /characters/:id/resources/short-rest records rest event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/short-rest`,
      payload: { hitDiceSpent: 1, hpRegained: 8, description: 'Short rest in dungeon' },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.ok(body.event);
    assert.equal(body.event.eventType, 'REST_APPLIED');
    assert.equal(body.hpRegained, 8);
    assert.equal(body.hitDiceSpent, 1);
  } finally {
    await app.close();
  }
});

test('POST /characters/:id/resources/long-rest records rest event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/long-rest`,
      payload: { hpRegained: 12, description: 'Long rest at inn' },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.ok(body.event);
    assert.equal(body.event.eventType, 'REST_APPLIED');
    assert.equal(body.event.source, 'long_rest');
    assert.equal(body.hpRegained, 12);
  } finally {
    await app.close();
  }
});

test('GET /characters/:id/resources/ledger returns event history', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/damage`,
      payload: { amount: 5, currentHp: 12 },
    });

    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/heal`,
      payload: { amount: 3, currentHp: 7 },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/characters/${character.id}/resources/ledger`,
    });

    assert.equal(response.statusCode, 200);
    const ledger = response.json();
    assert.ok(Array.isArray(ledger));
    assert.ok(ledger.length >= 2);
  } finally {
    await app.close();
  }
});
