import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/index.js';
import type { CharacterRecord } from '@shared/contracts';

/**
 * Repositório de personagens usando Prisma.
 * Armazena CharacterRecord completo como JSON snapshot no campo recordJson.
 * Campos simples (name, ruleset, lineageId, etc.) são sincronizados para listagem.
 */

export interface CreateCharacterInput extends CharacterRecord {
  userId?: string;
}

@Injectable()
export class PrismaCharacterRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Garante que o usuário 'system' existe, criando se necessário.
   */
  private async ensureSystemUser(): Promise<string> {
    const systemUser = await this.prisma.user.findFirst({
      where: { email: 'system@localhost' },
    });
    if (systemUser) {
      return systemUser.id;
    }
    const newUser = await this.prisma.user.create({
      data: {
        email: 'system@localhost',
        username: 'system',
      },
    });
    return newUser.id;
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

    return characters.map((char: any) => ({
      id: char.id,
      name: char.name,
      level: this.calculateTotalLevel(char),
      primaryClass: char.classes[0]?.classId || 'unknown',
    }));
  }

  /**
   * Busca um personagem por ID.
   * Se recordJson existir e não for "{}", retorna o CharacterRecord canônico.
   */
  async findById(id: string): Promise<CharacterRecord> {
    const character = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    // Tenta usar recordJson como fonte canônica
    if (character.recordJson && character.recordJson !== '{}') {
      return JSON.parse(character.recordJson) as CharacterRecord;
    }

    // Fallback para o formato legado (não deve ocorrer em novos personagens)
    throw new NotFoundException({
      code: 'CHARACTER_NO_RECORD_JSON',
      message: `Character "${id}" has no recordJson. Use legacy format not supported.`,
    });
  }

  /**
   * Cria um novo personagem com CharacterRecord completo.
   */
  async create(data: CreateCharacterInput): Promise<CharacterRecord> {
    const existing = await this.prisma.character.findUnique({
      where: { id: data.id },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CHARACTER_ALREADY_EXISTS',
        message: `Character "${data.id}" already exists.`,
      });
    }

    const userId = data.userId || await this.ensureSystemUser();
    const recordJson = JSON.stringify(data);

    await this.prisma.character.create({
      data: {
        id: data.id,
        userId,
        name: data.name,
        ruleset: data.ruleset,
        lineageId: data.lineageId,
        backgroundId: data.backgroundId,
        alignment: data.alignment ?? undefined,
        experience: data.experience,
        recordJson,
        // Campos relacionais mantidos para compatibilidade, mas não são a fonte canônica
        classes: {
          create: data.classes?.map((cls) => ({
            classId: cls.classId,
            level: cls.level,
          })) || [],
        },
      },
    });

    return data as CharacterRecord;
  }

  /**
   * Atualiza um personagem existente com CharacterRecord completo.
   */
  async update(id: string, data: CharacterRecord): Promise<CharacterRecord> {
    const existing = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    const recordJson = JSON.stringify(data);

    await this.prisma.character.update({
      where: { id },
      data: {
        name: data.name,
        ruleset: data.ruleset,
        lineageId: data.lineageId,
        backgroundId: data.backgroundId,
        alignment: data.alignment ?? undefined,
        experience: data.experience,
        recordJson,
        // Atualiza campos relacionais para compatibilidade
        classes: {
          deleteMany: {},
          create: data.classes?.map((cls) => ({
            classId: cls.classId,
            level: cls.level,
          })) || [],
        },
      },
    });

    return data;
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
}
