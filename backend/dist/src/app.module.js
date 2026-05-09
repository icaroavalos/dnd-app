var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { ActionsModule } from './modules/actions/actions.module.js';
import { CharactersModule } from './modules/characters/characters.module.js';
import { CharactersStorageModule } from './modules/characters/storages/characters-storage.module.js';
import { ResourceLedgerModule } from './modules/characters/ledger/resource-ledger.module.js';
import { ResourceProjectionModule } from './modules/characters/ledger/resource-projection.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { ResourcesModule } from './modules/resources/resources.module.js';
import { RulesModule } from './modules/rules/rules.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            AppConfigModule,
            HealthModule,
            RulesModule,
            CharactersModule,
            CharactersStorageModule,
            ResourceLedgerModule,
            ResourceProjectionModule,
            ResourcesModule,
            InventoryModule,
            ActionsModule
        ]
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map