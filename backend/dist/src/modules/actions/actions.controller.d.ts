import type { CharacterRecord, DerivedAction } from '@shared/contracts';
import type { DeriveActionsRequestDto } from './dto/index.js';
import { ActionsService } from './actions.service.js';
export declare class ActionsController {
    private readonly actionsService;
    constructor(actionsService: ActionsService);
    deriveActions(request: DeriveActionsRequestDto | CharacterRecord): Promise<DerivedAction[]>;
}
//# sourceMappingURL=actions.controller.d.ts.map