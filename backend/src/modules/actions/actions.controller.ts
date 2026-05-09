import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { CharacterRecord, DerivedAction } from '@shared/contracts';
import type { DeriveActionsRequestDto } from './dto/index.js';
import { ActionsService } from './actions.service.js';

@Controller('actions')
export class ActionsController {
  constructor(
    @Inject(ActionsService)
    private readonly actionsService: ActionsService
  ) {}

  @Post('derive')
  @HttpCode(200)
  deriveActions(@Body() request: DeriveActionsRequestDto | CharacterRecord): Promise<DerivedAction[]> {
    // Support both legacy format (direct CharacterRecord) and DTO format
    const character = 'classes' in request ? request : (request as DeriveActionsRequestDto).character;
    return this.actionsService.deriveActions(character);
  }
}
