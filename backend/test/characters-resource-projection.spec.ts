import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/main.js';
import { PrismaClient } from '../generated/prisma/index.js';

async function getTestUserId(): Promise<string> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    let user = await prisma.user.findFirst({ where: { email: 'test-projection@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'test-projection@example.com', username: 'test-projection' },
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
      name: 'Projection Test',
      ruleset: '5e',
      lineageId: 'human',
      backgroundId: 'soldier',
      alignment: 'Neutral',
      experience: 0,
      abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
      classes: [{ classId: 'fighter', level: 1 }],
      inventory: [],
      runtimeState: { hp: 12, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] },
    },
  });
  return res.json();
}

test('POST /resources/projection/rebuild creates projection from events', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    // Cria alguns eventos
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

    // Rebuild projection
    const rebuildRes = await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/projection/rebuild`,
    });

    assert.equal(rebuildRes.statusCode, 200);
    const rebuildBody = rebuildRes.json();
    assert.equal(rebuildBody.characterId, character.id);
    assert.ok(rebuildBody.currentHp !== undefined);
  } finally {
    await app.close();
  }
});

test('GET /resources/projection returns projected resources', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    // Cria eventos de HP
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

    // Primeiro, projeta
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/projection/rebuild`,
    });

    // Busca projeção
    const response = await app.inject({
      method: 'GET',
      url: `/characters/${character.id}/resources/projection`,
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.ok(body.currentHp !== undefined);
    assert.ok(body.spellSlots !== undefined);
    assert.ok(body.ammo !== undefined);
  } finally {
    await app.close();
  }
});

test('GET /resources/projection returns spell slot usage', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    // Usa slots de magia
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/spell-slot`,
      payload: { slotLevel: 3, description: 'Cast Fireball' },
    });

    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/spell-slot`,
      payload: { slotLevel: 1, description: 'Cast Magic Missile' },
    });

    // Rebuild
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/projection/rebuild`,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/characters/${character.id}/resources/projection`,
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.ok(body.spellSlotsUsed);
  } finally {
    await app.close();
  }
});

test('GET /resources/projection returns ammo count', async () => {
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  try {
    const userId = await getTestUserId();
    const character = await createTestCharacter(userId, app);

    // Gasta munição
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/ammo/spend`,
      payload: { itemId: 'arrow', quantity: 3, source: 'attack' },
    });

    // Recupera munição
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/ammo/recover`,
      payload: { itemId: 'arrow', quantity: 10, source: 'loot' },
    });

    // Rebuild
    await app.inject({
      method: 'POST',
      url: `/characters/${character.id}/resources/projection/rebuild`,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/characters/${character.id}/resources/projection`,
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.ok(body.ammo);
    assert.equal(body.ammo.arrow, 7); // -3 + 10
  } finally {
    await app.close();
  }
});
