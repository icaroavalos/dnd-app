import { AppConfigService } from '../../config/app-config.js';
import { RulesService } from '../rules/rules.service.js';
export declare class HealthController {
    private readonly appConfigService;
    private readonly rulesService;
    constructor(appConfigService: AppConfigService, rulesService: RulesService);
    getHealth(): {
        status: 'ok';
        app: 'dnd-app-backend';
        transport: 'fastify';
        environment: string;
    };
    getReadiness(): Promise<{
        status: 'ready';
        app: 'dnd-app-backend';
        rulesData: 'ok';
        rulesDataDir: string;
    }>;
}
//# sourceMappingURL=health.controller.d.ts.map