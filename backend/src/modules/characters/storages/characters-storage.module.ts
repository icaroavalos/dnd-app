import { Module } from '@nestjs/common';
import { CharactersStorageController } from './characters-storage.controller.js';
import { CharactersStorageService } from './characters-storage.service.js';
import { PrismaCharacterRepository } from '../persistence/prisma-character-repository.js';

@Module({
  controllers: [CharactersStorageController],
  providers: [CharactersStorageService, PrismaCharacterRepository],
  exports: [CharactersStorageService, PrismaCharacterRepository],
})
export class CharactersStorageModule {}
