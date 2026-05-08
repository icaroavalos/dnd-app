import { Module } from '@nestjs/common';

import { CharactersModule } from '../characters/characters.module.js';
import { RulesModule } from '../rules/rules.module.js';
import { ActionsController } from './actions.controller.js';
import { ActionsService } from './actions.service.js';

@Module({
  imports: [RulesModule, CharactersModule],
  controllers: [ActionsController],
  providers: [ActionsService]
})
export class ActionsModule {}
