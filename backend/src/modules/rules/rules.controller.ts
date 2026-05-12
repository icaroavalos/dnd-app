import { Controller, Get, Inject } from '@nestjs/common';

import type { RulesCatalogResponse } from './contracts/rules-catalog-entry.js';
import { RulesService } from './rules.service.js';

@Controller('rules')
export class RulesController {
  constructor(
    @Inject(RulesService)
    private readonly rulesService: RulesService
  ) {}

  @Get('backgrounds')
  getBackgrounds(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('backgrounds');
  }

  @Get('classes')
  getClasses(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('classes');
  }

  @Get('spells')
  getSpells(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('spells');
  }

  @Get('class-spells')
  getClassSpells(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('class-spells');
  }

  @Get('species')
  getSpecies(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('species');
  }

  @Get('items')
  getItems(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('items');
  }

  @Get('features')
  getFeatures(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('features');
  }

  @Get('feats')
  getFeats(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('feats');
  }

  @Get('subraces')
  getSubraces(): Promise<RulesCatalogResponse> {
    return this.rulesService.getCatalog('subraces');
  }
}
