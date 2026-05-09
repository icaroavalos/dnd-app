import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/index.js';

/**
 * Repositório de personagens usando Prisma.
 * Interface: repositório bem testado para operações CRUD.
 */
@Injectable()
export class PrismaCharacterRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  /**
   * Lista todos os personagens (apenas resumo).
   */
  async list(): Promise<Array<{ id: string; name: string; level: number; primaryClass: string }>> {
    const characters = await this.prisma.character.findMany({
      include: {
        classes: {
          orderBy: { id: 'asc' },
          take: 1,
        },
      },
    });

    return characters.map((char) => ({
      id: char.id,
      name: char.name,
      level: this.calculateTotalLevel(char),
      primaryClass: char.classes[0]?.classId || 'unknown',
    }));
  }

  /**
   * Busca um personagem por ID.
   */
  async findById(id: string): Promise<CharacterData> {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        abilities: true,
        classes: true,
        inventory: true,
        spellChoices: true,
        backgroundChoices: true,
        runtimeState: true,
      },
    });

    if (!character) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    return this.toCharacterData(character);
  }

  /**
   * Cria um novo personagem.
   */
  async create(data: CreateCharacterInput): Promise<CharacterData> {
    const existing = await this.prisma.character.findUnique({
      where: { id: data.id },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CHARACTER_ALREADY_EXISTS',
        message: `Character "${data.id}" already exists.`,
      });
    }

    const character = await this.prisma.character.create({
      data: {
        id: data.id,
        userId: data.userId,
        name: data.name,
        ruleset: data.ruleset,
        lineageId: data.lineageId,
        backgroundId: data.backgroundId,
        alignment: data.alignment,
        experience: data.experience,
        abilities: {
          create: {
            str: data.abilities.str,
            dex: data.abilities.dex,
            con: data.abilities.con,
            int: data.abilities.int,
            wis: data.abilities.wis,
            cha: data.abilities.cha,
          },
        },
        classes: {
          create: data.classes.map((cls) => ({
            classId: cls.classId,
            level: cls.level,
          })),
        },
        inventory: {
          create: data.inventory.map((item) => ({
            baseItemId: item.baseItemId,
            quantity: item.quantity,
            status: item.status,
          })),
        },
        spellChoices: {
          create: data.spellChoices.map((spell) => ({
            spellId: spell.spellId,
            spellcastingAbility: spell.spellcastingAbility,
          })),
        },
        backgroundChoices: {
          create: data.backgroundChoices.map((choice) => ({
            choiceType: choice.choiceType,
            value: choice.value,
          })),
        },
        runtimeState: {
          create: {
            hp: data.runtimeState.hp,
            maxHpOverride: data.runtimeState.maxHpOverride,
            tempHp: data.runtimeState.tempHp,
            hitDiceUsed: data.runtimeState.hitDiceUsed,
            spellSlotsUsed: JSON.stringify(data.runtimeState.spellSlotsUsed),
            activeConditions: JSON.stringify(data.runtimeState.activeConditions),
          },
        },
      },
      include: {
        abilities: true,
        classes: true,
        inventory: true,
        spellChoices: true,
        backgroundChoices: true,
        runtimeState: true,
      },
    });

    return this.toCharacterData(character);
  }

  /**
   * Atualiza um personagem existente.
   */
  async update(id: string, data: UpdateCharacterInput): Promise<CharacterData> {
    const existing = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    const character = await this.prisma.character.update({
      where: { id },
      data: {
        name: data.name,
        alignment: data.alignment,
        experience: data.experience,
        abilities: data.abilities
          ? {
              update: {
                str: data.abilities.str,
                dex: data.abilities.dex,
                con: data.abilities.con,
                int: data.abilities.int,
                wis: data.abilities.wis,
                cha: data.abilities.cha,
              },
            }
          : undefined,
        inventory: data.inventory
          ? {
              deleteMany: {},
              create: data.inventory.map((item) => ({
                baseItemId: item.baseItemId,
                quantity: item.quantity,
                status: item.status,
              })),
            }
          : undefined,
        runtimeState: data.runtimeState
          ? {
              update: {
                hp: data.runtimeState.hp,
                maxHpOverride: data.runtimeState.maxHpOverride,
                tempHp: data.runtimeState.tempHp,
                hitDiceUsed: data.runtimeState.hitDiceUsed,
              },
            }
          : undefined,
      },
      include: {
        abilities: true,
        classes: true,
        inventory: true,
        spellChoices: true,
        backgroundChoices: true,
        runtimeState: true,
      },
    });

    return this.toCharacterData(character);
  }

  /**
   * Remove um personagem por ID.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.character.delete({
      where: { id },
    });
  }

  /**
   * Verifica se um personagem existe por ID.
   */
  async exists(id: string): Promise<boolean> {
    const character = await this.prisma.character.findUnique({
      where: { id },
    });
    return !!character;
  }

  private calculateTotalLevel(char: any): number {
    return char.classes?.reduce((sum: number, cls: any) => sum + (cls.level || 0), 0) || 0;
  }

  private toCharacterData(data: any): CharacterData {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      ruleset: data.ruleset,
      lineageId: data.lineageId,
      backgroundId: data.backgroundId,
      alignment: data.alignment,
      experience: data.experience,
      abilities: {
        str: data.abilities?.str || 10,
        dex: data.abilities?.dex || 10,
        con: data.abilities?.con || 10,
        int: data.abilities?.int || 10,
        wis: data.abilities?.wis || 10,
        cha: data.abilities?.cha || 10,
      },
      classes: data.classes || [],
      inventory: data.inventory || [],
      spellChoices: data.spellChoices || [],
      backgroundChoices: data.backgroundChoices || [],
      runtimeState: {
        hp: data.runtimeState?.hp || 10,
        maxHpOverride: data.runtimeState?.maxHpOverride || null,
        tempHp: data.runtimeState?.tempHp || 0,
        hitDiceUsed: data.runtimeState?.hitDiceUsed || 0,
        spellSlotsUsed: data.runtimeState?.spellSlotsUsed
          ? JSON.parse(data.runtimeState.spellSlotsUsed)
          : {},
        activeConditions: data.runtimeState?.activeConditions
          ? JSON.parse(data.runtimeState.activeConditions)
          : [],
      },
    };
  }
}

