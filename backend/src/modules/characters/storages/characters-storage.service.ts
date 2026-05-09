import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaCharacterRepository } from '../persistence/prisma-character-repository.js';
import type { CreateCharacterDto } from './characters-storage.controller.js';

/**
 * Serviço de armazenamento básico de personagens.
 * Usa Prisma para persistência, sem projeção ou cálculo de derivados.
 */
@Injectable()
export class CharactersStorageService {
  constructor(
    @Inject(PrismaCharacterRepository)
    private readonly repository: PrismaCharacterRepository,
  ) {}

  async list(): Promise<Array<{ id: string; name: string }>> {
    const characters = await this.repository.list();
    return characters.map(({ id, name }) => ({ id, name }));
  }

  async findById(id: string): Promise<any> {
    try {
      return await this.repository.findById(id);
    } catch (err: any) {
      if (err.status === 404) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
          message: `Character "${id}" not found.`,
        });
      }
      throw err;
    }
  }

  async create(dto: CreateCharacterDto): Promise<any> {
    const id = `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const data = {
      id,
      userId: dto.userId || 'default',
      name: dto.name || 'Unnamed',
      ruleset: dto.ruleset || '5e',
      lineageId: dto.lineageId || 'human',
      backgroundId: dto.backgroundId || 'custom',
      alignment: dto.alignment || 'Neutral',
      experience: dto.experience || 0,
      abilities: dto.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      classes: dto.classes || [{ classId: 'commoner', level: 1 }],
      inventory: dto.inventory || [],
      spellChoices: dto.spellChoices || [],
      backgroundChoices: dto.backgroundChoices || [],
      runtimeState: dto.runtimeState || {
        hp: 10,
        maxHpOverride: null,
        tempHp: 0,
        hitDiceUsed: 0,
        spellSlotsUsed: {},
        activeConditions: [],
      },
    };

    return this.repository.create(data as any);
  }
}
