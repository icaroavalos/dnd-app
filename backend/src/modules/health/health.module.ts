import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../config/app-config.module.js';
import { RulesModule } from '../rules/rules.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [AppConfigModule, RulesModule],
  controllers: [HealthController]
})
export class HealthModule {}
