import type { CharacterRecord } from '@shared/contracts';
import { type UseResourceRequestDto, type RecoverResourcesRequestDto } from './dto/index.js';
export declare class ResourcesService {
    useResource(request: UseResourceRequestDto): CharacterRecord;
    recoverResources(request: RecoverResourcesRequestDto): CharacterRecord;
}
//# sourceMappingURL=resources.service.d.ts.map