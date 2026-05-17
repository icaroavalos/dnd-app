import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaCharacterRepository } from '../persistence/prisma-character-repository.js';
import type { CreateCharacterDto } from '../dto/create-character.dto.js';
import type { UpdateCharacterDto } from '../dto/update-character.dto.js';
import type { CharacterRecord } from '@shared/contracts';

/**
 * Serviço de armazenamento de personagens usando Prisma.
 * Gerencia CharacterRecord completo, sem projeção.
 */
@Injectable()
export class CharactersStorageService {
  constructor(
    @Inject(PrismaCharacterRepository)
    private readonly repository: PrismaCharacterRepository,
  ) {}

  /**
   * Lista todos os personagens (apenas resumo).
   */
  async list(): Promise<Array<{ id: string; name: string; level: number; primaryClass: string }>> {
    return this.repository.list();
  }

  /**
   * Busca um personagem por ID.
   */
  async findById(id: string): Promise<CharacterRecord> {
    return this.repository.findById(id);
  }

  /**
   * Cria um novo personagem.
   */
  async create(dto: CreateCharacterDto): Promise<CharacterRecord> {
    const id = dto.id || `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const characterRecord: CharacterRecord = {
      ...dto,
      id,
      ruleset: dto.ruleset || '5e',
      name: dto.name || 'Unnamed',
      lineageId: dto.lineageId || 'human',
      backgroundId: dto.backgroundId || 'custom',
      alignment: dto.alignment ?? 'Neutral',
      experience: dto.experience ?? 0,
      classes: dto.classes || [{ classId: 'commoner', level: 1 }],
      abilities: dto.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      skillProficiencies: dto.skillProficiencies || [],
      savingThrowProficiencies: dto.savingThrowProficiencies || [],
      inventory: dto.inventory || [],
      spellChoices: dto.spellChoices || [],
      backgroundChoices: dto.backgroundChoices ?? null,
      features: dto.features || [],
      attacks: dto.attacks || [],
      resources: dto.resources || {},
      state: dto.state || {
        hp: 10,
        maxHpOverride: null,
        tempHp: 0,
        hitDiceUsed: 0,
        spellSlotsUsed: {},
        activeConditions: [],
      },
    };

    return this.repository.create(characterRecord);
  }

  /**
   * Atualiza um personagem existente.
   */
  async update(id: string, dto: UpdateCharacterDto): Promise<CharacterRecord> {
    const existing = await this.repository.findById(id);

    const updatedRecord: CharacterRecord = {
      ...existing,
      ...dto,
    };

    return this.repository.update(id, updatedRecord);
  }

  /**
   * Remove um personagem por ID.
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
