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
    let character: any;
    if ('classes' in request && Array.isArray(request.classes)) {
      character = request as CharacterRecord;
    } else if ('character' in request) {
      character = (request as DeriveActionsRequestDto).character;
    } else {
      // Frontend sends simplified format with single class string
      // Convert to full CharacterRecord format
      const frontendFormat = request as { class?: string; level?: number; abilities?: Record<string, number>; name?: string };
      character = {
        id: 'temp-id',
        ruleset: '5.5e-2024',
        name: frontendFormat.name || 'Unnamed',
        lineageId: 'human',
        backgroundId: 'commoner',
        experience: 0,
        classes: frontendFormat.class ? [{ className: frontendFormat.class, level: frontendFormat.level || 1 }] : [],
        abilities: frontendFormat.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        skillProficiencies: [],
        savingThrowProficiencies: [],
        inventory: [],
        spells: [],
        spellChoices: [],
        resources: {},
        state: { maxHpOverride: undefined },
      };
    }
    return this.actionsService.deriveActions(character);
  }
}
