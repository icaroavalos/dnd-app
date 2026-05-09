import { Body, Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { CharactersStorageService } from './characters-storage.service.js';

/**
 * Controller básico para persistência de personagens.
 * Diferente do characters-persistence, este não faz projeção,
 * apenas armazena e recupera dados brutos.
 */
@Controller('characters-storage')
export class CharactersStorageController {
  constructor(
    @Inject(CharactersStorageService)
    private readonly storageService: CharactersStorageService,
  ) {}

  /**
   * Lista todos os personagens armazenados (apenas IDs e nomes).
   */
  @Get()
  @HttpCode(200)
  async list(): Promise<Array<{ id: string; name: string }>> {
    return this.storageService.list();
  }

  /**
   * Busca um personagem por ID (dados brutos, sem projeção).
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string): Promise<any> {
    return this.storageService.findById(id);
  }

  /**
   * Cria um novo personagem (armazenamento puro, sem projeção).
   */
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateCharacterDto): Promise<any> {
    return this.storageService.create(dto);
  }
}

export interface CreateCharacterDto {
  userId: string;
  name: string;
  ruleset?: string;
  lineageId?: string;
  backgroundId?: string;
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
  classes?: Array<{ classId: string; level: number }>;
  inventory?: Array<{ baseItemId: string; quantity: number; status: string }>;
  spellChoices?: Array<{ spellId: string; spellcastingAbility?: string }>;
  backgroundChoices?: Array<{ choiceType: string; value: string }>;
  runtimeState?: {
    hp: number;
    maxHpOverride: number | null;
    tempHp: number;
    hitDiceUsed: number;
    spellSlotsUsed: Record<string, number>;
    activeConditions: string[];
  };
}
