import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put } from '@nestjs/common';
import type { CharacterRecord } from '@shared/contracts';
import type { CreateCharacterDto, UpdateCharacterDto } from './dto/index.js';
import { CharactersPersistenceService } from './characters-persistence.service.js';

@Controller('characters-persistence')
export class CharactersPersistenceController {
  constructor(
    @Inject(CharactersPersistenceService)
    private readonly charactersPersistenceService: CharactersPersistenceService,
  ) {}

  /**
   * Lista todos os personagens cadastrados.
   *
   * @returns Lista de resumos de personagens
   */
  @Get()
  @HttpCode(200)
  async list(): Promise<Array<{ id: string; name: string; level: number; primaryClass: string }>> {
    return this.charactersPersistenceService.list();
  }

  /**
   * Busca um personagem por ID.
   *
   * @param id ID do personagem
   * @returns Dados completos do personagem
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string): Promise<CharacterRecord> {
    return this.charactersPersistenceService.findById(id);
  }

  /**
   * Cria um novo personagem.
   *
   * @param dto Dados do personagem (sem ID ou com ID gerado)
   * @returns Personagem criado
   */
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateCharacterDto): Promise<CharacterRecord> {
    return this.charactersPersistenceService.create(dto);
  }

  /**
   * Atualiza um personagem existente.
   *
   * @param id ID do personagem
   * @param dto Dados atualizados do personagem
   * @returns Personagem atualizado
   */
  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() dto: UpdateCharacterDto): Promise<CharacterRecord> {
    return this.charactersPersistenceService.update({ ...dto, id });
  }

  /**
   * Remove um personagem por ID.
   *
   * @param id ID do personagem
   */
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.charactersPersistenceService.delete(id);
  }
}
