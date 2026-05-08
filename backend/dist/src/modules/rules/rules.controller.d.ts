import type { RulesCatalogResponse } from './contracts/rules-catalog-entry.js';
import { RulesService } from './rules.service.js';
export declare class RulesController {
    private readonly rulesService;
    constructor(rulesService: RulesService);
    getBackgrounds(): Promise<RulesCatalogResponse>;
    getClasses(): Promise<RulesCatalogResponse>;
    getSpells(): Promise<RulesCatalogResponse>;
    getClassSpells(): Promise<RulesCatalogResponse>;
    getSpecies(): Promise<RulesCatalogResponse>;
    getItems(): Promise<RulesCatalogResponse>;
    getFeatures(): Promise<RulesCatalogResponse>;
    getFeats(): Promise<RulesCatalogResponse>;
}
//# sourceMappingURL=rules.controller.d.ts.map