import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../config/app-config.module.js';
import { RulesController } from './rules.controller.js';
import { RulesRepository } from './rules.repository.js';
import { RulesService } from './rules.service.js';

@Module({
  imports: [AppConfigModule],
  controllers: [RulesController],
  providers: [RulesRepository, RulesService],
  exports: [RulesService]
})
export class RulesModule {}
