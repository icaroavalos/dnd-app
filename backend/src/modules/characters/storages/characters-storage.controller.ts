import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put } from '@nestjs/common';
import { CharactersStorageService } from './characters-storage.service.js';
import type { CreateCharacterDto } from '../dto/create-character.dto.js';
import type { UpdateCharacterDto } from '../dto/update-character.dto.js';

/**
 * Controller CRUD canônico para personagens.
 * Usa Prisma para persistência de CharacterRecord completo.
 *
 * Rotas:
 * - GET /characters - Lista todos os personagens (resumo)
 * - GET /characters/:id - Busca um personagem por ID
 * - POST /characters - Cria um novo personagem
 * - PUT /characters/:id - Atualiza um personagem existente
 * - DELETE /characters/:id - Remove um personagem
 */
@Controller('characters')
export class CharactersStorageController {
  constructor(
    @Inject(CharactersStorageService)
    private readonly storageService: CharactersStorageService,
  ) {}

  /**
   * Lista todos os personagens (apenas resumo).
   */
  @Get()
  @HttpCode(200)
  async list(): Promise<Array<{ id: string; name: string; level: number; primaryClass: string }>> {
    return this.storageService.list();
  }

  /**
   * Busca um personagem por ID (CharacterRecord completo).
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string): Promise<any> {
    return this.storageService.findById(id);
  }

  /**
   * Cria um novo personagem.
   */
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateCharacterDto): Promise<any> {
    return this.storageService.create(dto);
  }

  /**
   * Atualiza um personagem existente.
   */
  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() dto: UpdateCharacterDto): Promise<any> {
    return this.storageService.update(id, dto);
  }

  /**
   * Remove um personagem por ID.
   */
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    return this.storageService.delete(id);
  }
}
