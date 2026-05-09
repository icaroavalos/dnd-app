import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/main.js';
import { PrismaClient } from '../generated/prisma/index.js';

async function getTestUserId(): Promise<string> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    let user = await prisma.user.findFirst({ where: { email: 'test-ledger-events@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'test-ledger-events@example.com', username: 'test-ledger-events' },
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
    url: '/characters',
    payload: {
      userId,
      name: 'Ledger Events Test',
      ruleset: '5e',
      lineageId: 'human',
      backgroundId: 'soldier',
      alignment: 'Neutral',
      experience: 0,
      abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
      classes: [{ classId: 'fighter', level: 1 }],
      inventory: [{ baseItemId: 'arrow', quantity: 20, status: 'carried' }],
      runtimeState: { hp: 12, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] },
    },
  });
  return res.json();
}

test('POST /use-resource - RESOURCE_USED event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/use-resource`,
      payload: {
        resourceType: 'ki',
        amount: 2,
        source: 'flurry_of_blows',
        description: 'Monk flurry of blows',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.event.eventType, 'RESOURCE_USED');
    assert.equal(body.event.resourceType, 'ki');
    assert.equal(body.event.amount, -2);
  } finally {
    await app.close();
  }
});

test('POST /rest - REST_APPLIED event (short rest)', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/rest`,
      payload: {
        restType: 'short',
        hpRegained: 5,
        hitDiceRegained: 0,
        description: 'Short rest after combat',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.event.eventType, 'REST_APPLIED');
    assert.equal(body.event.source, 'short_rest');
  } finally {
    await app.close();
  }
});

test('POST /ammo/spend - AMMO_SPENT event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/ammo/spend`,
      payload: {
        itemId: 'arrow',
        quantity: 3,
        source: 'attack',
        description: 'Fired 3 arrows',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.event.eventType, 'AMMO_SPENT');
    assert.equal(body.event.resourceType, 'ammo');
    assert.equal(body.event.amount, -3);
    assert.equal(body.event.metadata?.itemId, 'arrow');
  } finally {
    await app.close();
  }
});

test('POST /ammo/recover - AMMO_RECOVERED event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/ammo/recover`,
      payload: {
        itemId: 'arrow',
        quantity: 5,
        source: 'loot',
        description: 'Recovered arrows from defeated enemy',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.event.eventType, 'AMMO_RECOVERED');
    assert.equal(body.event.amount, 5);
  } finally {
    await app.close();
  }
});

test('GET /ledger/events - filter by event type', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    // Create some AMMO_SPENT events
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/ammo/spend`,
      payload: { itemId: 'arrow', quantity: 1, source: 'attack' },
    });

    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/ammo/spend`,
      payload: { itemId: 'bolt', quantity: 2, source: 'attack' },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/characters/${character.id}/resources/ledger/events?event=AMMO_SPENT`,
    });

    assert.equal(response.statusCode, 200);
    const events = response.json();
    assert.ok(Array.isArray(events));
    assert.ok(events.length >= 2);
    events.forEach((e: any) => {
      assert.equal(e.eventType, 'AMMO_SPENT');
    });
  } finally {
    await app.close();
  }
});

test('POST /hit-die - HIT_DIE event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/hit-die`,
      payload: {
        amount: -1,
        source: 'short_rest',
        description: 'Spent hit die during short rest',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.event.eventType, 'HIT_DIE');
    assert.equal(body.event.amount, -1);
  } finally {
    await app.close();
  }
});

test('POST /spell-slot - SPELL_SLOT event', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    const response = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/spell-slot`,
      payload: {
        slotLevel: 3,
        description: 'Cast Fireball',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.event.eventType, 'SPELL_SLOT');
    assert.equal(body.event.amount, 3);
  } finally {
    await app.close();
  }
});
