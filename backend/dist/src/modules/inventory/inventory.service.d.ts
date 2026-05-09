import type { CharacterRecord } from '@shared/contracts';
import { RulesService } from '../rules/rules.service.js';
import type { SpendAmmoRequestDto, RecoverAmmoRequestDto } from './dto/index.js';
export declare class InventoryService {
    private readonly rulesService;
    constructor(rulesService: RulesService);
    spendAmmo(request: SpendAmmoRequestDto): Promise<CharacterRecord>;
    recoverAmmo(request: RecoverAmmoRequestDto): Promise<CharacterRecord>;
    private resolveWeaponAmmoContext;
}
//# sourceMappingURL=inventory.service.d.ts.map