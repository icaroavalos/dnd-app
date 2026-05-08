import type { CharacterRecord } from '../../domain/contracts/index.js';
import type { RecoverResourcesRequest, UseResourceRequest } from './resources.service.js';
import { ResourcesService } from './resources.service.js';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    useResource(request: UseResourceRequest): CharacterRecord;
    recoverResources(request: RecoverResourcesRequest): CharacterRecord;
}
//# sourceMappingURL=resources.controller.d.ts.map