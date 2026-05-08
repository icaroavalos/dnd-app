import { AppConfigService } from '../../config/app-config.js';
import type { RulesCatalogKind, RulesCatalogResponse } from './contracts/rules-catalog-entry.js';
export declare class RulesRepository {
    private readonly appConfigService;
    private readonly cache;
    constructor(appConfigService: AppConfigService);
    getDataDir(): string;
    readCatalog(kind: RulesCatalogKind): Promise<RulesCatalogResponse>;
    private readSingleFileCatalog;
    private readClassSpellsCatalog;
    private readCombinedFeatures;
    private readRawFile;
}
//# sourceMappingURL=rules.repository.d.ts.map