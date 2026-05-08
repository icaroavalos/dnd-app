import { Inject, Injectable } from '@nestjs/common';

import type {
  RulesCatalogKind,
  RulesCatalogResponse
} from './contracts/rules-catalog-entry.js';
import { RulesRepository } from './rules.repository.js';

@Injectable()
export class RulesService {
  constructor(
    @Inject(RulesRepository)
    private readonly rulesRepository: RulesRepository
  ) {}

  getCatalog(kind: RulesCatalogKind): Promise<RulesCatalogResponse> {
    return this.rulesRepository.readCatalog(kind);
  }
}