export interface CharacterData {
  id: string;
  userId: string;
  name: string;
  ruleset: string;
  lineageId: string;
  backgroundId: string;
  alignment: string;
  experience: number;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  classes: Array<{ classId: string; level: number }>;
  inventory: Array<{ baseItemId: string; quantity: number; status: string }>;
  spellChoices: Array<{ spellId: string; spellcastingAbility?: string }>;
  backgroundChoices: Array<{ choiceType: string; value: string }>;
  runtimeState: {
    hp: number;
    maxHpOverride: number | null;
    tempHp: number;
    hitDiceUsed: number;
    spellSlotsUsed: Record<string, number>;
    activeConditions: string[];
  };
}

export interface CreateCharacterInput {
  id: string;
  userId: string;
  name: string;
  ruleset: string;
  lineageId: string;
  backgroundId: string;
  alignment: string;
  experience: number;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  classes: Array<{ classId: string; level: number }>;
  inventory: Array<{ baseItemId: string; quantity: number; status: string }>;
  spellChoices: Array<{ spellId: string; spellcastingAbility?: string }>;
  backgroundChoices: Array<{ choiceType: string; value: string }>;
  runtimeState: {
    hp: number;
    maxHpOverride: number | null;
    tempHp: number;
    hitDiceUsed: number;
    spellSlotsUsed: Record<string, number>;
    activeConditions: string[];
  };
}

export interface UpdateCharacterInput {
  name?: string;
  alignment?: string;
  experience?: number;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  inventory?: Array<{ baseItemId: string; quantity: number; status: string }>;
  runtimeState?: {
    hp: number;
    maxHpOverride: number | null;
    tempHp: number;
    hitDiceUsed: number;
    spellSlotsUsed?: Record<string, number>;
    activeConditions?: string[];
  };
}
