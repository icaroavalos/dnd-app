import type { CharacterRecord, RecoveryType } from '../../domain/contracts/index.js';
export interface UseResourceRequest {
    character: CharacterRecord;
    resourceId: string;
    amount?: number;
}
export interface RecoverResourcesRequest {
    character: CharacterRecord;
    recovery: Extract<RecoveryType, 'short_rest' | 'long_rest'>;
}
export declare class ResourcesService {
    useResource(request: UseResourceRequest): CharacterRecord;
    recoverResources(request: RecoverResourcesRequest): CharacterRecord;
}
//# sourceMappingURL=resources.service.d.ts.map