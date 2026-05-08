import type { CharacterRecord } from '../../domain/contracts/index.js';
import { RulesService } from '../rules/rules.service.js';
export interface SpendAmmoRequest {
    character: CharacterRecord;
    weaponItemId: string;
    amount?: number;
}
export interface RecoverAmmoRequest {
    character: CharacterRecord;
    weaponItemId: string;
    amount?: number;
}
export declare class InventoryService {
    private readonly rulesService;
    constructor(rulesService: RulesService);
    spendAmmo(request: SpendAmmoRequest): Promise<CharacterRecord>;
    recoverAmmo(request: RecoverAmmoRequest): Promise<CharacterRecord>;
    private resolveWeaponAmmoContext;
}
//# sourceMappingURL=inventory.service.d.ts.map