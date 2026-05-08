import type { CharacterRecord, DerivedCharacterSheet } from '../../domain/contracts/index.js';
import { CharactersService } from './characters.service.js';
export declare class CharactersController {
    private readonly charactersService;
    constructor(charactersService: CharactersService);
    projectCharacter(character: CharacterRecord): Promise<DerivedCharacterSheet>;
}
//# sourceMappingURL=characters.controller.d.ts.map