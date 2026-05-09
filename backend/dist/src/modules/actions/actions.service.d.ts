import type { CharacterRecord, DerivedAction } from '@shared/contracts';
import { CharactersService } from '../characters/characters.service.js';
import { RulesService } from '../rules/rules.service.js';
export declare class ActionsService {
    private readonly rulesService;
    private readonly charactersService;
    constructor(rulesService: RulesService, charactersService: CharactersService);
    deriveActions(character: CharacterRecord): Promise<DerivedAction[]>;
}
//# sourceMappingURL=actions.service.d.ts.map