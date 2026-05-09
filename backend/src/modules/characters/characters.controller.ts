import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';

import type {
  CharacterRecord,
  DerivedCharacterSheet
} from '@shared/contracts';
import { CharactersService } from './characters.service.js';

@Controller('characters')
export class CharactersController {
  constructor(
    @Inject(CharactersService)
    private readonly charactersService: CharactersService
  ) {}

  @Post('project')
  @HttpCode(200)
  projectCharacter(@Body() character: CharacterRecord): Promise<DerivedCharacterSheet> {
    return this.charactersService.projectCharacter(character);
  }
}
