import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Criar usuário de teste
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed-password-placeholder',
    },
  });

  console.log(`Usuário criado: ${testUser.email}`);

  // Criar personagem de teste
  const character = await prisma.character.create({
    data: {
      userId: testUser.id,
      name: 'Valen Shadowblade',
      ruleset: '5e',
      lineageId: 'elf',
      backgroundId: 'criminal',
      alignment: 'Chaotic Neutral',
      experience: 0,
      abilities: {
        create: {
          str: 8,
          dex: 16,
          con: 14,
          int: 12,
          wis: 10,
          cha: 14,
        },
      },
      classes: {
        create: {
          classId: 'rogue',
          level: 1,
        },
      },
      inventory: {
        create: [
          { baseItemId: 'dagger', quantity: 2, status: 'carried' },
          { baseItemId: 'leather_armor', quantity: 1, status: 'equipped_armor' },
          { baseItemId: 'thieves_tools', quantity: 1, status: 'carried' },
        ],
      },
      spellChoices: {
        create: [],
      },
      backgroundChoices: {
        create: [
          { choiceType: 'skill', value: 'Stealth' },
          { choiceType: 'skill', value: 'Deception' },
          { choiceType: 'tool', value: 'Thieves Tools' },
          { choiceType: 'language', value: "Thieves' Cant" },
        ],
      },
      runtimeState: {
        create: {
          hp: 10,
          tempHp: 0,
          hitDiceUsed: 0,
          spellSlotsUsed: '{}',
          activeConditions: '[]',
        },
      },
    },
    include: {
      abilities: true,
      classes: true,
      inventory: true,
      backgroundChoices: true,
      runtimeState: true,
    },
  });

  console.log(`Personagem criado: ${character.name} (ID: ${character.id})`);

  // Segundo personagem para teste de listagem
  const character2 = await prisma.character.create({
    data: {
      userId: testUser.id,
      name: 'Thorin Ironforge',
      ruleset: '5e',
      lineageId: 'dwarf',
      backgroundId: 'soldier',
      alignment: 'Lawful Good',
      experience: 300,
      abilities: {
        create: {
          str: 16,
          dex: 10,
          con: 16,
          int: 8,
          wis: 12,
          cha: 10,
        },
      },
      classes: {
        create: {
          classId: 'fighter',
          level: 3,
        },
      },
      inventory: {
        create: [
          { baseItemId: 'warhammer', quantity: 1, status: 'equipped_weapon' },
          { baseItemId: 'chain_mail', quantity: 1, status: 'equipped_armor' },
          { baseItemId: 'shield', quantity: 1, status: 'equipped_shield' },
        ],
      },
      backgroundChoices: {
        create: [
          { choiceType: 'skill', value: 'Athletics' },
          { choiceType: 'skill', value: 'Intimidation' },
          { choiceType: 'tool', value: 'Land Vehicles' },
        ],
      },
      runtimeState: {
        create: {
          hp: 28,
          tempHp: 0,
          hitDiceUsed: 1,
          spellSlotsUsed: '{}',
          activeConditions: '[]',
        },
      },
    },
  });

  console.log(`Personagem criado: ${character2.name} (ID: ${character2.id})`);
  console.log('Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
