import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { CharacterRecord } from '@shared/contracts';
import type { RecoverAmmoRequestDto, SpendAmmoRequestDto } from './dto/index.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService
  ) {}

  @Post('spend-ammo')
  @HttpCode(200)
  spendAmmo(@Body() request: SpendAmmoRequestDto): Promise<CharacterRecord> {
    return this.inventoryService.spendAmmo(request);
  }

  @Post('recover-ammo')
  @HttpCode(200)
  recoverAmmo(@Body() request: RecoverAmmoRequestDto): Promise<CharacterRecord> {
    return this.inventoryService.recoverAmmo(request);
  }
}
