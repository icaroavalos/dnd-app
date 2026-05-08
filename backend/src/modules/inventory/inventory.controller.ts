import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';

import type { CharacterRecord } from '../../domain/contracts/index.js';
import type { RecoverAmmoRequest, SpendAmmoRequest } from './inventory.service.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService
  ) {}

  @Post('spend-ammo')
  @HttpCode(200)
  spendAmmo(@Body() request: SpendAmmoRequest): Promise<CharacterRecord> {
    return this.inventoryService.spendAmmo(request);
  }

  @Post('recover-ammo')
  @HttpCode(200)
  recoverAmmo(@Body() request: RecoverAmmoRequest): Promise<CharacterRecord> {
    return this.inventoryService.recoverAmmo(request);
  }
}
