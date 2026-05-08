import { Module } from '@nestjs/common';

import { RulesModule } from '../rules/rules.module.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [RulesModule],
  controllers: [InventoryController],
  providers: [InventoryService]
})
export class InventoryModule {}
