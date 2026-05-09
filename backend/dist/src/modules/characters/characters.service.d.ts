import type { CharacterRecord, DerivedCharacterSheet } from '@shared/contracts';
import { RulesService } from '../rules/rules.service.js';
export declare class CharactersService {
    private readonly rulesService;
    constructor(rulesService: RulesService);
    projectCharacter(character: CharacterRecord): Promise<DerivedCharacterSheet>;
}
//# sourceMappingURL=characters.service.d.ts.map