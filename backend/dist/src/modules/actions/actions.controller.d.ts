import type { CharacterRecord, DerivedAction } from '../../domain/contracts/index.js';
import { ActionsService } from './actions.service.js';
export declare class ActionsController {
    private readonly actionsService;
    constructor(actionsService: ActionsService);
    deriveActions(character: CharacterRecord): Promise<DerivedAction[]>;
}
//# sourceMappingURL=actions.controller.d.ts.map