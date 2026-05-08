import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module.js';
import { ActionsModule } from './modules/actions/actions.module.js';
import { CharactersModule } from './modules/characters/characters.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { ResourcesModule } from './modules/resources/resources.module.js';
import { RulesModule } from './modules/rules/rules.module.js';

@Module({
  imports: [
    AppConfigModule,
    HealthModule,
    RulesModule,
    CharactersModule,
    ResourcesModule,
    InventoryModule,
    ActionsModule
  ]
})
export class AppModule {}
