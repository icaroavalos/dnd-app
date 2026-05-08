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
import { Controller, Get, Inject } from '@nestjs/common';
import { RulesService } from './rules.service.js';
let RulesController = class RulesController {
    rulesService;
    constructor(rulesService) {
        this.rulesService = rulesService;
    }
    getBackgrounds() {
        return this.rulesService.getCatalog('backgrounds');
    }
    getClasses() {
        return this.rulesService.getCatalog('classes');
    }
    getSpells() {
        return this.rulesService.getCatalog('spells');
    }
    getClassSpells() {
        return this.rulesService.getCatalog('class-spells');
    }
    getSpecies() {
        return this.rulesService.getCatalog('species');
    }
    getItems() {
        return this.rulesService.getCatalog('items');
    }
    getFeatures() {
        return this.rulesService.getCatalog('features');
    }
    getFeats() {
        return this.rulesService.getCatalog('feats');
    }
};
__decorate([
    Get('backgrounds'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getBackgrounds", null);
__decorate([
    Get('classes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getClasses", null);
__decorate([
    Get('spells'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getSpells", null);
__decorate([
    Get('class-spells'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getClassSpells", null);
__decorate([
    Get('species'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getSpecies", null);
__decorate([
    Get('items'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getItems", null);
__decorate([
    Get('features'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getFeatures", null);
__decorate([
    Get('feats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getFeats", null);
RulesController = __decorate([
    Controller('rules'),
    __param(0, Inject(RulesService)),
    __metadata("design:paramtypes", [RulesService])
], RulesController);
export { RulesController };
//# sourceMappingURL=rules.controller.js.map