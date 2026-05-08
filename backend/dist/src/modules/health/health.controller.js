var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.js';
import { RulesService } from '../rules/rules.service.js';
let HealthController = class HealthController {
    appConfigService;
    rulesService;
    constructor(appConfigService, rulesService) {
        this.appConfigService = appConfigService;
        this.rulesService = rulesService;
    }
    getHealth() {
        return {
            status: 'ok',
            app: 'dnd-app-backend',
            transport: 'fastify',
            environment: this.appConfigService.environment
        };
    }
    async getReadiness() {
        try {
            await this.rulesService.getCatalog('classes');
        }
        catch (error) {
            throw new ServiceUnavailableException({
                code: 'RULES_DATA_UNAVAILABLE',
                message: 'The local compacted rules dataset is not available for backend reads.'
            });
        }
        return {
            status: 'ready',
            app: 'dnd-app-backend',
            rulesData: 'ok',
            rulesDataDir: this.appConfigService.rulesDataDir
        };
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "getHealth", null);
__decorate([
    Get('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getReadiness", null);
HealthController = __decorate([
    Controller('health'),
    __param(0, Inject(AppConfigService)),
    __param(1, Inject(RulesService)),
    __metadata("design:paramtypes", [AppConfigService,
        RulesService])
], HealthController);
export { HealthController };
//# sourceMappingURL=health.controller.js.map