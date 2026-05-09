import { Module } from '@nestjs/common';
import { CharactersPersistenceService } from './characters-persistence.service.js';
import { CharactersPersistenceController } from './characters-persistence.controller.js';
import { CharacterPersistenceService } from './persistence/character-persistence.service.js';
import { CharactersModule } from './characters.module.js';

/**
 * Módulo de persistência de personagens.
 *
 * Fornece endpoints para:
 * - Listar personagens
 * - Criar novo personagem
 * - Buscar personagem por ID
 * - Atualizar personagem
 * - Remover personagem
 *
 * Endpoints:
 * - GET  /characters-persistence - Lista todos
 * - GET  /characters-persistence/:id - Busca por ID
 * - POST /characters-persistence - Cria novo
 * - PUT  /characters-persistence/:id - Atualiza
 * - DELETE /characters-persistence/:id - Remove
 */
@Module({
  imports: [CharactersModule],
  providers: [CharactersPersistenceService, CharacterPersistenceService],
  controllers: [CharactersPersistenceController],
  exports: [CharactersPersistenceService, CharacterPersistenceService],
})
export class CharactersPersistenceModule {}
