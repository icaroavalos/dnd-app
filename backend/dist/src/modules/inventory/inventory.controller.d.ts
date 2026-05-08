import type { CharacterRecord } from '../../domain/contracts/index.js';
import type { RecoverAmmoRequest, SpendAmmoRequest } from './inventory.service.js';
import { InventoryService } from './inventory.service.js';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    spendAmmo(request: SpendAmmoRequest): Promise<CharacterRecord>;
    recoverAmmo(request: RecoverAmmoRequest): Promise<CharacterRecord>;
}
//# sourceMappingURL=inventory.controller.d.ts.map