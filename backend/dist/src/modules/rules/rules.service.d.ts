import type { RulesCatalogKind, RulesCatalogResponse } from './contracts/rules-catalog-entry.js';
import { RulesRepository } from './rules.repository.js';
export declare class RulesService {
    private readonly rulesRepository;
    constructor(rulesRepository: RulesRepository);
    getCatalog(kind: RulesCatalogKind): Promise<RulesCatalogResponse>;
}
//# sourceMappingURL=rules.service.d.ts.map