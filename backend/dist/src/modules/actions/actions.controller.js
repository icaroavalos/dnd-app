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
import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ActionsService } from './actions.service.js';
let ActionsController = class ActionsController {
    actionsService;
    constructor(actionsService) {
        this.actionsService = actionsService;
    }
    deriveActions(request) {
        // Support both legacy format (direct CharacterRecord) and DTO format
        const character = 'classes' in request ? request : request.character;
        return this.actionsService.deriveActions(character);
    }
};
__decorate([
    Post('derive'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActionsController.prototype, "deriveActions", null);
ActionsController = __decorate([
    Controller('actions'),
    __param(0, Inject(ActionsService)),
    __metadata("design:paramtypes", [ActionsService])
], ActionsController);
export { ActionsController };
//# sourceMappingURL=actions.controller.js.map