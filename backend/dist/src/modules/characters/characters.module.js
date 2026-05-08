var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RulesModule } from '../rules/rules.module.js';
import { CharactersController } from './characters.controller.js';
import { CharactersService } from './characters.service.js';
let CharactersModule = class CharactersModule {
};
CharactersModule = __decorate([
    Module({
        imports: [RulesModule],
        controllers: [CharactersController],
        providers: [CharactersService],
        exports: [CharactersService]
    })
], CharactersModule);
export { CharactersModule };
//# sourceMappingURL=characters.module.js.map