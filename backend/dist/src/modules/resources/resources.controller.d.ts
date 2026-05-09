import type { CharacterRecord } from '@shared/contracts';
import type { RecoverResourcesRequestDto, UseResourceRequestDto } from './dto/index.js';
import { ResourcesService } from './resources.service.js';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    useResource(request: UseResourceRequestDto): CharacterRecord;
    recoverResources(request: RecoverResourcesRequestDto): CharacterRecord;
}
//# sourceMappingURL=resources.controller.d.ts.map