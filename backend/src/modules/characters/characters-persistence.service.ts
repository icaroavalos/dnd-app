import { Inject, Injectable } from '@nestjs/common';
import type { CharacterRecord } from '@shared/contracts';
import { CharacterPersistenceService } from './persistence/character-persistence.service.js';
import type { CreateCharacterDto, UpdateCharacterDto } from './dto/index.js';
import { CharactersService } from './characters.service.js';

/**
 * Serviço de gerenciamento de persistência de personagens.
 *
 * Camada de aplicação que coordena:
 * - Validação de dados (via DTOs)
 * - Projeção de dados derivados (via CharactersService)
 * - Persistência (via CharacterPersistenceService)
 */
@Injectable()
export class CharactersPersistenceService {
  constructor(
    @Inject(CharacterPersistenceService)
    private readonly persistenceService: CharacterPersistenceService,
    @Inject(CharactersService)
    private readonly charactersService: CharactersService,
  ) {}

  /**
   * Lista todos os personagens cadastrados.
   */
  async list(): Promise<Array<{ id: string; name: string; level: number; primaryClass: string }>> {
    return this.persistenceService.list();
  }

  /**
   * Busca um personagem por ID com dados projetados.
   */
  async findById(id: string): Promise<CharacterRecord & { projected?: any }> {
    const character = this.persistenceService.findById(id);
    return character;
  }

  /**
   * Cria um novo personagem.
   */
  async create(dto: CreateCharacterDto): Promise<CharacterRecord> {
    const character: CharacterRecord = {
      ...dto,
      id: dto.id || this.generateId(),
    };

    // Valida projetando o personagem (lança erro se inválido)
    await this.charactersService.projectCharacter(character);

    return this.persistenceService.create(character);
  }

  /**
   * Atualiza um personagem existente.
   */
  async update(dto: UpdateCharacterDto): Promise<CharacterRecord> {
    // Valida projetando o personagem (lança erro se inválido)
    await this.charactersService.projectCharacter(dto.character);

    return this.persistenceService.update(dto.id, dto.character);
  }

  /**
   * Remove um personagem por ID.
   */
  async delete(id: string): Promise<void> {
    this.persistenceService.delete(id);
  }

  /**
   * Verifica se um personagem existe por ID.
   */
  exists(id: string): boolean {
    return this.persistenceService.exists(id);
  }

  private generateId(): string {
    return `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
