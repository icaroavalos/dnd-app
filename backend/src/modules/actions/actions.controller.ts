import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';

import type { CharacterRecord, DerivedAction } from '../../domain/contracts/index.js';
import { ActionsService } from './actions.service.js';

@Controller('actions')
export class ActionsController {
  constructor(
    @Inject(ActionsService)
    private readonly actionsService: ActionsService
  ) {}

  @Post('derive')
  @HttpCode(200)
  deriveActions(@Body() character: CharacterRecord): Promise<DerivedAction[]> {
    return this.actionsService.deriveActions(character);
  }
}
