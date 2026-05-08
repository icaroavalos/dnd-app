var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module.js';
import { RulesController } from './rules.controller.js';
import { RulesRepository } from './rules.repository.js';
import { RulesService } from './rules.service.js';
let RulesModule = class RulesModule {
};
RulesModule = __decorate([
    Module({
        imports: [AppConfigModule],
        controllers: [RulesController],
        providers: [RulesRepository, RulesService],
        exports: [RulesService]
    })
], RulesModule);
export { RulesModule };
//# sourceMappingURL=rules.module.js.map