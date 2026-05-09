import type { CharacterRecord } from '@shared/contracts';
import type { RecoverAmmoRequestDto, SpendAmmoRequestDto } from './dto/index.js';
import { InventoryService } from './inventory.service.js';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    spendAmmo(request: SpendAmmoRequestDto): Promise<CharacterRecord>;
    recoverAmmo(request: RecoverAmmoRequestDto): Promise<CharacterRecord>;
}
//# sourceMappingURL=inventory.controller.d.ts.map